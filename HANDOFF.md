# HANDOFF — Cebu Properties by MCT (Marie Chris L. Tagsip, REB, REA)

## Phase 7 — Properties grid + detail pages (written 2026-11-03)
Backend: NO changes (Phase 3 list/detail endpoints already return everything needed, incl. `total`).
Files created (frontend/):
- `app/properties/page.tsx` — `/properties` grid, 9 per page, All/Buy/Rent tabs via `?listing=buy|rent`, `?page=N`, Previous/Next, empty/error notes
- `app/properties/[id]/page.tsx` + `not-found.tsx` — detail route; `generateMetadata` (title, description, OG image from the listing); not-found brings its own header/footer
- `components/PropertyCard.tsx` — card shared by home + grid (whole card links to `/properties/[id]`; also exports skeletons)
- `components/PropertyDetail.tsx`, `components/PropertyGallery.tsx` (client: scroll-snap swipe, arrows, thumbnails, counter)
- `components/SiteShell.tsx` — Header + inquiry modal + Footer for inner pages
Files changed:
- `lib/public-api.ts` — added `getProperties`, `getProperty`, `PAGE_SIZE`, `PUBLIC_STATUS_LABELS`, `locationLine`, image helpers
- `components/Header.tsx` — links are now absolute (`/`, `/properties?listing=buy`, `/#broker` ...) so it works on inner pages; Buy/Rent highlight from the URL (useSearchParams inside Suspense)
- `components/FeaturedProperties.tsx` — uses PropertyCard; "View All Properties" now goes to `/properties`
- `app/globals.css` — appended Phase 7 block (card link/title, status badge, page head, tabs, pagination, detail, gallery)
Decisions:
- Cards now show the listing TITLE and location line under the photo (spec item from the mobile task, also needed to tell cards apart in a grid). This slightly changes the home cards on desktop too; remove `.card-body` in the Phase 7 CSS block to undo.
- RESERVED/SOLD/RENTED listings stay visible with a dark status badge (top-right of the photo / chip on the detail page). Drafts never appear.
- Sample listings keep their "Sample listing" badge and show a note on the detail page.
- Unknown/draft id -> Next `notFound()`. Because the check runs inside Suspense, the response status is 200 with a noindex tag (soft 404), not a real 404. A real 404 would need a Proxy check; revisit in Phase 13.
- Inquire Now on a detail page opens the same demo modal; per-listing inquiries are Phase 10. No call/WhatsApp buttons yet (Phase 12 single-sources contact info).
- Search/sort/filters are NOT here (Phase 8 will extend the same `/properties` URL; hero search bar still just scrolls).
Verified (in a copy of the project with Google Fonts removed, against a mock API with 11 listings): `next build` passes; `tsc` clean after `next typegen`; widths 320/375/768/1440 have no horizontal overflow; card -> detail, gallery next, inquiry modal, tabs, pagination and View All all work in headless Chromium. Detail 404 returns 200 + noindex as described above.
NOT verified: real fonts, real Render API/Cloudinary photos, touch swiping on a device, Lighthouse. Phases 1, 4, 5, 6 are still unconfirmed on a real deploy. Existing lint error in `components/admin/PropertyList.tsx` untouched.
Next: Phase 8 (search & filters, URL state, hero search bar made real).

## Mobile UI pass (<=650px only; written 2026-11-03)
- `frontend/app/globals.css`: one appended block, all inside `@media(max-width:650px)` (plus small <=440/<=360/<=340px tweaks). Nothing above it was edited, so 651px+ is unchanged.
- `frontend/components/Header.tsx`: only change is the brand text wrapped as `Cebu Properties<span class="brand-by"> by MCT</span>`; `.brand-by` is hidden <=440px so the name never truncates (aria-label keeps the full name).
- Header 72px; Inquire pill and menu toggle 44px tall; hero h1 `clamp(36px,9vw,46px)`, stronger cream gradient; search = Location | Property Type (wider column), Price full row, 48px full-width Search button; Featured heading 28px with View All on its own row if needed.
- Cards become a swipeable scroll-snap carousel (86% wide, next card peeks, 4:3 photos, no JS, no new dependency). Inquire Now under the cards is full width, 52px. No sticky CTA added (header already has one).
- Checked in headless Chromium on a static page built from the real CSS at 320, 360, 375, 390, 414, 430, 768, 1024, 1440: no horizontal overflow, header 72px, no truncated select labels. That page used Georgia/Arial and gradient photos, so re-check on the real site with Playfair/DM Sans and real photos.
- NOT run: `next build` (sandbox cannot fetch Google Fonts). `tsc` errors about LayoutProps/PageProps are generated-types errors that go away after a real `next build`/`next dev`. `npm run lint` has an existing error in `components/admin/PropertyList.tsx` (setState in effect), not touched here.

