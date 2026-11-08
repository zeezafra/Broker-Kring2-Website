"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PhotoLightbox from "./PhotoLightbox";

type Photo = { full: string; thumb: string };

// Swipeable photo strip (CSS scroll-snap, so touch and trackpad work natively) with arrow buttons
// and thumbnails for mouse users. Tapping a photo opens a fullscreen lightbox.
// Only this small piece needs the browser; the rest of the page is server-rendered.
export default function PropertyGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const track = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const count = photos.length;

  // Keep the active thumbnail visible inside its own strip (never scrolls the page itself).
  useEffect(() => {
    const strip = thumbs.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [index]);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
    opener.current?.focus();
  }, []);

  if (count === 0) {
    return (
      <div className="gallery">
        <div className="gallery-main gallery-empty">Photos coming soon</div>
      </div>
    );
  }

  function goTo(i: number, behavior: ScrollBehavior = "smooth") {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(count - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior });
  }

  function onScroll() {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function openLightbox(i: number, el: HTMLElement) {
    opener.current = el;
    setLightbox(i);
  }

  // While the lightbox is open, keep the main photo in sync so closing lands on the photo the visitor ended on.
  function onLightboxChange(i: number) {
    setLightbox(i);
    setIndex(i);
    goTo(i, "auto");
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        <div className="gallery-track" ref={track} onScroll={onScroll} tabIndex={0} aria-label={`${title} photos`}>
          {photos.map((ph, i) => (
            <div className="gallery-slide" key={ph.full}>
              <button
                type="button"
                className="gallery-open"
                aria-label={`View photo ${i + 1} of ${count} fullscreen`}
                onClick={(e) => openLightbox(i, e.currentTarget)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary/Unsplash hosts; plain img keeps the original markup */}
                <img src={ph.full} alt={`${title}, photo ${i + 1} of ${count}`} loading={i === 0 ? "eager" : "lazy"} />
              </button>
            </div>
          ))}
        </div>
        {count > 1 && (
          <>
            <button className="gallery-nav prev" aria-label="Previous photo" disabled={index === 0} onClick={() => goTo(index - 1)}>
              ‹
            </button>
            <button className="gallery-nav next" aria-label="Next photo" disabled={index === count - 1} onClick={() => goTo(index + 1)}>
              ›
            </button>
            <span className="gallery-count" aria-live="polite">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="gallery-thumbs" ref={thumbs}>
          {photos.map((ph, i) => (
            <button
              key={ph.thumb}
              className="gallery-thumb"
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => goTo(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.thumb} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {lightbox !== null && (
        <PhotoLightbox photos={photos} index={lightbox} title={title} onIndexChange={onLightboxChange} onClose={closeLightbox} />
      )}
    </div>
  );
}
