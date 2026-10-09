"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pathUpTo, type Doodle, type Stroke } from "./types";

// Replays a doodle the way it was drawn: strokes appear point by point on the
// original timing, with a little pen dot leading the line. Long pauses between
// strokes are shortened so a slow drawer doesn't make the viewer wait.

const MAX_GAP = 700; // ms a pause between strokes is allowed to last on replay
const MIN_STROKE = 60; // ms – so a single dot still "appears" rather than pops

type Timed = { stroke: Stroke; path: string; start: number; end: number; p: [number, number, number][] };

function schedule(d: Doodle): { items: Timed[]; total: number } {
  const items: Timed[] = [];
  let shift = 0; // cumulative time removed by shortening gaps
  let prevEnd = 0;
  for (const s of d.strokes) {
    const first = s.p[0][2];
    const last = s.p[s.p.length - 1][2];
    const gap = first - shift - prevEnd;
    if (gap > MAX_GAP) shift += gap - MAX_GAP;
    const start = first - shift;
    const end = Math.max(start + MIN_STROKE, last - shift);
    items.push({ stroke: s, path: pathUpTo(s, Infinity), start, end, p: s.p.map(([x, y, t]) => [x, y, t - shift]) });
    prevEnd = end;
  }
  return { items, total: prevEnd };
}

export function DoodleReplay({
  doodle,
  autoplay = true,
  size,
  className,
  onDone,
  showReplay = true,
}: {
  doodle: Doodle;
  autoplay?: boolean;
  /** CSS size (px or any unit). Default fills the container (aspect-ratio 1). */
  size?: number | string;
  className?: string;
  onDone?: () => void;
  showReplay?: boolean;
}) {
  const plan = useMemo(() => schedule(doodle), [doodle]);
  const [run, setRun] = useState(autoplay ? 1 : 0); // increments to replay; 0 = static
  const [t, setT] = useState(autoplay ? 0 : Infinity);
  const raf = useRef(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!run) return;
    // Wait until the page is actually visible (a push can open it in a background tab),
    // then run on real elapsed time. rAF is throttled to nothing in hidden tabs, so a
    // timer backstop keeps the replay from hanging if visibility flips mid-way.
    let t0 = 0;
    let finished = false;
    let timer = 0;
    const tick = () => {
      if (finished) return;
      cancelAnimationFrame(raf.current);
      clearTimeout(timer);
      if (!t0) {
        if (document.hidden) {
          timer = window.setTimeout(tick, 250);
          return;
        }
        t0 = performance.now();
      }
      const el = performance.now() - t0;
      if (el >= plan.total) {
        finished = true;
        setT(Infinity);
        doneRef.current?.();
        return;
      }
      setT(el);
      raf.current = requestAnimationFrame(tick);
      timer = window.setTimeout(tick, 250);
    };
    tick();
    return () => {
      finished = true;
      cancelAnimationFrame(raf.current);
      clearTimeout(timer);
    };
  }, [run, plan]);

  // pen position = last point drawn so far of the active stroke
  let pen: [number, number] | null = null;
  const paths: React.ReactNode[] = [];
  for (let i = 0; i < plan.items.length; i++) {
    const it = plan.items[i];
    if (t === Infinity || t >= it.end) {
      paths.push(<path key={i} d={it.path} stroke={it.stroke.c} strokeWidth={it.stroke.s} />);
      continue;
    }
    if (t < it.start) continue;
    let d = "";
    let last: [number, number] = [it.p[0][0], it.p[0][1]];
    for (const [x, y, pt] of it.p) {
      if (pt > t) break;
      d += (d ? " L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
      last = [x, y];
    }
    if (d && !d.includes("L")) d += " L" + last[0].toFixed(1) + " " + (last[1] + 0.01).toFixed(1);
    pen = last;
    if (d) paths.push(<path key={i} d={d} stroke={it.stroke.c} strokeWidth={it.stroke.s} />);
  }

  const playing = t !== Infinity && run > 0;
  const style = size != null ? { width: size, height: size } : undefined;

  return (
    <div className={`doodle-replay ${className ?? ""}`} style={style}>
      <svg viewBox={`0 0 ${doodle.w} ${doodle.h}`} className="doodle-replay__svg" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect width={doodle.w} height={doodle.h} fill={doodle.bg} rx={doodle.w * 0.04} />
        {paths}
        {pen && <circle cx={pen[0]} cy={pen[1]} r={5} className="doodle-replay__pen" />}
      </svg>
      {showReplay && !playing && (
        <button type="button" className="doodle-replay__btn" onClick={() => {
            setT(0);
            setRun((r) => r + 1);
          }} aria-label="Watch again">
          ↻
        </button>
      )}
    </div>
  );
}