## Fix after Phase 6 — mobile/tablet layout of the home cards and search bar
- `frontend/app/globals.css` only. (1) "Sample listing" badge moved from top-right to bottom-left of the photo so it never covers the price. (2) 651-900px: cards are 2 columns (a lone third card is centered) instead of three ~190px cards; search bar keeps one row but with a smaller Search button and tighter field padding so "Location / Property Type / Price Range" are no longer cut off. (3) 480px and below: slightly smaller stats row text/icons so beds, baths and area fit on 320-375px phones.
- Checked in headless Chromium on a static test page built from the real CSS and markup at 700, 800, 375 and 320px (no overflow, no badge/price overlap). That page used plain gradient photos and Arial instead of Playfair/DM Sans, so re-check on the real site; DM Sans is a little wider than Arial.
- Not changed: the 3-column desktop layout and the existing <=650px layout (one card per row, 2-column search bar).

## Fix after Phase 6 — broker portrait crop
- `frontend/app/globals.css`: `.portrait.has-photo img` no longer zooms (`transform:scale(1.18)` removed, `object-position:50% 8%`). The photo (900x1111) is nearly the same shape as the oval frame, so the full picture shows: face in the upper-center, shoulders and folded arms visible with backdrop around them. Checked with a simulated crop only, not in a browser.

## Phase 6 — Live featured listings on the home page (written 2026-11-03, NOT yet run: no network in sandbox; Phases 4 and 5 are also still unrun)
Files changed:
- `frontend/lib/public-api.ts` (new) — server-side `getFeaturedProperties()` (`GET /api/properties?featured=true&limit=3`, revalidate 60 s, 10 s timeout, never throws), `formatPrice`, `formatArea`, `cardImage` (adds `f_auto,q_auto,w_800` to Cloudinary URLs only)
- `frontend/components/FeaturedProperties.tsx` — cards now come from the API inside `<Suspense>` with a skeleton fallback; heading, "View All Properties" link and Inquire button unchanged and static; beds/baths/area shown only when set; rent prices show "/ mo"
- `frontend/app/globals.css` — appended `.sample-badge`, `.cards-note`, skeleton styles (reduced-motion respected)
- `frontend/data/placeholder-listings.ts` — DELETED (nothing else used it; the placeholder cards now live only in the database, flagged `isPlaceholder`)

Decisions in Phase 6:
- Home shows 3 featured cards (`HOME_FEATURED_LIMIT` in `lib/public-api.ts`), newest first (API order).
- Placeholder listings get a visible "Sample listing" badge, per the "label placeholders" rule. It disappears when an admin unticks Placeholder on a listing.
- If the API fails: a plain "Listings are unavailable right now" note. If no featured listings exist: "New listings are coming soon" note. No invented content.
- Cards are NOT links yet: `/properties/[id]` detail pages and the full `/properties` grid are later phases. "View All Properties" still points at `#contact` as in the HTML.
- Server-side fetch uses `API_URL` (set it to the Render URL on Vercel); falls back to `NEXT_PUBLIC_API_URL`, then localhost:4000.
- Changes made in /admin show on the home page within about a minute (60 s revalidate).

Phase 6 risks / untested:
- With `cacheComponents` on, the `fetch(..., { next: { revalidate: 60 } })` inside `<Suspense>` is written from memory of Next 16 behavior (docs not available). If the build complains or caching seems off, check `FeaturedCards` / `getFeaturedProperties` first.
- The skeleton shows while the Render free tier wakes up (first load after idle can take a while).
- The sample badge and skeleton were not visually checked against the design.

