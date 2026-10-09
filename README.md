# Couple

A couple app where your partner's avatar lives on your screen — delivering reminders, notes, and pokes.

## Stack

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Backend  | Supabase (Postgres, Auth, Realtime, Storage)      |
| Web      | Next.js + React — accounts, pairing, avatar builder, store |
| Desktop  | Tauri v2 — transparent always-on-top desktop pet  |
| Avatar   | Parametric layered SVG (`web/src/components/avatar/`) — params + expressions; Rive is a possible later swap |
| Payments | Stripe Checkout → webhook → `entitlements`        |
| Android  | Kotlin — notifications + widget (later)           |

## Supabase

- Project: `Couple` (`tmumrgyuuykbuzbrnrcy`, ap-south-1)
- URL: `https://tmumrgyuuykbuzbrnrcy.supabase.co`
- Migrations live in `supabase/migrations/` and are applied to the hosted project.

### Data model

```
couples ──< profiles (1:1 auth.users)  ──1 avatars
   │            │
   │            └──< devices
   │
   ├──< entitlements >── features (catalog)
   ├──< purchases
   ├──< reminders   (created_by → target_user_id; timezone, notified_at)
   ├──< messages    (sender_id → recipient_id; kind: note | poke | voice | image | letter | quick;
   │                 media_path, deliver_at → released_at, open_when / opened_at, theme)
   ├──< quick_actions (per-couple pack: quick buttons + reaction emoji)
   ├──< reactions   (from_user_id → to_user_id; on a reminder or message; kind incl. missed)
   └──< reminder_misses  (reminders nobody answered; feeds "missed" summaries)

   ├──< important_dates  (calendar: birthday / anniversary / first_meet / trip / custom; remind_days, remind_time)
   └──< moments          (photos / voice notes; files in private storage bucket `moments`)

timeline_events (view)           one row per thing that happened, all of the above unioned
profiles ──1 notification_prefs  (push/desktop toggles, quiet hours, snooze options)
profiles ──< devices             (web-push subscriptions: endpoint + keys)
notification_outbox              (push queue; service role only)
pairing_codes  (6-char, 24h expiry, single use)
```

Core rule: **code ships in one binary; entitlements decide what's visible.**
`entitlements` belong to the *couple*, so one purchase unlocks both partners.

### RPCs (signed-in users)

