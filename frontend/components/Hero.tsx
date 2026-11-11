"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AREA_OPTIONS, heroHref, PRICE_BANDS, TYPE_OPTIONS, type AreaSlug } from "@/lib/search";
import LocationPicker from "./LocationPicker";

// Phase 8: the search bar now opens /properties with the chosen filters in the URL.
// Location: clicking it opens a small panel with Region, then City / Municipality (see LocationPicker).
// Types and price bands come from lib/search.ts.
export default function Hero() {
  const router = useRouter();
  const [area, setArea] = useState<AreaSlug | "">("");
  const [city, setCity] = useState("");
  const [open, setOpen] = useState(false);
  const locRef = useRef<HTMLDivElement>(null);

  // Close the panel on a click outside it or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const regionLabel = AREA_OPTIONS.find((a) => a.slug === area)?.label ?? "";
  const locationLabel = [regionLabel, city].filter(Boolean).join(" · ") || "Location";

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (name: string) => String(data.get(name) ?? "");
    router.push(heroHref({ area, city, type: get("type"), band: get("price") }));
  }

  return (
    <section className="hero" id="home">
      <div className="wrap hero-inner">
        <h1>
          Find Your
          <br />
          Dream Home
        </h1>
        <p>Discover the perfect property in your ideal location.</p>
        <div className="accent"></div>
      </div>
      <form className="searchbar" id="searchForm" onSubmit={onSearch}>
        <div className="search-field loc-field" ref={locRef}>
          <svg viewBox="0 0 24 24">
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <button type="button" className="loc-trigger" aria-haspopup="dialog" aria-expanded={open} aria-label="Location" onClick={() => setOpen((o) => !o)}>
            <span>{locationLabel}</span>
            <svg className="loc-chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {open && (
            <div className="loc-panel" role="dialog" aria-label="Choose a location">
              <h3>Find your next property</h3>
              <LocationPicker
                idPrefix="hero"
                area={area}
                city={city}
                onChange={(next) => {
                  setArea(next.area);
                  setCity(next.city);
                }}
              />
              <button type="button" className="gold-btn loc-done" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          )}
        </div>
        <label className="search-field">
          <svg viewBox="0 0 24 24">
            <path d="M3 11 12 3l9 8v10H3z" />
            <path d="M9 21v-7h6v7" />
          </svg>
          <select name="type" aria-label="Property Type" defaultValue="">
            <option value="">Property Type</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="search-field">
          <svg viewBox="0 0 24 24">
            <path d="M4 7h16M4 17h16" />
            <circle cx="9" cy="7" r="2" />
            <circle cx="15" cy="17" r="2" />
          </svg>
          <select name="price" aria-label="Price Range" defaultValue="">
            <option value="">Price Range</option>
            {PRICE_BANDS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <button className="gold-btn" type="submit">
          ⌕ &nbsp; Search
        </button>
      </form>
    </section>
  );
}