## Next step
Phase 7 per the roadmap (property detail pages `/properties/[id]` are required by the skill's ground rules; confirm the phase order). Phases 1, 4, 5 and 6 are still unconfirmed on a real machine/deploy.

---

## Phase 5 — Admin listing CRUD + Cloudinary upload + toasts (written 2026-11-03, NOT yet run: no network in sandbox, so no npm install / tsc / build / DB / Cloudinary test; Phase 4 is also still unrun)
Files changed:
- `backend/src/admin.ts` — rewritten: `GET/POST /api/admin/properties`, `GET/PATCH/DELETE /api/admin/properties/:id`, `POST /api/admin/uploads/sign`; Origin check on all non-GET admin requests (`summary` kept)
- `backend/src/propertyInput.ts` (new) — hand-written validation (no zod); create requires title, listingType, propertyType, price; PATCH is partial, `null` clears optional fields; max 12 https image links
- `backend/src/properties.ts` — only change: `toPublic` is now exported
- `backend/.env.example` — `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, optional `CLOUDINARY_FOLDER`
- `frontend/package.json` — adds `sonner` (run `npm install`; lockfile not updated)
- `frontend/app/layout.tsx` — one `<Toaster richColors position="top-center" />` in the root layout
- `frontend/lib/admin-api.ts` (new) — types, labels, `adminFetch` (401 sends you to login)
- `frontend/components/admin/AdminShell.tsx`, `PropertyList.tsx`, `PropertyForm.tsx`, `EditPropertyLoader.tsx` (new)
- `frontend/app/admin/properties/page.tsx`, `new/page.tsx`, `[id]/page.tsx` (new)
- `frontend/components/admin/AdminDashboard.tsx` — "Manage listings" button replaces the Phase 5 placeholder note

Decisions in Phase 5:
- Photos upload browser -> Cloudinary directly using a SHA-1 signature from `/api/admin/uploads/sign` (params signed: allowed_formats, folder, timestamp). Nothing goes through Render's disk or Vercel's body limits. Formats jpg/png/webp, 10 MB each, max 12 per listing, first photo = cover (reorder with arrows).
- A listing that is not DRAFT must have at least one photo (API rule + form error). New listings default to DRAFT.
- Delete is permanent (confirm dialog reuses the site's `.modal-backdrop`). Cloudinary files are NOT deleted when a listing/photo is removed (orphans stay in the folder).
- Images are stored as the plain Cloudinary `secure_url`. Public cards can add `f_auto,q_auto` transforms later (Phase 6/7 polish).
- Validation limits chosen by me: title 3-150, description <= 5000, price > 0 up to 999,999,999,999, bedrooms/bathrooms 0-99, areas > 0.

Setup: `npm install` in both apps; add the Cloudinary vars to Render and `backend/.env`. No new migration in Phase 5.

Phase 5 risks / untested:
- `app/admin/properties/[id]/page.tsx` awaits `params` inside `<Suspense>` and uses `PageProps<"/admin/properties/[id]">` (Next 16 cacheComponents pattern from memory; docs were not available). If the build complains about uncached data or types, check that file first.
- Public pages still show only non-DRAFT listings; after editing, the home page may take a moment/refresh to reflect changes depending on caching.
- Cloudinary signature format follows their documented rule from memory; the first real upload is the test. If it returns "Invalid Signature", compare the string-to-sign in `uploads/sign` with the error message Cloudinary prints.

## Next step
Phase 6 per the roadmap in the skill. Phases 1, 4 and 5 are still unconfirmed on a real machine/deploy.

---

## Phase 4 — Admin auth (written 2026-11-02, NOT yet run: sandbox had no network, so no npm install / tsc / build / DB test)
Files changed:
- `backend/prisma/schema.prisma` — new model `AdminUser` (email unique lowercase, name, passwordHash)
- `backend/prisma/migrations/20261102010000_add_admin_user/migration.sql` — HAND-WRITTEN (same caveat as Phase 3's)
- `backend/prisma/seed.ts` — `seedAdmins()` reads ADMIN1_* / ADMIN2_* env vars; skips existing accounts unless `ADMIN_RESET_PASSWORDS=true`; passwords must be 12+ chars
- `backend/src/auth.ts` (new) — `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `requireAdmin` middleware, Origin check, in-memory login throttle (10 failures / 15 min per IP+email)
- `backend/src/admin.ts` (new) — `/api/admin/*` router behind `requireAdmin`; `GET /api/admin/summary` (counts incl. drafts)
- `backend/src/config.ts` (new) — `allowedOrigins` moved out of index.ts
- `backend/src/index.ts` — mounts `/api/auth` and `/api/admin`, `trust proxy`, CORS `credentials: true`, startup warning if `JWT_SECRET` is missing
- `backend/package.json` — adds `bcryptjs`, `jsonwebtoken`, `@types/jsonwebtoken` (package-lock NOT updated; run `npm install`)
- `backend/.env.example` — `JWT_SECRET`, `ADMIN1_*`, `ADMIN2_*`, `ADMIN_RESET_PASSWORDS`
- `frontend/next.config.ts` — rewrite `/api/:path*` to the Render API (`API_URL` env, server-side)
- `frontend/proxy.ts` (new) — redirects `/admin/*` to `/admin/login` when the `mct_admin` cookie is absent
- `frontend/app/admin/layout.tsx`, `page.tsx`, `login/page.tsx` (new) — noindex admin area
- `frontend/components/admin/LoginForm.tsx`, `AdminDashboard.tsx` (new) — login form; dashboard verifies the session via `/api/auth/me`, shows listing counts, logout
- `frontend/.env.example` — `API_URL`

Decisions in Phase 4:
- JWT (HS256, 7 days) in an httpOnly, SameSite=Lax cookie `mct_admin`, `Secure` in production. The browser talks to `/api/*` on the Vercel site and Next rewrites to Render, so the cookie is first-party. Public pages still call the API directly via `NEXT_PUBLIC_API_URL`.
- `requireAdmin` re-loads the admin from the DB on each request, so deleting an account ends its access immediately.
- Two layers of gating: `proxy.ts` (cookie present?) and the API (JWT valid?). A forged cookie gets past the proxy but sees nothing.
- No public sign-up and no password-reset flow; reset by re-running the seed with `ADMIN_RESET_PASSWORDS=true`.

Setup for Zee:
1. `cd backend && npm install`, add `JWT_SECRET` and the ADMIN1/ADMIN2 vars to `backend/.env`, `npx prisma migrate dev` (or `migrate deploy`), `npm run db:seed`.
2. Render: add `JWT_SECRET` (+ keep `CORS_ORIGINS` = the Vercel URL, since Next forwards the browser's Origin). Seed once, then blank the ADMIN*_PASSWORD vars.
3. Vercel: set `API_URL` to the Render URL.

Phase 4 risks / untested:
- Nothing from Phase 4 has been installed, type-checked, built or run. Only a syntax parse was done.
- `frontend/proxy.ts` uses the Next 16 `proxy` file convention from memory (`node_modules/next/dist/docs/` was not available). If `/admin` does not redirect when logged out, check the docs; the API still blocks all data either way.
- `LayoutProps<"/admin">` in `app/admin/layout.tsx` relies on Next's generated types (same pattern as the root layout).
- Login throttle is in memory (resets on restart; behind Vercel + Render the IP may be the proxy's, so it effectively limits per email).
- Admin pages are not mobile-polished yet; styling reuses the site's tokens, `.gold-btn` and `.form-field`.

## Next step
Phase 5 (admin CRUD: add/edit/delete listings, Cloudinary upload, toasts via ask-sonner). Phase 1 still NOT confirmed deployed.

---

# Earlier notes (Phase 3 and before)

## UI fixes after Phase 3 (frontend only, 2026-11-02)
- Banner photo (`globals.css` + new asset): `.chapter:after` loads `/images/next-chapter.jpg` (no sepia filter; crop `center 36%`). The photo is Zee's supplied "Luxury Living Room at Sunset" image, converted from PNG to JPG at its native 1672x941 (272 KB), saved as `frontend/public/images/next-chapter.jpg`. A mobile-only (<=650px) darker overlay was added so the text stays readable over the bright sofa. The photo looks AI-generated: fine as a mood banner, but it must never be presented as a real listing or Marie Chris's own property.
- Headshot: the frame was already correct (photo clipped to the arch, cream border + gold outline). The real issue was that she was small in the frame with a lot of gray backdrop, so `.portrait.has-photo img` now has `transform:scale(1.18)` with `transform-origin:70% 20%` (face centered, head not cropped, waist-up kept). The approved photo file is untouched; to revert, delete those two declarations. Verified in headless Chromium at 1200px and 390px, not in the full Next build.
- Inquire Now: the original CSS hid the header pill under 650px and the desktop nav overflowed between 651-900px, so it was invisible on phones/tablets. Hamburger menu now starts at 900px and the pill stays visible next to the toggle (extra rules at <=400px so 360px phones fit). Only `globals.css` changed; `Header.tsx` untouched.
- Green: "Your Next Chapter" banner overlay changed from sage green to the footer's near-black (#17171b); the forest photo moved to `.chapter:after` with a sepia filter so it reads warm/gold. "View All Properties" link colour changed from green-grey #667264 to `--color-gold-dark`. `--color-sage` token left in place, now unused.
- Broker photo: waist-up crop saved as `frontend/public/images/marie-chris-tagsip.jpg`, rendered with `next/image` in `Broker.tsx` (`.portrait.has-photo`). Dashed placeholder ring and "Broker photo" label removed. Photo approved by the broker (confirmed by Zee).
- Not verified in sandbox: full Next build (banner and headshot were checked in headless Chromium only).

## Current phase
Phase 3 (Property data model) — code written and tested locally against a throwaway Postgres 16. Phase 2 (HTML port) is done and untouched. Phase 1 is still NOT confirmed deployed.

## Phase 0 decisions (confirmed by Zee)
- Fresh start; `cebu-properties-by-mct.html` is the finished design and visual source of truth (port, don't redesign).
- Accounts: GitHub, Vercel, Render, Cloudinary all under Zee's accounts; handover to Marie Chris decided later.
- Listings: launch with seeded placeholder listings, flagged in the DB and labeled on the site.
- Admin: two accounts (Zee + Marie Chris), stored in the DB, initial credentials via env vars at seed time. JWT in httpOnly cookie.
- Sell/appraisal: Phase 11 = simple `/sell` page + "Sell / Appraisal" inquiry type, placeholder wording until broker approves. "Sell" nav stays as in the HTML until then.
- Facebook URL, broker portrait, bio: labeled placeholders. Bio skipped unless she asks.
- Costs: free tiers through Phase 12; check pricing and domain cost at Phase 13.

## Files changed in Phase 3 (backend only; frontend untouched)
- `backend/prisma/schema.prisma` — enums `ListingType` (SALE/RENT), `PropertyType` (the 4 values from the HTML dropdown), `PropertyStatus` (DRAFT/AVAILABLE/RESERVED/SOLD/RENTED) + model `Property` (price Decimal(14,2), images String[], featured, isPlaceholder)
- `backend/prisma/migrations/20261102000000_add_property/migration.sql` + `migration_lock.toml` — HAND-WRITTEN, see risks
- `backend/prisma/seed.ts` — idempotent; deletes only `isPlaceholder` rows, then recreates the 3 placeholder listings (city/address left empty, none invented)
- `backend/src/properties.ts` — `GET /api/properties` (listingType, featured, limit, offset; DRAFT hidden; `{data,total,limit,offset}`) and `GET /api/properties/:id` (404 JSON for bad/missing/draft)
- `backend/src/index.ts` — mounts the router + JSON 500 error handler
- `backend/prisma.config.ts` (seed command), `backend/package.json` (`db:seed`), `backend/tsconfig.json` (includes seed.ts)

## Decisions in Phase 3
- Int autoincrement ids (clean `/properties/12` URLs); price returned as a plain number of pesos; for RENT it is the monthly rent
- Public API never returns DRAFT; admin access to drafts comes with Phases 4-5
- `featured` column exists now so Phase 6 only has to read it
- Property types limited to the HTML dropdown (House & Lot, Condominium, Townhouse, Commercial); no Lot-only type until the broker confirms

## Verification done for Phase 3
- `tsc` clean; migration SQL applied to Postgres 16; seed run 3x (idempotent, real rows survive); every endpoint, filter and error case curl-tested; draft hidden from list and detail; card order matches the HTML

## Files changed in Phase 2
- `frontend/app/globals.css` — tokens in `@theme static` (cream, gold, gold-dark, ink, muted, sage, card shadow, fonts) + the original HTML's CSS ported verbatim (var names remapped to the tokens); `html{line-height:normal}` added to undo Tailwind's reset so spacing matches the original
- `frontend/app/layout.tsx` — `next/font/google` Playfair Display, DM Sans, Allura as CSS variables; metadata title; theme-color viewport
- `frontend/app/page.tsx` — composes the ported sections inside `InquiryProvider`
- `frontend/app/status/page.tsx` — the Phase 1 API health check, kept at `/status` (not linked from the site)
- `frontend/components/Header.tsx` — sticky header, mobile menu toggle, nav links (labels/targets exactly as in the HTML)
- `frontend/components/Hero.tsx` — hero + pill search bar (dropdown options copied; submit scrolls to `#properties`)
- `frontend/components/FeaturedProperties.tsx` — cards rendered from `data/placeholder-listings.ts`
- `frontend/components/Chapter.tsx`, `Broker.tsx`, `Footer.tsx` — remaining sections
- `frontend/components/InquiryModal.tsx` — modal context + open/close/Escape/backdrop/scroll-lock + demo submit
- `frontend/data/placeholder-listings.ts` — the 3 placeholder listings (stock photos, invented prices)

## Verification done for Phase 2 (local, headless Chromium)
- Layout boxes matched the original HTML at 1440, 900 and 390 px; full-page screenshots differ by under ~400 pixels (sub-pixel text rendering).
- All interactions pass: header + CTA Inquire buttons, Escape, backdrop, X, demo submit + success Close, search scroll, mobile menu toggle and close-on-link.

## Next step (written after Phase 3; superseded by the Phase 4 notes above)
1. Zee runs Phase 3 locally (`npx prisma migrate dev`, `npm run db:seed`) and deploys Phase 1 + 3 (Render build must run `prisma migrate deploy`; seed once with `npm run db:seed`).
2. Then Phase 4 (admin auth: AdminUser model, JWT httpOnly cookie, protected middleware, protected `/admin`).

## Placeholders still in place
Listing data and photos (Unsplash stock in the HTML), broker portrait, Facebook URL (generic facebook.com in the HTML), bio.

## Awaiting broker confirmation
PRC Lic. No. 0036820, DHSUD Reg. No. R7-B-06/26-8696, phone, email (read from a card image); Facebook page URL; search dropdown options (cities / property types / price bands); `/sell` copy; inquiry-form privacy wording.

## Known untested / risks
- Phase 3 migration SQL was written by hand because the sandbox cannot download Prisma's schema engine (`prisma migrate dev` could not run). It mirrors Prisma's standard output and the app queries work against it, but the first real `npx prisma migrate dev` should report no drift; if it offers to create another migration, delete `prisma/migrations/20261102000000_add_property` and re-run `npx prisma migrate dev --name add_property` instead.
- `npm install` in `backend/` runs `prisma generate`, which fails when `DATABASE_URL` is unset (prisma.config.ts uses `env()`); fine once `.env` exists. Phase 1 behavior, left as is.
- The skill's `references/roadmap.md` is missing from the skill folder; Phase 3 was built from the skill's quick index and this file.
- Real web fonts: `next/font/google` can't download in the build sandbox, so the final layout was type-checked and linted but not built here. Tests used the same fallback fonts as the original HTML. Check Playfair Display, DM Sans and Allura render on the first Vercel build.
- Unsplash photos (listing cards, hero and banner backgrounds) are blocked in the sandbox, so they were not seen rendering; they use the same URLs as the original HTML.
- `prisma generate` and the DB connection are still unverified (see Phase 1); no Render or Vercel deploy yet.
- Tailwind 4 runs only under Turbopack (Next 16 default); a `next build --webpack` build will produce unstyled CSS.

## Observations (not changed, per "port, don't redesign")
- Placeholder cards look like real listings on the page; Phase 3 adds the placeholder flag and label.
- After a demo submit the modal shows "Thank you" again on reopen (same as the original). Phase 10 replaces the form.
- Modal has no focus trap or focus return; "Sell" and "View All Properties" still scroll to `#contact`; the footer `#contact` is just the credentials bar.
- Footer "Contact" and "Sell" get real pages in Phases 11 and 12.

## Secrets
None in this repo. All values live in `.env` files (gitignored) and host dashboards.
