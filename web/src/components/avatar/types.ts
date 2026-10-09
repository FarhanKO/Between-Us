// Avatar parameter schema. Stored as JSON in avatars.params and rendered by <Avatar/>.
// Keep this file dependency-free so it can be copied into the desktop app as-is.

export type Skin = "light" | "fair" | "tan" | "brown" | "dark";
export type Hair = "long_bangs" | "bob" | "short" | "ponytail" | "curly" | "buzz";
export type Outfit = "dress" | "tee_shorts" | "hoodie" | "shirt_pants" | "sweater_skirt" | "suit" | "overalls" | "kimono";
export type Accessory = "none" | "clip" | "bow" | "glasses" | "cap" | "crown" | "headphones" | "flower" | "scarf";

/** Premium items unlock with the matching feature (the database enforces it on save). */
export type PremiumFeature = "outfits_pack_1";
export const PREMIUM_OUTFITS: Record<string, PremiumFeature> = {
  sweater_skirt: "outfits_pack_1", suit: "outfits_pack_1", overalls: "outfits_pack_1", kimono: "outfits_pack_1",
};
export const PREMIUM_ACCESSORIES: Record<string, PremiumFeature> = {
  crown: "outfits_pack_1", headphones: "outfits_pack_1", flower: "outfits_pack_1", scarf: "outfits_pack_1",
};
export type Expression =
  | "neutral"
  | "happy"
  | "sad"
  | "wink"
  | "sleepy"
  | "love"
  | "surprised"
  | "laugh"
  | "angry"
  | "cry"
  | "shy"
  | "smug"
  | "thinking";

export interface AvatarParams {
  skin: Skin;
  hair: Hair;
  hairColor: string;
  outfit: Outfit;
  outfitColor: string;
  accessory: Accessory;
  accessoryColor: string;
  blush: boolean;
}

export const DEFAULT_AVATAR: AvatarParams = {
  skin: "light",
  hair: "long_bangs",
  hairColor: "#1F1B24",
  outfit: "dress",
  outfitColor: "#F472B6",
  accessory: "clip",
  accessoryColor: "#F472B6",
  blush: true,
};

export const SKIN_TONES: Record<Skin, string> = {
  light: "#FFE4D6",
  fair: "#F5D0B5",
  tan: "#D9A57A",
  brown: "#A66B44",
  dark: "#6B3F2A",
};

export const HAIR_OPTIONS: { id: Hair; label: string }[] = [
  { id: "long_bangs", label: "Long" },
  { id: "bob", label: "Bob" },
  { id: "short", label: "Short" },
  { id: "ponytail", label: "Ponytail" },
  { id: "curly", label: "Curly" },
  { id: "buzz", label: "Buzz" },
];

export const OUTFIT_OPTIONS: { id: Outfit; label: string; premium?: PremiumFeature }[] = [
  { id: "dress", label: "Dress" },
  { id: "tee_shorts", label: "Tee & shorts" },
  { id: "hoodie", label: "Hoodie" },
  { id: "shirt_pants", label: "Shirt & pants" },
  { id: "sweater_skirt", label: "Sweater & skirt", premium: "outfits_pack_1" },
  { id: "suit", label: "Suit", premium: "outfits_pack_1" },
  { id: "overalls", label: "Overalls", premium: "outfits_pack_1" },
  { id: "kimono", label: "Kimono", premium: "outfits_pack_1" },
];

export const ACCESSORY_OPTIONS: { id: Accessory; label: string; premium?: PremiumFeature }[] = [
  { id: "none", label: "None" },
  { id: "clip", label: "Hair clip" },
  { id: "bow", label: "Bow" },
  { id: "glasses", label: "Glasses" },
  { id: "cap", label: "Cap" },
  { id: "crown", label: "Crown", premium: "outfits_pack_1" },
  { id: "headphones", label: "Headphones", premium: "outfits_pack_1" },
  { id: "flower", label: "Flower", premium: "outfits_pack_1" },
  { id: "scarf", label: "Scarf", premium: "outfits_pack_1" },
];

/** Outfits drawn with trousers (legs take the outfit colour instead of skin). */
export const PANTS_OUTFITS: readonly Outfit[] = ["shirt_pants", "suit", "overalls"];

export const EXPRESSIONS: { id: Expression; label: string; emoji: string }[] = [
  { id: "neutral", label: "Neutral", emoji: "🙂" },
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "love", label: "In love", emoji: "😍" },
  { id: "laugh", label: "Laughing", emoji: "😂" },
  { id: "wink", label: "Wink", emoji: "😉" },
  { id: "shy", label: "Shy", emoji: "☺️" },
  { id: "smug", label: "Smug", emoji: "😏" },
  { id: "surprised", label: "Surprised", emoji: "😮" },
  { id: "thinking", label: "Thinking", emoji: "🤔" },
  { id: "sleepy", label: "Sleepy", emoji: "😴" },
  { id: "sad", label: "Sad", emoji: "😢" },
  { id: "cry", label: "Crying", emoji: "😭" },
  { id: "angry", label: "Grumpy", emoji: "😠" },
];

/** The face that matches a shared mood (profiles.mood_emoji); null when there's no mood. */
export function moodExpression(emoji: string | null | undefined): Expression | null {
  switch (emoji) {
    case "😊":
    case "🏠":
      return "happy";
    case "🥰":
      return "love";
    case "😴":
      return "sleepy";
    case "😮‍💨":
      return "thinking";
    case "😔":
      return "sad";
    case "🤒":
      return "cry";
    case "🔥":
      return "smug";
    case "🍕":
      return "surprised";
    case "📵":
      return "angry";
    default:
      return emoji ? "neutral" : null;
  }
}

export const HAIR_COLORS = [
  "#1F1B24", "#4A2C1A", "#7B4B2A", "#B0722E", "#E8C878",
  "#B3432B", "#F472B6", "#A78BFA", "#3B82F6", "#E5E7EB",
];

export const OUTFIT_COLORS = [
  "#F472B6", "#A78BFA", "#34D399", "#38BDF8", "#FBBF24",
  "#EF4444", "#F97316", "#1F2937", "#F9FAFB", "#7C3AED",
];

const HEX = /^#[0-9a-fA-F]{6}$/;

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function color(value: unknown, fallback: string) {
  return typeof value === "string" && HEX.test(value) ? value : fallback;
}

/** Validate untrusted JSON (from the DB) into a full AvatarParams, filling gaps with defaults. */
export function parseAvatarParams(input: unknown): AvatarParams {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_AVATAR;
  return {
    skin: pick(o.skin, Object.keys(SKIN_TONES) as Skin[], d.skin),
    hair: pick(o.hair, HAIR_OPTIONS.map((h) => h.id), d.hair),
    hairColor: color(o.hairColor, d.hairColor),
    outfit: pick(o.outfit, OUTFIT_OPTIONS.map((x) => x.id), d.outfit),
    outfitColor: color(o.outfitColor, d.outfitColor),
    accessory: pick(o.accessory, ACCESSORY_OPTIONS.map((x) => x.id), d.accessory),
    accessoryColor: color(o.accessoryColor, d.accessoryColor),
    blush: typeof o.blush === "boolean" ? o.blush : d.blush,
  };
}

/** Darken/lighten a hex color by a fraction (-1..1). */
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amount < 0 ? v * amount : (255 - v) * amount))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
