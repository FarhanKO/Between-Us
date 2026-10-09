// Doodle = a recording of how a drawing was made, not just the picture.
// Coordinates are in the canvas's own units (w × h); t is milliseconds since the first touch.
// Keep this file dependency-free: the desktop pet imports it through a Vite alias.

export type Point = [x: number, y: number, t: number];
export type Stroke = { c: string; s: number; p: Point[] };
export type Doodle = { w: number; h: number; bg: string; strokes: Stroke[] };

export const DOODLE_COLORS = ["#2a1f2b", "#e74796", "#7c3aed", "#38bdf8", "#34d399", "#fbbf24", "#f97316", "#ffffff"];
export const DOODLE_SIZES = [3, 6, 10];
export const DOODLE_BG = "#fff9fb";
export const DOODLE_MAX_POINTS = 6000;

const HEX = /^#[0-9a-fA-F]{6}$/;

export function parseDoodle(input: unknown): Doodle | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const w = Number(o.w);
  const h = Number(o.h);
  if (!(w > 0 && h > 0)) return null;
  const strokes: Stroke[] = [];
  let points = 0;
  for (const raw of Array.isArray(o.strokes) ? o.strokes : []) {
    const s = raw as Record<string, unknown>;
    const p: Point[] = [];
    for (const pt of Array.isArray(s.p) ? s.p : []) {
      if (!Array.isArray(pt) || pt.length < 3) continue;
      const [x, y, t] = pt.map(Number);
      if ([x, y, t].some((n) => !Number.isFinite(n))) continue;
      p.push([x, y, t]);
      if (++points > DOODLE_MAX_POINTS) break;
    }
    if (p.length) strokes.push({ c: typeof s.c === "string" && HEX.test(s.c) ? s.c : "#2a1f2b", s: Math.min(24, Math.max(1, Number(s.s) || 4)), p });
  }
  return { w, h, bg: typeof o.bg === "string" && HEX.test(o.bg) ? o.bg : DOODLE_BG, strokes };
}

/** Total replay length in ms (last timestamp). */
export function doodleDuration(d: Doodle) {
  let t = 0;
  for (const s of d.strokes) for (const p of s.p) if (p[2] > t) t = p[2];
  return t;
}

/** Points of one stroke up to time `t`, as an SVG path "M x y L x y …". */
export function pathUpTo(s: Stroke, t: number) {
  let d = "";
  for (const [x, y, pt] of s.p) {
    if (pt > t) break;
    d += (d ? " L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  // a single tap should still show a dot
  if (d && !d.includes("L")) d += " L" + s.p[0][0].toFixed(1) + " " + (s.p[0][1] + 0.01).toFixed(1);
  return d;
}
