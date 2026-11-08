"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Photo = { full: string; thumb: string };

const SWIPE_THRESHOLD = 50; // px of horizontal drag needed to change photo

// Fullscreen photo viewer. Rendered in a portal so it sits above the sticky header and is never clipped by the gallery.
export default function PhotoLightbox({
  photos,
  index,
  title,
  onIndexChange,
  onClose,
}: {
  photos: Photo[];
  index: number;
  title: string;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const count = photos.length;
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const dragged = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i > count - 1) return;
      onIndexChange(i);
    },
    [count, onIndexChange]
  );

  // Lock page scroll while open; restore exactly what was there before.
  useEffect(() => {
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);

  // Move focus into the dialog on open.
  useEffect(() => {
    if (mounted) closeBtn.current?.focus();
  }, [mounted]);

  // Preload the neighbouring photos so next/prev feels instant.
  useEffect(() => {
    [index - 1, index + 1].forEach((i) => {
      if (photos[i]) {
        const img = new Image();
        img.src = photos[i].full;
      }
    });
  }, [index, photos]);

  // Keyboard: Esc closes, arrows navigate, Tab stays inside the dialog.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        go(index - 1);
      } else if (e.key === "ArrowRight") {
        go(index + 1);
      } else if (e.key === "Tab" && dialog.current) {
        const items = Array.from(dialog.current.querySelectorAll<HTMLElement>("button:not([disabled])"));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !dialog.current.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !dialog.current.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, index, onClose]);

  function onPointerDown(e: React.PointerEvent) {
    if (count < 2 || (e.pointerType === "mouse" && e.button !== 0)) return;
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    dragged.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!dragging) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    dragged.current = true;
    // Resist dragging past the first/last photo.
    const atEdge = (dx > 0 && index === 0) || (dx < 0 && index === count - 1);
    setDragX(atEdge ? dx / 4 : dx);
  }

  function endDrag(e: React.PointerEvent) {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    start.current = null;
    if (dragging) {
      if (dx <= -SWIPE_THRESHOLD) go(index + 1);
      else if (dx >= SWIPE_THRESHOLD) go(index - 1);
    }
    setDragging(false);
    setDragX(0);
  }

  // Tapping the dark area around the photo closes the viewer.
  function onStageClick(e: React.MouseEvent) {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if (!(e.target as HTMLElement).closest("button, img")) onClose();
  }

  if (!mounted) return null;
  const photo = photos[index];
  if (!photo) return null;

  return createPortal(
    <div className="lb" role="dialog" aria-modal="true" aria-label={`${title} photo viewer`} ref={dialog}>
      <div className="lb-top">
        <span className="lb-count" aria-live="polite">
          {index + 1} / {count}
        </span>
        <button className="lb-btn" ref={closeBtn} aria-label="Close photo viewer" onClick={onClose}>
          ×
        </button>
      </div>
      <div
        className="lb-stage"
        onClick={onStageClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- same plain-img approach as PropertyGallery */}
        <img
          key={photo.full}
          className={`lb-img${dragging ? " dragging" : ""}`}
          src={photo.full}
          alt={`${title}, photo ${index + 1} of ${count}`}
          draggable={false}
          style={dragX ? { transform: `translateX(${dragX}px)` } : undefined}
        />
        {count > 1 && (
          <>
            <button className="lb-btn lb-nav prev" aria-label="Previous photo" disabled={index === 0} onClick={() => go(index - 1)}>
              ‹
            </button>
            <button className="lb-btn lb-nav next" aria-label="Next photo" disabled={index === count - 1} onClick={() => go(index + 1)}>
              ›
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
