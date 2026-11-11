// Dual-thumb price slider: scales, formatting and range math.
// Pure functions only (no React, no server code), so the client slider and any server code can share them.
//
// HOW TO CONFIGURE: edit SALE_PRICE_SCALE / RENT_PRICE_SCALE below.
//   min / max : the ends of the track. The right end means "this much or more": at `max` the slider sends NO max
//               price to the API, so "₱20M+" really does include a ₱35M listing.
//   step      : how far one keyboard press or one snap moves a thumb.
//   ticks     : the reference labels under the track (value + label text).
// The RENT scale is a proposal: nothing in the brief fixed monthly-rent numbers. It lines up with the existing
// rent bands in lib/search.ts (below ₱15,000 ... above ₱60,000). Change it here.

import type { ListingFilter } from "./search";

export type PriceScale = {
  min: number;
  max: number;
  step: number;
  /** Small note next to the "Price range" label, e.g. "per month". */
  caption?: string;
  ticks: { value: number; label: string }[];
};

export const SALE_PRICE_SCALE: PriceScale = {
  min: 0,
  max: 20_000_000,
  step: 500_000,
  ticks: [
    { value: 0, label: "₱0" },
    { value: 5_000_000, label: "₱5M" },
    { value: 10_000_000, label: "₱10M" },
    { value: 15_000_000, label: "₱15M" },
    { value: 20_000_000, label: "₱20M+" },
  ],
};

export const RENT_PRICE_SCALE: PriceScale = {
  min: 0,
  max: 100_000,
  step: 5_000,
  caption: "per month",
  ticks: [
    { value: 0, label: "₱0" },
    { value: 25_000, label: "₱25K" },
    { value: 50_000, label: "₱50K" },
    { value: 75_000, label: "₱75K" },
    { value: 100_000, label: "₱100K+" },
  ],
};

// Buy and All use the purchase scale (as the old bands did); Rent uses monthly rent.
export const priceScaleFor = (listing: ListingFilter): PriceScale => (listing === "rent" ? RENT_PRICE_SCALE : SALE_PRICE_SCALE);

/**
 * The chosen range. `hi: null` means "no maximum" (the thumb sits at the right end, shown as "₱20M+").
 * `lo` at `scale.min` means "no minimum". Values that came from an old or hand-edited URL may sit off the step
 * grid or beyond the scale; they are kept exactly (never silently rewritten) until the visitor moves a thumb.
 */
export type PriceRange = { lo: number; hi: number | null };

export const fullRange = (scale: PriceScale): PriceRange => ({ lo: scale.min, hi: null });

export const isFullRange = (scale: PriceScale, r: PriceRange): boolean => r.lo <= scale.min && r.hi === null;

export const sameRange = (a: PriceRange, b: PriceRange): boolean => a.lo === b.lo && a.hi === b.hi;

/** URL/state values -> slider range. */
export function rangeFromPrices(scale: PriceScale, minPrice: number | null, maxPrice: number | null): PriceRange {
  return { lo: minPrice ?? scale.min, hi: maxPrice };
}

/** Slider range -> the minPrice / maxPrice the URL and API use (null = not set). */
export function pricesFromRange(scale: PriceScale, r: PriceRange): { minPrice: number | null; maxPrice: number | null } {
  return { minPrice: r.lo > scale.min ? r.lo : null, maxPrice: r.hi };
}

export const clamp = (n: number, lo: number, hi: number): number => Math.min(Math.max(n, lo), hi);

/** Nearest step on the scale, kept inside it. */
export function snap(scale: PriceScale, n: number): number {
  const steps = Math.round((n - scale.min) / scale.step);
  return clamp(scale.min + steps * scale.step, scale.min, scale.max);
}

/** Position on the track, 0 to 100 (values beyond the scale sit at the end). */
export function percentOf(scale: PriceScale, n: number): number {
  return clamp((n - scale.min) / (scale.max - scale.min), 0, 1) * 100;
}

export type Thumb = "lo" | "hi";

/**
 * Moves one thumb to `value` and returns the new range. The minimum can never pass the maximum and the maximum
 * can never fall below the minimum. A max thumb dragged to the right end becomes "no maximum" (null).
 */
export function moveThumb(scale: PriceScale, r: PriceRange, thumb: Thumb, value: number): PriceRange {
  if (thumb === "lo") {
    const ceiling = r.hi ?? scale.max;
    return { lo: clamp(value, scale.min, Math.min(ceiling, scale.max)), hi: r.hi };
  }
  const hi = clamp(value, Math.min(r.lo, scale.max), scale.max);
  return { lo: r.lo, hi: hi >= scale.max ? null : hi };
}

// Number of decimals to show, trimmed: 2.5 -> "2.5", 2 -> "2", 1.25 -> "1.25".
const trim = (n: number, digits: number) => String(Number(n.toFixed(digits)));

/** Compact peso label for the live readout: ₱0, ₱500K, ₱2M, ₱2.5M, ₱27.5K. */
export function formatPeso(n: number): string {
  if (n <= 0) return "₱0";
  if (Math.round(n / 1000) >= 1000) return `₱${trim(n / 1_000_000, 2)}M`;
  if (n >= 1000) return `₱${trim(n / 1000, 1)}K`;
  return `₱${Math.round(n)}`;
}

/** Same amount in words for screen readers: "2.5 million pesos", "500 thousand pesos". */
export function spokenPeso(n: number): string {
  if (n <= 0) return "0 pesos";
  if (Math.round(n / 1000) >= 1000) return `${trim(n / 1_000_000, 2)} million pesos`;
  if (n >= 1000) return `${trim(n / 1000, 1)} thousand pesos`;
  return `${Math.round(n)} pesos`;
}

/** Readout text for the max side: the right end reads "₱20M+". */
export function formatMax(scale: PriceScale, hi: number | null): string {
  return hi === null ? `${formatPeso(scale.max)}+` : formatPeso(hi);
}

/**
 * Short summary of a range for a closed field (the hero's Price Range button): "₱5M – ₱10M", "Up to ₱5M",
 * "₱10M and up". Empty string for the full range (nothing chosen), so the caller can show its placeholder.
 */
export function rangeLabel(scale: PriceScale, r: PriceRange): string {
  const hi = r.hi;
  if (r.lo <= scale.min) return hi === null ? "" : `Up to ${formatPeso(hi)}`;
  if (hi === null) return `${formatPeso(r.lo)} and up`;
  return `${formatPeso(r.lo)} – ${formatPeso(hi)}`;
}
