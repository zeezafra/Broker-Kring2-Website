"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  formatMax,
  formatPeso,
  fullRange,
  isFullRange,
  moveThumb,
  percentOf,
  sameRange,
  snap,
  spokenPeso,
  type PriceRange,
  type PriceScale,
  type Thumb,
} from "@/lib/priceRange";

// Dual-thumb price slider on one track (two ARIA "slider" thumbs, no extra dependency).
//   - Controlled: `value` comes from the parent; `onChange` fires continuously while dragging (live readout),
//     `onCommit` fires once when the visitor lets go (mouse/touch), presses Enter (keyboard) or taps Reset.
//   - Mouse, touch and pen use pointer events with pointer capture; the track also accepts a tap/click
//     (the nearest thumb jumps there). `touch-action: pan-y` keeps vertical page scrolling working on phones.
//   - Keyboard: Arrow keys move one step, PageUp/PageDown move ten percent of the track, Home/End jump to the
//     lowest/highest allowed value, Enter applies. (The parent remounts the form when results change, so
//     applying on every key press would drop keyboard focus.)
//   - The minimum can never pass the maximum and vice versa (see moveThumb in lib/priceRange.ts).

type Props = {
  scale: PriceScale;
  value: PriceRange;
  onChange: (next: PriceRange) => void;
  onCommit: (next: PriceRange) => void;
};

const keyOf = (r: PriceRange) => `${r.lo}|${r.hi}`;

