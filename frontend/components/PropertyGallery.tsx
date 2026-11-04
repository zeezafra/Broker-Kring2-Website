"use client";

import { useRef, useState } from "react";

type Photo = { full: string; thumb: string };

// Swipeable photo strip (CSS scroll-snap, so touch and trackpad work natively) with arrow buttons
// and thumbnails for mouse users. Only this small piece needs the browser; the rest of the page is server-rendered.
export default function PropertyGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = photos.length;

  if (count === 0) {
    return (
      <div className="gallery">
        <div className="gallery-main gallery-empty">Photos coming soon</div>
      </div>
    );
  }

  function goTo(i: number) {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(count - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        <div className="gallery-track" ref={track} onScroll={onScroll} tabIndex={0} aria-label={`${title} photos`}>
          {photos.map((ph, i) => (
            <div className="gallery-slide" key={ph.full}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary/Unsplash hosts; plain img keeps the original markup */}
              <img src={ph.full} alt={`${title}, photo ${i + 1} of ${count}`} loading={i === 0 ? "eager" : "lazy"} />
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
        <div className="gallery-thumbs">
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
    </div>
  );
}
