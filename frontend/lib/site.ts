// Phase 13: the site's public address, used for canonical links, Open Graph URLs, sitemap.xml and robots.txt.
// Set NEXT_PUBLIC_SITE_URL on Vercel to the final domain (e.g. https://www.example.com) once it is chosen.
// Until then Vercel's own production URL is used, then localhost for local dev. No trailing slash.
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

/** True once a real address is configured (not the localhost fallback). */
export const siteUrlIsConfigured = !siteUrl.startsWith("http://localhost");

export const absoluteUrl = (path: string) => `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

/** Default share image: the approved banner photo already in /public (a mood image, never a listing). */
export const defaultOgImage = { url: "/images/next-chapter.jpg", width: 1672, height: 941, alt: "Cebu Properties by MCT" };