export default function PriceRangeSlider({ scale, value, onChange, onCommit }: Props) {
  const uid = useId();
  const labelId = `${uid}-label`;
  const hintId = `${uid}-hint`;

  const trackRef = useRef<HTMLDivElement>(null);
  const loRef = useRef<HTMLDivElement>(null);
  const hiRef = useRef<HTMLDivElement>(null);
  // Always the newest range, so pointer moves between two renders never act on stale values.
  const live = useRef<PriceRange>(value);
  live.current = value;
  // `pending`: a touch/pen press on the empty track. Nothing moves until the finger lifts (a tap) or clearly moves
  // sideways (a drag), so a vertical swipe that starts on the slider just scrolls the page.
  const drag = useRef<{ which: Thumb | "either"; offset: number; startKey: string; pending: boolean; downX: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState<Thumb | null>(null);

  const hiValue = value.hi ?? scale.max;
  const loPct = percentOf(scale, value.lo);
  const hiPct = percentOf(scale, hiValue);
  const full = isFullRange(scale, value);

  function update(next: PriceRange) {
    if (sameRange(next, live.current)) return;
    live.current = next;
    onChange(next);
  }

  const focusThumb = (t: Thumb) => (t === "lo" ? loRef : hiRef).current?.focus({ preventScroll: true });

  // Track geometry: the measuring box is the track itself (the padding around it only gives the thumbs room).
  function valueFromX(clientX: number, offset: number): number {
    const rect = trackRef.current!.getBoundingClientRect();
    const frac = rect.width > 0 ? Math.min(Math.max((clientX - offset - rect.left) / rect.width, 0), 1) : 0;
    return snap(scale, scale.min + frac * (scale.max - scale.min));
  }

  function thumbCenterX(t: Thumb): number {
    const rect = trackRef.current!.getBoundingClientRect();
    return rect.left + (percentOf(scale, t === "lo" ? live.current.lo : live.current.hi ?? scale.max) / 100) * rect.width;
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const cur = live.current;
    const grabbed = (e.target as HTMLElement).closest<HTMLElement>("[data-thumb]")?.dataset.thumb as Thumb | undefined;
    const curHi = cur.hi ?? scale.max;
    let which: Thumb | "either";
    let offset = 0;

    let pending = false;
    if (grabbed) {
      // Grab a thumb: remember where inside it the pointer is, so it does not jump to the pointer's centre.
      // If both thumbs sit on the same spot, the direction of the first move decides which one is meant.
      which = cur.lo === curHi ? "either" : grabbed;
      offset = e.clientX - thumbCenterX(grabbed);
    } else {
      // Press on the track: the nearest thumb jumps there and can be dragged on from that point.
      const v = valueFromX(e.clientX, 0);
      const dLo = Math.abs(v - cur.lo);
      const dHi = Math.abs(v - curHi);
      which = dLo < dHi ? "lo" : dHi < dLo ? "hi" : v < cur.lo ? "lo" : "hi";
      if (e.pointerType === "mouse") update(moveThumb(scale, cur, which, v));
      else pending = true;
    }

    drag.current = { which, offset, startKey: keyOf(cur), pending, downX: e.clientX };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (!pending) {
      setDragging(true);
      if (which !== "either") {
        setActive(which);
        focusThumb(which);
      }
    }
    e.preventDefault(); // no text selection while dragging; focus is moved by hand above
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    if (d.pending) {
      if (Math.abs(e.clientX - d.downX) < 6) return; // still just a press
      d.pending = false;
      setDragging(true);
      setActive(d.which as Thumb);
      focusThumb(d.which as Thumb);
    }
    const v = valueFromX(e.clientX, d.offset);
    const cur = live.current;
    if (d.which === "either") {
      if (v === cur.lo) return; // not moved far enough to know the direction yet
      d.which = v < cur.lo ? "lo" : "hi";
      setActive(d.which);
      focusThumb(d.which);
    }
    update(moveThumb(scale, cur, d.which, v));
  }

  function endDrag(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setDragging(false);
    setActive(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (d.pending && e.type === "pointerup") {
      // A tap on the empty track: now that the finger is up (and the browser did not start scrolling), jump there.
      const which = d.which as Thumb;
      update(moveThumb(scale, live.current, which, valueFromX(e.clientX, 0)));
      focusThumb(which);
    }
    // Only apply when something actually changed (a touch that turned into a page scroll changes nothing).
    if (keyOf(live.current) !== d.startKey) onCommit(live.current);
  }

  function onKeyDown(thumb: Thumb, e: KeyboardEvent<HTMLDivElement>) {
    const cur = live.current;
    const now = thumb === "lo" ? cur.lo : cur.hi ?? scale.max;
    const big = Math.max(scale.step, Math.round((scale.max - scale.min) / 10 / scale.step) * scale.step);
    let next: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = now + scale.step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = now - scale.step;
        break;
      case "PageUp":
        next = now + big;
        break;
      case "PageDown":
        next = now - big;
        break;
      case "Home":
        next = scale.min;
        break;
      case "End":
        next = scale.max;
        break;
      case "Enter":
        e.preventDefault();
        onCommit(cur);
        return;
      default:
        return;
    }
    e.preventDefault();
    update(moveThumb(scale, cur, thumb, snap(scale, next)));
  }

  function reset() {
    const next = fullRange(scale);
    live.current = next;
    onChange(next);
    onCommit(next);
  }

  const loText = value.lo <= scale.min ? "No minimum" : spokenPeso(value.lo);
  const hiText = value.hi === null ? `${spokenPeso(scale.max)} or more, no maximum` : spokenPeso(value.hi);

  return (
    <div className={`prs${dragging ? " is-dragging" : ""}`} role="group" aria-labelledby={labelId}>
      <div className="prs-head">
        <span id={labelId} className="prs-label">
          Price range{scale.caption && <span className="prs-caption"> · {scale.caption}</span>}
        </span>
        <button type="button" className="prs-reset" onClick={reset} disabled={full}>
          Reset range
        </button>
      </div>

      {/* Live readout (decorative for screen readers: the thumbs announce their own values). */}
      <div className="prs-values" aria-hidden="true">
        <div className="prs-value">
          <span className="prs-cap">Minimum</span>
          <strong>{formatPeso(value.lo)}</strong>
        </div>
        <span className="prs-link" />
        <div className="prs-value prs-value-end">
          <span className="prs-cap">Maximum</span>
          <strong>{formatMax(scale, value.hi)}</strong>
        </div>
      </div>

      <div
        className="prs-area"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="prs-track" ref={trackRef}>
          <div className="prs-fill" style={{ left: `${loPct}%`, width: `${Math.max(hiPct - loPct, 0)}%` }} />
          <div
            ref={loRef}
            data-thumb="lo"
            className={`prs-thumb${active === "lo" ? " is-active" : ""}`}
            style={{ left: `${loPct}%`, zIndex: active === "lo" ? 3 : loPct >= 50 ? 2 : 1 }}
            role="slider"
            tabIndex={0}
            aria-label="Minimum price"
            aria-valuemin={scale.min}
            aria-valuemax={Math.min(hiValue, scale.max)}
            aria-valuenow={Math.min(value.lo, scale.max)}
            aria-valuetext={loText}
            aria-describedby={hintId}
            onKeyDown={(e) => onKeyDown("lo", e)}
          />
          <div
            ref={hiRef}
            data-thumb="hi"
            className={`prs-thumb${active === "hi" ? " is-active" : ""}`}
            style={{ left: `${hiPct}%`, zIndex: active === "hi" ? 3 : loPct >= 50 ? 1 : 2 }}
            role="slider"
            tabIndex={0}
            aria-label="Maximum price"
            aria-valuemin={Math.min(value.lo, scale.max)}
            aria-valuemax={scale.max}
            aria-valuenow={Math.min(hiValue, scale.max)}
            aria-valuetext={hiText}
            aria-describedby={hintId}
            onKeyDown={(e) => onKeyDown("hi", e)}
          />
        </div>
      </div>

      <div className="prs-scale" aria-hidden="true">
        <div className="prs-ticks">
          {scale.ticks.map((t) => (
            <span key={t.value} className="prs-tick" style={{ left: `${percentOf(scale, t.value)}%` }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>

      <p id={hintId} className="sr-only">
        Use the arrow keys to change the price, Home and End to jump to the ends, and Enter to apply the range.
      </p>
    </div>
  );
}
