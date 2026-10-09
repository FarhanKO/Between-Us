"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Renders a timestamp in the viewer's timezone. On the server (and first client
// paint) it renders a stable ISO fallback, so there's no hydration mismatch.
export function LocalTime({ iso, timeOnly = false }: { iso: string; timeOnly?: boolean }) {
  const text = useSyncExternalStore(
    subscribe,
    () => format(iso, timeOnly),
    () => null,
  );
  return <time dateTime={iso}>{text ?? iso.slice(0, 16).replace("T", " ")}</time>;
}

function format(iso: string, timeOnly: boolean) {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (timeOnly) return time;
  if (d.toDateString() === now.toDateString()) return `today ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return `tomorrow ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${time}`;
}
