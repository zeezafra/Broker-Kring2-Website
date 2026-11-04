"use client";

import type { FormEvent } from "react";

// Dropdown options are copied from the HTML; the broker still needs to confirm them (Phase 8 makes the search real).
export default function Hero() {
  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    document.getElementById("properties")?.scrollIntoView({ behavior: "smooth" });
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
          <select aria-label="Location" defaultValue="">
            <option value="">Location</option>
            <option>Cebu City</option>
            <option>Mandaue</option>
            <option>Talisay</option>
            <option>Lapu-Lapu</option>
          </select>
        </label>
        <label className="search-field">
          <svg viewBox="0 0 24 24">
            <path d="M3 11 12 3l9 8v10H3z" />
            <path d="M9 21v-7h6v7" />
          </svg>
          <select aria-label="Property Type" defaultValue="">
            <option value="">Property Type</option>
            <option>House &amp; Lot</option>
            <option>Condominium</option>
            <option>Townhouse</option>
            <option>Commercial</option>
          </select>
        </label>
        <label className="search-field">
          <svg viewBox="0 0 24 24">
            <path d="M4 7h16M4 17h16" />
            <circle cx="9" cy="7" r="2" />
            <circle cx="15" cy="17" r="2" />
          </svg>
          <select aria-label="Price Range" defaultValue="">
            <option value="">Price Range</option>
            <option>Below ₱5M</option>
            <option>₱5M – ₱10M</option>
            <option>₱10M – ₱20M</option>
            <option>Above ₱20M</option>
          </select>
        </label>
        <button className="gold-btn" type="submit">
          ⌕ &nbsp; Search
        </button>
      </form>
    </section>
  );
}
