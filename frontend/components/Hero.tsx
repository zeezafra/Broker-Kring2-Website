"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AREA_OPTIONS, heroHref, TYPE_OPTIONS, type AreaSlug } from "@/lib/search";
import { fullRange, pricesFromRange, rangeLabel, SALE_PRICE_SCALE, type PriceRange } from "@/lib/priceRange";
import LocationPicker from "./LocationPicker";
import PriceRangeSlider from "./PriceRangeSlider";

type PanelName = "loc" | "price";

// A maximum of ₱0 can match nothing (and /properties ignores a zero price, so it would show every listing under an
// "Up to ₱0" label). The maximum thumb therefore stops one step above zero. Only the maximum can reach 0, and only
// while the minimum is 0 too.
const keepMaxAboveZero = (r: PriceRange): PriceRange => (r.hi === 0 ? { lo: r.lo, hi: SALE_PRICE_SCALE.step } : r);

// Phase 8: the search bar now opens /properties with the chosen filters in the URL.
// Location: clicking it opens a small panel with Region, then City / Municipality (see LocationPicker).
// Price Range (CHANGE-04): clicking it opens the same kind of panel with the dual-thumb price slider (the one on
// /properties). Only one of the two panels is open at a time. The slider uses the purchase scale; any price chosen
// also switches the results to Buy (see heroHref). Property types come from lib/search.ts.
export default function Hero() {
  const router = useRouter();
  const [area, setArea] = useState<AreaSlug | "">("");
  const [city, setCity] = useState("");
  // Price range chosen in the slider. Full range (min thumb at the left end, max thumb at the right end) = no price.
  const [range, setRange] = useState<PriceRange>(() => fullRange(SALE_PRICE_SCALE));
  const [panel, setPanel] = useState<PanelName | null>(null);
  // On phones the panel is a bottom sheet (always inside the screen, above the header and the cards); on larger
  // screens it is a popover under its field, or above it when there is no room below.
  const [sheet, setSheet] = useState(false);
  const [up, setUp] = useState(false);
  const locRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const priceTriggerRef = useRef<HTMLButtonElement>(null);

  function togglePanel(name: PanelName) {
    if (panel === name) return setPanel(null);
    const rect = (name === "loc" ? locRef : priceRef).current?.getBoundingClientRect();
    setSheet(window.matchMedia("(max-width: 650px)").matches);
    setUp(rect ? window.innerHeight - rect.bottom < (name === "loc" ? 330 : 340) : false);
    setPanel(name);
  }

  // Closing the price panel with Done, the x or Esc puts the keyboard focus back on its button.
  function closePanel(returnFocus = false) {
    setPanel(null);
    if (returnFocus) priceTriggerRef.current?.focus();
  }

  // Esc closes the panel; a click outside closes the popover (the sheet has its own backdrop); the page behind
  // the sheet does not scroll.
  useEffect(() => {
    if (!panel) return;
    const field = panel === "loc" ? locRef : priceRef;
    const onDown = (e: MouseEvent) => {
      if (!sheet && field.current && !field.current.contains(e.target as Node)) setPanel(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPanel(null);
      if (panel === "price") priceTriggerRef.current?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    if (sheet) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [panel, sheet]);

  const regionLabel = AREA_OPTIONS.find((a) => a.slug === area)?.label ?? "";
  // Just the city once one is chosen (its region is implied), so the label fits the half-width field on phones.
  const locationLabel = city || regionLabel || "Location";
  // "₱5M – ₱10M", "Up to ₱5M", "₱10M and up"; empty (so the field reads "Price Range") while nothing is chosen.
  const priceSummary = rangeLabel(SALE_PRICE_SCALE, range);

  const locationPanel = (
    <>
      <div className="loc-head">
        <h3>Find your next property</h3>
        {sheet && (
          <button type="button" className="loc-close" aria-label="Close" onClick={() => closePanel()}>
            ×
          </button>
        )}
      </div>
      <LocationPicker
        idPrefix="hero"
        area={area}
        city={city}
        onChange={(next) => {
          setArea(next.area);
          setCity(next.city);
        }}
      />
      <button type="button" className="gold-btn loc-done" onClick={() => closePanel()}>
        Done
      </button>
    </>
  );

  const pricePanel = (
    <>
      <div className="loc-head">
        <h3>Set your budget</h3>
        {sheet && (
          <button type="button" className="loc-close" aria-label="Close" onClick={() => closePanel(true)}>
            ×
          </button>
        )}
      </div>
      <div className="hero-price">
        {/* Nothing is searched while sliding: the range is only kept here until the visitor presses Search. */}
        <PriceRangeSlider
          scale={SALE_PRICE_SCALE}
          value={range}
          onChange={(next) => setRange(keepMaxAboveZero(next))}
          onCommit={(next) => setRange(keepMaxAboveZero(next))}
        />
      </div>
      <button type="button" className="gold-btn loc-done" onClick={() => closePanel(true)}>
        Done
      </button>
    </>
  );

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (name: string) => String(data.get(name) ?? "");
    router.push(heroHref({ area, city, type: get("type"), ...pricesFromRange(SALE_PRICE_SCALE, range) }));
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
          <button type="button" className="loc-trigger" aria-haspopup="dialog" aria-expanded={panel === "loc"} aria-label="Location" onClick={() => togglePanel("loc")}>
            <span>{locationLabel}</span>
            <svg className="loc-chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {panel === "loc" && !sheet && (
            <div className={`loc-panel${up ? " up" : ""}`} role="dialog" aria-label="Choose a location">
              {locationPanel}
            </div>
          )}
          {panel === "loc" &&
            sheet &&
            createPortal(
              <>
                <div className="loc-backdrop" onClick={() => closePanel()} />
                <div className="loc-sheet" role="dialog" aria-modal="true" aria-label="Choose a location">
                  {locationPanel}
                </div>
              </>,
              document.body,
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
        <div className="search-field loc-field" ref={priceRef}>
          <svg viewBox="0 0 24 24">
            <path d="M4 7h16M4 17h16" />
            <circle cx="9" cy="7" r="2" />
            <circle cx="15" cy="17" r="2" />
          </svg>
          <button
            type="button"
            ref={priceTriggerRef}
            className="loc-trigger"
            aria-haspopup="dialog"
            aria-expanded={panel === "price"}
            aria-label={priceSummary ? `Price Range: ${priceSummary}` : "Price Range"}
            onClick={() => togglePanel("price")}
          >
            <span>{priceSummary || "Price Range"}</span>
            <svg className="loc-chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {panel === "price" && !sheet && (
            <div className={`loc-panel price-panel${up ? " up" : ""}`} role="dialog" aria-label="Choose a price range">
              {pricePanel}
            </div>
          )}
          {panel === "price" &&
            sheet &&
            createPortal(
              <>
                <div className="loc-backdrop" onClick={() => closePanel(true)} />
                <div className="loc-sheet" role="dialog" aria-modal="true" aria-label="Choose a price range">
                  {pricePanel}
                </div>
              </>,
              document.body,
            )}
        </div>
        <button className="gold-btn" type="submit">
          ⌕ &nbsp; Search
        </button>
      </form>
    </section>
  );
}
