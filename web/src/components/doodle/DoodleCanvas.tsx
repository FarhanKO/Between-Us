"use client";

import { useEffect, useRef, useState } from "react";
import { DOODLE_BG, DOODLE_COLORS, DOODLE_MAX_POINTS, DOODLE_SIZES, type Doodle, type Point, type Stroke } from "./types";

// Records a drawing as timed strokes. Square canvas in logical 320×320 units so the
// replay can be scaled to any size; finger/mouse/pen all via pointer events.

const SIZE = 320;

export function DoodleCanvas({
  onChange,
  resetKey = 0,
}: {
  onChange: (d: Doodle | null) => void;
  resetKey?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const startRef = useRef<number | null>(null);
  const pointsRef = useRef(0);
  const [color, setColor] = useState(DOODLE_COLORS[1]);
  const [size, setSize] = useState(DOODLE_SIZES[1]);
  const [count, setCount] = useState(0); // stroke count → enables undo/clear
  const [full, setFull] = useState(false);

  function ctx() {
    const c = canvasRef.current;
    if (!c) return null;
    const g = c.getContext("2d");
    if (!g) return null;
    const dpr = c.width / SIZE;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = "round";
    g.lineJoin = "round";
    return g;
  }

  function redraw() {
    const g = ctx();
    if (!g) return;
    g.fillStyle = DOODLE_BG;
    g.fillRect(0, 0, SIZE, SIZE);
    for (const s of strokesRef.current) {
      g.strokeStyle = s.c;
      g.lineWidth = s.s;
      g.beginPath();
      s.p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      if (s.p.length === 1) g.lineTo(s.p[0][0], s.p[0][1] + 0.01);
      g.stroke();
    }
  }

  function emit() {
    setCount(strokesRef.current.length);
    onChange(strokesRef.current.length ? { w: SIZE, h: SIZE, bg: DOODLE_BG, strokes: strokesRef.current.map((s) => ({ ...s, p: [...s.p] })) } : null);
  }

  // size the bitmap to the device pixel ratio once mounted / on reset
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    c.width = SIZE * dpr;
    c.height = SIZE * dpr;
    strokesRef.current = [];
    currentRef.current = null;
    startRef.current = null;
    pointsRef.current = 0;
    setFull(false);
    setCount(0);
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * SIZE;
    const y = ((e.clientY - r.top) / r.height) * SIZE;
    return [Math.max(0, Math.min(SIZE, x)), Math.max(0, Math.min(SIZE, y))];
  }

  function now() {
    if (startRef.current == null) startRef.current = performance.now();
    return Math.round(performance.now() - startRef.current);
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    if (full) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = pos(e);
    const t = now();
    currentRef.current = { c: color, s: size, p: [[x, y, t]] };
    pointsRef.current++;
    const g = ctx();
    if (g) {
      g.strokeStyle = color;
      g.lineWidth = size;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + 0.01);
      g.stroke();
    }
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    const cur = currentRef.current;
    if (!cur) return;
    e.preventDefault();
    const [x, y] = pos(e);
    const last = cur.p[cur.p.length - 1];
    if (Math.abs(last[0] - x) < 1 && Math.abs(last[1] - y) < 1) return; // ignore jitter
    if (pointsRef.current >= DOODLE_MAX_POINTS) {
      setFull(true);
      up(e);
      return;
    }
    const pt: Point = [Math.round(x * 10) / 10, Math.round(y * 10) / 10, now()];
    cur.p.push(pt);
    pointsRef.current++;
    const g = ctx();
    if (g) {
      g.strokeStyle = cur.c;
      g.lineWidth = cur.s;
      g.beginPath();
      g.moveTo(last[0], last[1]);
      g.lineTo(x, y);
      g.stroke();
    }
  }

  function up(e: React.PointerEvent<HTMLCanvasElement>) {
    const cur = currentRef.current;
    if (!cur) return;
    currentRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    strokesRef.current.push(cur);
    emit();
  }

  function undo() {
    strokesRef.current.pop();
    pointsRef.current = strokesRef.current.reduce((n, s) => n + s.p.length, 0);
    setFull(false);
    redraw();
    emit();
  }

  function clear() {
    strokesRef.current = [];
    pointsRef.current = 0;
    startRef.current = null;
    setFull(false);
    redraw();
    emit();
  }

  return (
    <div className="doodle-canvas">
      <canvas
        ref={canvasRef}
        className="doodle-canvas__surface"
        style={{ touchAction: "none" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        aria-label="Drawing area"
      />
      <div className="doodle-canvas__tools">
        <div className="doodle-canvas__colors">
          {DOODLE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Colour ${c}`}
              onClick={() => setColor(c)}
              className={`doodle-swatch ${color === c ? "is-active" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="doodle-canvas__sizes">
          {DOODLE_SIZES.map((s) => (
            <button key={s} type="button" aria-label={`Pen ${s}`} onClick={() => setSize(s)} className={`doodle-size ${size === s ? "is-active" : ""}`}>
              <span style={{ width: s + 2, height: s + 2, background: color }} />
            </button>
          ))}
        </div>
        <div className="doodle-canvas__actions">
          <button type="button" onClick={undo} disabled={!count} className="doodle-tool">
            ↩ Undo
          </button>
          <button type="button" onClick={clear} disabled={!count} className="doodle-tool">
            ✕ Clear
          </button>
        </div>
      </div>
      {full && <p className="doodle-canvas__hint">That&apos;s as detailed as a doodle can get — send it, or undo a bit.</p>}
    </div>
  );
}