| Function                                              | What it does                                              |
| ----------------------------------------------------- | --------------------------------------------------------- |
| `create_pairing_code()` → `text`                      | Generates a 6-char code for your partner to enter          |
| `redeem_pairing_code(code)` → `uuid`                  | Creates the couple, links both profiles, grants free features |
| `unpair()`                                            | Ends the couple, unlinks both profiles                     |
| `respond_to_reminder(id, 'done' \| 'snooze', mins)`   | Marks the reminder and sends a reaction back to the creator (snooze 1–1440 min) |
| `send_test_notification()` → `bool`                   | Queues a test push for the caller's devices                |
| `mark_misses_seen()` → `int`                          | Clears the caller's unseen missed reminders                |
| `vapid_public_key()` → `text`                         | Public VAPID key the browser subscribes with               |
| `moment_summaries(period, limit)`                     | Per-day / per-week counts behind the relationship summaries |
| `pause_notifications(minutes)` → `timestamptz`        | Mute everything until then (0 = resume)                    |
| `my_sessions()` / `revoke_session(id)` / `revoke_other_sessions()` | List and sign out browsers / desktop pets      |
| `set_retention(days)`                                 | 30 / 90 / 365 / null for the couple's chat + finished reminders |
| `block_user(id, reason)` / `unblock_user(id)`         | Block partner or ex-partner (blocking unpairs; they can't pair again) |
| `report_user(id, category, details, block)` → `uuid`  | File a report for the Couple team; optionally block         |
| `delete_my_account()`                                 | Ends the couple, deletes the auth user; everything cascades |
| `dismiss_ended_couple()`                              | Hide the "your pairing ended" notice                        |
| `open_letter(id)`                                     | Recipient breaks the seal on an "open when…" letter; sender is told |
| `set_mood(emoji, text, hours)`                        | Share a mood (empty emoji clears); partner gets a push      |
| `ttt_new_game()` / `ttt_move(game, cell)` / `ttt_resign(game)` | Tic-tac-toe (caller is X; DB validates turn, cell, win/draw) |
| `quiz_today()` / `quiz_answer(round, self, guess)`    | Daily quiz round for the couple; answers reveal once both are in |
| `grant_purchase(...)`                                 | Service role only — the Stripe webhook grants entitlements |
| `calendar_refresh()`                                  | Materialise this couple's upcoming calendar reminders now (the hourly cron does it anyway) |

### Realtime

Enabled on `reminders`, `messages`, `reactions`, `entitlements`, `avatars`, `profiles`, `notification_prefs`, `reminder_misses`, `moments`, `important_dates`.
Clients subscribe with `postgres_changes`; RLS filters rows to the couple automatically.

### RLS summary

- Everything is scoped by `my_couple_id()` / `my_partner_id()`.
- `features` is public-readable.
- `purchases` and `entitlements` are read-only for clients; only the service role (Stripe webhook) writes them.
- A profile trigger prevents a couple from ever having more than two members.

### Notifications (migrations 0006–0008, `supabase/functions/push/`)

Delivery no longer depends on the desktop app being open:

```
pg_cron (every minute) ──▶ reminder_tick()
   1. due reminders   → notified_at = now(), row in notification_outbox   (held during quiet hours)
   2. unanswered > N min → reminder_misses + reaction 'missed' to creator; repeats roll forward
   3. unseen misses  → one "You missed…" summary push per user (≤ every 15 min)
messages / reactions INSERT triggers ──▶ outbox (notes, pokes, replies)
outbox ──pg_net──▶ Edge Function `push` ──Web Push (VAPID)──▶ every device in `devices`
```

- **Web Push** works on Android (Chrome), desktop browsers, and iOS 16.4+ once the site is added to the
  Home Screen. Subscriptions live in `devices.push_subscription`; the worker disables a device on 404/410.
  `devices.platform` / `push_token` are ready for native FCM/APNs tokens later.
- **Preferences** (`notification_prefs`): push / desktop toggles, sound, per-kind toggles, quiet hours
  (evaluated in `profiles.timezone`, wraps midnight), snooze presets + default, missed-after threshold.
- **Timezone-aware repeats**: `reminders.timezone` is the target's zone at creation; `next_occurrence(from, rule, tz)`
  advances in local wall-clock time so a 9:00 reminder stays 9:00 across DST. `TimezoneSync` keeps
  `profiles.timezone` matching the browser.
- **Secrets** are in Vault, read by SQL helpers — nothing to `supabase secrets set`:
  `project_url`, `push_worker_secret` (shared header the worker checks), `vapid_public_key`,
  `vapid_private_key`, `vapid_subject`. Generate a pair with `npx web-push generate-vapid-keys`.
  Deploy the worker with `supabase functions deploy push --no-verify-jwt` (it authenticates with the shared secret).
- Debug: `select * from notification_outbox order by id desc;` and `select * from net._http_response order by created desc;`
  `select cron.schedule(...)` lives in migration 0007; `select * from cron.job_run_details order by start_time desc` shows ticks.

### Our moments (migration 0009)

`/moments` is the shared timeline. `timeline_events` (a `security_invoker` view, so table RLS applies) unions:
reminders created · reminder responses (`reactions` with `reminder_id`: done / snoozed / missed — self-reminders
included) · notes & pokes · note reactions · photos & voice notes (`moments`) · important dates, expanded to one
row per anniversary that has already come round. `moment_summaries('day'|'week')` counts events per period in the
viewer's timezone; the sentence ("A warm week 💞 — 5 reminders done (1 missed), 3 notes…") is composed in
`web/src/lib/moments.ts`.

Photos are downscaled client-side (≤1600px JPEG) and uploaded straight to the private `moments` bucket under
`<couple_id>/…` (storage RLS scopes by folder; partner reads, only the uploader deletes); the row is inserted via a
server action and rendered through 1-hour signed URLs. Voice notes use `MediaRecorder` (webm/opus, mp4 on Safari), max 5 min.

### Privacy & account controls (migrations 0010–0012, `supabase/functions/housekeeping/`)

- **Ending a couple** goes through `end_couple(couple, by, reason)` (`unpair` · `block` · `account_deleted`): the couple
  is marked ended, both profiles are unlinked but remember `previous_couple_id` / `ex_partner_*` for the dashboard notice,
  scheduled reminders are cancelled, unused pairing codes deleted, and the other side gets a `system` push
  ("X unpaired" — a block looks like an unpair). `redeem_pairing_code` refuses when either side has blocked the other.
- **Delete account**: the web action removes the user's own moment files (storage RLS), then `delete_my_account()` ends
  the couple and deletes `auth.users` → everything the user created cascades away for both partners. Reports they filed
  survive (`reporter_id` set null). Remaining files are queued in `storage_trash`.
- **Sessions**: `my_sessions()` reads `auth.sessions` (user agent, IP, current flag); revoking deletes the session, so the
  refresh token dies immediately and the access token within the hour.
- **Retention** (`retention_tick`, daily 03:23): per-couple `couples.retention_days` trims messages, finished reminders,
  misses and reactions; ended couples are purged 30 days after `ended_at` (photos/voice files via `storage_trash` +
  the `housekeeping` edge function); pairing codes and the push outbox after 7 days. Photos, voice notes and important
  dates of an active couple are never auto-deleted.
- **Pause** (`notification_prefs.muted_until`) is folded into `in_quiet_hours()`, so the tick, the push filter and the
  desktop pet all honour it.
- Reports live in `reports` (RLS: reporter reads own; review them with the service role / SQL editor).

### Expressive messages (migrations 0013–0014)

`messages.kind` grew `voice` · `image` · `letter` · `quick`. Media (voice/image) is uploaded by the browser to the
private `moments` bucket under `<couple_id>/msg/…` and shown through signed URLs (web timeline, pet bubble).
- **Scheduling**: `deliver_at` in the future → `released_at` stays null (RLS hides the row from the recipient) until
  `message_tick()` (pg_cron, every minute) releases it, pushes, and emits an UPDATE the pet listens for. Senders see
  their queue on the dashboard and can cancel.
- **"Open when…" letters**: `open_when` + `opened_at`. The recipient sees a sealed envelope (web `/letters/[id]`,
  pet bubble); `open_letter()` records an `opened` reaction → the sender is notified. Letters carry a `theme`
  (hearts / stars / petals / night) that drives the reveal animation.
- **Quick buttons & reaction packs** (`quick_actions`, seeded on pairing, editable at `/settings/reactions`):
  `quick` rows send a `quick` message ("🏠 I'm home — I'm home safe!"); `reaction` rows are the emoji shown as
  pokes and as the reply row under any message (stored as `reactions.kind = 'custom'` + `emoji`).
- **Moods**: `profiles.mood_*` (with expiry). Shown on the dashboard avatars and in the pet's name tag; changes push
  the partner (`notification_prefs.notify_moods`).

### Calendar (migrations 0017–0018)

`/calendar` is the relationship calendar: month grid, "coming up" countdowns, add/edit with a category
(🎂 birthday — whose · 💍 anniversary · 🌹 first met · ✈️ trip with an end date · 💖 custom), reminder leads
(1 month … on the day) and a time. **Automatic reminders** are real `reminders` rows: `calendar_tick()` (pg_cron,
hourly, and `calendar_refresh()` right after an edit) creates one per (event, occurrence, lead, person) up to 36 h
ahead, keyed by `reminders.calendar_key`, in each person's timezone — so they arrive through the pet bubble, push,
snooze and missed-summary machinery like any other reminder. Birthday leads go to the *other* partner; the birthday
person just gets "🎉 Happy birthday" on the day. Editing a date drops its pending reminders (re-created by the tick);
deleting cancels them. The dashboard's **Counting down** widget shows the next three dates.

### Games & premium modules (migrations 0015–0016)

- **Outfit Pack 1** (`outfits_pack_1`): sweater & skirt, suit, overalls, kimono; crown, headphones, flower, scarf.
  The builder greys them out without the entitlement and the `avatars_premium_gate` trigger refuses the save.
- **Tic-Tac-Toe** (`game_tictactoe`): `games` rows, one active per couple; all writes via `ttt_*` RPCs; Realtime
  keeps `/games/tictactoe` live; the other side gets a push and a pet bubble ("played — your move", "you won!").
- **Daily Quiz** (`game_quiz`): `quiz_questions` bank (30, some multiple-choice), one `quiz_rounds` row per couple
  per local day, `quiz_answers` (self + guess). RLS hides the partner's answers until you've answered
  (`quiz_i_answered()`); the page scores "who knows who better" across revealed rounds.
- **Store** (`/store`): the `features` catalog with ownership. `startCheckout()` opens Stripe Checkout with the
  couple/buyer/feature in metadata; `/api/stripe/webhook` verifies the signature and calls `grant_purchase()` with
  the service role. Buy buttons switch on when `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and
  `SUPABASE_SECRET_KEY` are set (see `.env.example`). Set `features.stripe_price_id` to bill against Stripe
  Prices instead of inline amounts.

### Doodles — live handwriting (migrations 0019–0020, `web/src/components/doodle/`)

- Premium module `doodles` ($1.99). A doodle is a `messages` row with `kind = 'doodle'` and the recording in
  `strokes`: `{ w, h, bg, strokes: [{ c, s, p: [[x, y, t_ms], …] }] }` (≤ 400 KB, ≤ 6000 points). It's a
  recording of *how* it was drawn, so the other side watches it appear stroke by stroke on the original timing.
- Web (mobile first, works in the PWA): "✍️ Doodle" tab in *Say something* → `DoodleCanvas` (pointer events, 8
  colours, 3 pen sizes, undo/clear, timestamps each point) → `sendMessage({ kind: "doodle", doodle })`. The push
  says "✍️ X drew you something" and opens `/doodles/<id>`, a full-screen `DoodleReplay` (SVG, rAF on real elapsed
  time, long pauses shortened to 0.7 s, pen dot, ↻ to watch again, waits for the tab to be visible) with the
  reaction pack underneath. The dashboard inbox lists doodles to watch; the timeline shows them inline.
- Desktop pet: the doodle arrives as a 💬 bubble that replays live while the avatar switches to the new
  `"drawing"` pose (holding a sketch pad, pencil hand scribbling); reactions reply straight from the bubble.
  The components are shared via the `@doodle` Vite alias (dependency-free React + `doodle.css`).
- RLS: `kind = 'doodle'` needs `has_feature('doodles')` and non-null `strokes`; notifications follow the
  *notes* toggle and quiet hours. Android widget / lock-screen replay needs the native app (see build order 8).

## Web app (`web/`)

```bash
cd web && npm install && npm run dev   # http://localhost:3000
```

Routes: `/` landing · `/signup` · `/login` · `/dashboard` (pairing, notes, pokes, upcoming reminders,
missed reminders, activity feed, features) · `/moments` (timeline, daily/weekly summaries, photos, voice notes,
important dates) · `/reminders` (create / cancel / history; done + snooze for
reminders aimed at you) · `/settings` → `/settings/notifications` (enable push on this device, registered devices, test
push, preferences, quiet hours, snooze) · `/settings/privacy` (pause notifications, signed-in devices, export, retention,
unpair with typed confirmation, block, report, delete account) · `/api/export` (JSON download, media links valid 1h) · `/avatar` (builder) · `/store` (step 6).
PWA: `public/manifest.webmanifest` + `public/sw.js` (push receiver; "Done" / "Snooze" actions call
`/api/reminders/respond` with the cookie session). `/api/push/subscribe` re-registers rotated subscriptions.
`src/proxy.ts` refreshes the Supabase session and guards private routes.
`.env.local` holds the public URL + publishable key (see `.env.example` at the repo root).

Test accounts (email-confirmed, password `testpass123`): `arwa@couple.test`, `farhan@couple.test`.

### Feature modules

`src/lib/features.ts` is the client-side registry (ids match `features.id`). Each module renders
unlocked or locked from the couple's `entitlements`, but the **database is the real gate**: migration
0005 adds `has_feature(id)` and uses it in the RLS insert policies for `reminders` (needs `reminders`)
and `messages` (`note`/`voice`/`image`/`letter` need `notes`, `doodle` needs `doodles`, the rest `pokes`).
A client that fakes an unlock gets a 403.

`CoupleWatcher` (client) subscribes to profiles/reminders/reactions/entitlements/avatars and calls
`router.refresh()`, so the web updates live when the partner acts on the desktop or a purchase lands.

### Avatar

`components/avatar/types.ts` is the schema (`AvatarParams`) + option lists + `parseAvatarParams()`
validator. `components/avatar/Avatar.tsx` is a pure SVG renderer (params + expression → picture),
so the same file is used by the desktop pet. 13 expressions: neutral · happy · love · laugh · wink ·
shy · smug · surprised · thinking · sleepy · sad · cry · angry (`EXPRESSIONS` in types.ts; the builder
previews each). `moodExpression(emoji)` maps a shared mood to a face: the dashboard avatars and the idle
pet wear the mood, and the pet reacts per event (poke ❤️ → love, partner won → you cry, etc.).
Poses: `front` (default), `side` (profile, drawn facing right; `walking` runs the leg/arm cycle) and
`drawing` (sketch pad, used while a doodle replays). The builder has a 🚶 Walk toggle to preview it.

## Desktop pet (`desktop/`, Tauri v2)

Prereqs (Windows): Rust via rustup, Visual Studio Build Tools with the C++ workload, WebView2 (built into Win11).

```bash
cd desktop && npm install && npm run tauri dev      # dev: hot-reloading pet window
cd desktop && npm run tauri build                   # installer in src-tauri/target/release/bundle/
```

- Transparent, frameless, always-on-top, no taskbar entry; parks itself flush with the right screen
  edge above the taskbar. Tray icon: show/hide, pause reminders, open dashboard, quit.
- **Choreography** (`components/Pet.tsx`): the pet lives off-screen. When there's something to
  deliver she walks in from the right edge (side-view pose with a walk cycle), turns to face you, and
  the bubble appears. After you respond she lingers ~1.4s, turns, and walks back out. The window is
  flush with the screen edge so "off the window" is "off the screen".
- `src/lib/usePet.ts` owns everything: auth session, couple/avatar loading, realtime subscriptions
  (reminders, messages, reactions, avatars, profile), the due-reminder timer, and the bubble queue.
- Reminder flow: due → bubble (`respond_to_reminder 'delivered'`) → **Yes** (`'done'`, shows "Good job!",
  sends a `done` reaction to the creator; repeating reminders roll to `next_occurrence`) or
  **Snooze** (default from prefs; ▾ opens the preset chips + a custom minutes box).
- Every bubble is mirrored as a native OS toast (`tauri-plugin-notification`) when
  `notification_prefs.desktop_enabled`; per-kind toggles and sound are honoured. In dev on Windows the
  toast is attributed to PowerShell until the app is installed from the bundle.
- Quiet hours (from prefs, machine clock) hold reminders and chatter; the pet shows a 🌙 badge.
- On launch, unseen `reminder_misses` show as one "While you were away" bubble; **Got it** calls `mark_misses_seen()`.
- **Start at login** (`tauri-plugin-autostart`) is enabled on first run and toggled from the tray menu, so
  reminders reach the desktop without anyone remembering to open the app.
- **Auto-update** (`tauri-plugin-updater`): the pet polls `<web>/desktop/latest.json` 20 s after start and
  every 6 h (tray: *Check for updates…*). A newer signed build shows an "Install & restart" bubble with a
  progress bar; the signature is verified against the pubkey in `tauri.conf.json`. Publishing a release:
  1. `TAURI_SIGNING_PRIVATE_KEY_PATH=~/.tauri/couple-updater.key npm run tauri build` (the keypair lives in
     `~/.tauri/`; the private key is never in the repo — lose it and you can't ship updates).
  2. `npm run release:manifest -- https://your-web-domain` copies the signed installers into
     `web/public/desktop/` and writes `latest.json` (Tauri updater format).
  3. Deploy the web app. Bump `version` in `tauri.conf.json` before each build.
  The endpoint is derived from `DASHBOARD_URL` in `lib.rs`, so it follows the web domain automatically.
- **Notification styles** (`notification_prefs`, migration 0021, set at `/settings/notifications`):
  `desktop_style` both / pet (bubble only) / toast (OS toast + a 💬 badge; click the badge to read —
  reminders still pop up), `bubble_theme` dark / light / blush, `sound_style` chime / pop / bell / none
  (synthesised with Web Audio, `web/src/lib/sounds.ts`), `push_style` normal / silent / sticky for the
  phone (stamped into `notification_outbox.data.style`, honoured by the `push` worker).
- Notes and pokes arrive live; anything sent while the app was closed is picked up on launch
  (`messages.delivered_at is null`, last 24h).
- The avatar renderer and DB types are aliased from `web/src` (see `vite.config.ts`) — one source of truth.
- `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_DASHBOARD_URL`.
- Dev note: editing `src/lib/*` triggers a full reload on purpose (Fast Refresh can't hot-swap a hook
  whose hook order changed and would leave the window blank).
