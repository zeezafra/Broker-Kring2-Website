"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { AREA_OPTIONS, areaValue, heroHref, PRICE_BANDS, TYPE_OPTIONS } from "@/lib/search";

// Phase 8: the search bar now opens /properties with the chosen filters in the URL.
// Locations: North/South Cebu (fixed) plus the listings' cities (passed in by HeroSection); types and price bands from lib/search.ts.
export default function Hero({ locations }: { locations: string[] }) {
  const router = useRouter();

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (name: string) => String(data.get(name) ?? "");
    router.push(heroHref({ location: get("location"), type: get("type"), band: get("price") }));
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
        <label className="search-field">
          <svg viewBox="0 0 24 24">
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <select name="location" aria-label="Location" defaultValue="">
            <option value="">Location</option>
            <optgroup label="Area">
              {AREA_OPTIONS.map((a) => (
                <option key={a.slug} value={areaValue(a.slug)}>
                  {a.label}
                </option>
              ))}
            </optgroup>
            {locations.length > 0 && (
              <optgroup label="City">
                {locations.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
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
