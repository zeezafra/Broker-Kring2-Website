# HANDOFF — Cebu Properties by MCT (Marie Chris L. Tagsip, REB, REA)

## CHANGE-04 — Price slider on the HOMEPAGE hero search bar (2026-11-11; NOT yet built with `next build` or deployed)
Scope: the hero's "Price Range" field only. Backend, `/properties` (`PropertyFilters.tsx`, `PriceRangeSlider.tsx`, `page.tsx`), cards, detail pages, Location and Property Type fields are untouched. No git repo existed in the upload, so no commit was made.
Files (all in `frontend/`)
- `components/Hero.tsx`: the Price Range `<select>` is replaced by a button that looks like the Location field (gold icon, "Price Range" label, chevron). Clicking it opens the SAME kind of panel as Location (popover under the field, above it when there is no room; bottom sheet with backdrop and x on phones <=650px) titled "Set your budget", holding the existing `PriceRangeSlider` plus a Done button. One panel open at a time (`panel: "loc" | "price" | null` replaces the old `open` flag; Location's behaviour is unchanged). Esc, outside click, x, backdrop and Done close it; Done / x / Esc return focus to the Price Range button. The field shows the chosen range ("₱5M – ₱10M", "Up to ₱5M", "₱10M and up") and goes back to "Price Range" when the range is full.
- `lib/priceRange.ts`: ONE function appended, `rangeLabel(scale, range)` (the text above). Nothing else edited.
- `lib/search.ts`: `heroHref` now takes `minPrice` / `maxPrice` instead of `band` (only Hero calls it). `PRICE_BANDS` is no longer rendered anywhere; left in place with `bandsFor` / `matchBand`; comment updated.
- `app/globals.css`: ONE block appended at the end ("Hero Price Range slider (CHANGE-04)"): `.loc-panel.price-panel` (hangs from the field's right edge so it cannot run off the screen on tablets) and `.hero-price` (the cream box). Everything else reuses `.loc-*` and `.prs-*`.
Behaviour / decisions
- Nothing is searched while sliding or on Done; the range only goes into the URL when the visitor presses Search. The range is kept in the Hero's state if the panel is closed and reopened.
- Purchase scale only (`SALE_PRICE_SCALE`, ₱0 - ₱20M+, step ₱500K), as the old hero bands were purchase prices. Any price chosen switches results to Buy (`listing=buy`), same as before. Full range = no price in the URL and NOT forced to Buy (`/properties`).
- Right end = no maximum (no `maxPrice`), left end = no minimum (no `minPrice`), exactly as on /properties; the URL then opens /properties with the same slider position (round trip checked over every thumb position).
- The maximum thumb stops at ₱500K, never ₱0 (`keepMaxAboveZero` in Hero.tsx): `maxPrice=0` is ignored by /properties and would list everything under an "Up to ₱0" label. This guard exists in the hero only; /properties still lets the max thumb reach ₱0 (CHANGE-03 behaviour, left alone).
- The Price Range chevron is now the same custom chevron as Location (it was the browser's native select arrow). Property Type still uses the native select.
Verified (2026-11-11, sandbox): the REAL `Hero` + `PriceRangeSlider` + `LocationPicker` + real `globals.css` bundled with esbuild (React 19 in the sandbox, `next/navigation` stubbed) and driven in headless Chromium: 215 desktop/tablet checks at 1440x900, 1440x740 (opens upward), 1024, 800, 700 (panel inside the screen, no horizontal overflow, drag both thumbs, thumbs never cross, Done/Esc/outside click/second click close, focus return, Reset, keyboard keys, exclusivity with Location, exact search URLs for range / min only / max only / full / with property type) and 96 phone checks at 390x844, 360x640, 320x568, 650x800 (bottom sheet, backdrop, page scroll locked and restored, REAL touch drags via CDP, x / backdrop / Done, no overflow), repeated runs stable. `heroHref` -> `parseSearch` -> slider round trip: 2,592 checks. `launch-check.mjs`: PASS. `tsc` strict on `lib/*` and on Hero.tsx against hand-written React stubs: no errors in touched files.
NOT verified: `next build`, `next lint`, project-wide `tsc` against real @types/react (no node_modules / network in the sandbox); React 18 (tests ran on 19); real fonts (Georgia/Arial stand-ins); a real phone; screen readers; Safari/Firefox (Chromium only); the hero photo (Unsplash is blocked in the sandbox).
Known, left alone: in headless Chromium a very fast flick of a slider thumb followed by a tap on another button within ~100 ms is swallowed (a slower drag, or waiting under a second, is fine). It comes from the slider's `touch-action: pan-y` thumbs (CHANGE-03, same on /properties) and needs a speed no finger can match; not changed.

---

## CHANGE-03 — Dual-thumb price range slider on /properties (2026-11-11; NOT yet built with `next build` or deployed)
Scope: the "Price range" filter on /properties only (the hero got its own slider afterwards: see CHANGE-04 above). Backend, the hero search bar, `page.tsx`, `lib/search.ts`, cards, detail pages and every other filter are untouched (the other filters keep their code; Beds + Sort moved into a small wrapper div to make room, see below).
Files (all in `frontend/`)
- `components/PriceRangeSlider.tsx` (NEW): one track, two draggable thumbs (ARIA `role="slider"`, no new dependency), gold fill between them, live Minimum / Maximum readout in serif above, reference labels under the track, "Reset range" link.
- `lib/priceRange.ts` (NEW): the CONFIG (`SALE_PRICE_SCALE` ₱0-₱20M+, step ₱500K; `RENT_PRICE_SCALE` ₱0-₱100K+, step ₱5K, caption "per month") plus pure range math and ₱ formatting. Edit min / max / step / tick labels there.
- `components/PropertyFilters.tsx`: price `<select>` and its band state removed; slider state `range` added; `apply()` takes `{ sort?, range? }`; Beds + Sort sit in a `.filter-stack` wrapper next to the slider. Unused band imports removed (the helpers stay exported in `lib/search.ts`: the hero and `page.tsx` still use `PRICE_BANDS` / `priceLabel`).
- `app/globals.css`: ONE block appended at the end ("Premium dual-thumb price range slider"), scoped to `.prs`, `.filter-price`, `.filter-stack`. Nothing above it was edited.
Behaviour / decisions
- Max thumb at the right end means NO maximum (no `maxPrice` in the URL), so "₱20M+" includes a ₱35M listing; min thumb at ₱0 sends no `minPrice`. URL params are unchanged (`minPrice` / `maxPrice`), so old links, the hero bands and the removable price chip all keep working. Values from an old/hand-edited URL (e.g. ₱4.2M, ₱35M) are shown as they are and only change if a thumb is moved.
- Min can never pass max and max can never fall below min (equal is allowed; if both thumbs sit together, the first drag direction decides which one moves).
- Results apply when the visitor RELEASES a thumb (mouse/touch) or taps the track, on Reset, or on Enter (keyboard). Keyboard arrows only change the readout until Enter or Search, because the form remounts when the URL changes and applying on every key press would drop focus. Slider commits use `router.push(..., { scroll: false })` so the page does not jump.
- Mobile: `panelWasOpen` (module variable in `PropertyFilters.tsx`) keeps the Filters panel open across the remount; before, it closed after every change. This also applies to Sort. On touch a tap on the EMPTY track is applied on release, so a vertical swipe that starts on the slider just scrolls the page.
- Rent tab uses the rent scale (sale prices and monthly rent differ ~100x). THE RENT NUMBERS ARE MY PROPOSAL (they line up with the existing rent bands); confirm with the broker. "All" uses the sale scale, so any minimum above ₱0 hides rentals (same as the old bands did).
- (Superseded by CHANGE-04: the hero Price Range dropdown is now a slider panel too.) Originally the hero dropdown was left alone because a slider does not fit the 64px pill.
- Known, left alone: the "Filters" badge counts min and max separately (a two-sided range shows 2).
Verified (2026-11-11, sandbox): the REAL `PropertyFilters` + `PriceRangeSlider` + real `globals.css` bundled with esbuild and driven in headless Chromium (only `next/link` / `next/navigation` stubbed): 37 desktop checks (live readout while dragging, commit on release, never-cross at both ends, coincident thumbs, open max, track click, all keys, Reset keeps other filters, Sort and Search keep the range, off-grid / out-of-scale URL values, rent scale) and the mobile checks (real touch drag via CDP, tap, vertical-swipe-scrolls, panel stays open, no horizontal overflow at 320/360/375/390/768/1024/1440). `lib/priceRange.ts` unit-tested (13 groups incl. a 40k-move fuzz) and strict-`tsc` clean. Backend filter confirmed inclusive (`gte` / `lte`).
NOT verified: `next build`, `next lint` and project-wide `tsc` (no node_modules in the sandbox, so `PriceRangeSlider.tsx` / `PropertyFilters.tsx` were not type-checked against @types/react); real fonts (test used Georgia/Arial stand-ins for Playfair/DM Sans); a real phone; screen readers (ARIA slider pattern implemented, not tested with NVDA / VoiceOver); Safari/Firefox (only Chromium run).

---

## CHANGE-02 — Cascading Cebu location selector in Admin Add/Edit Property (2026-11-11; real deploy NOT done; barangay data NOT yet verified against the official PSA file)
Scope: the location fields of the admin Add/Edit Property form and the backend/database support they need. Public site, search, filters, cards, detail pages, auth, image upload and every non-location field are untouched. No git repo existed in the upload, so no commit was made.

### What changed
Backend (`backend/`)
- `prisma/schema.prisma`: Property gains optional `region`, `cityCode`, `barangay`, `barangayCode`, `subdivision`. `city`, `area`, `address` are kept (`address` = the optional street address).
- `prisma/migrations/20261111000000_add_property_structured_location/migration.sql`: additive only (5 nullable columns). Nothing dropped or renamed.
- `data/cebu-regions.json`: the 4 website regions and their localities (listed by NAME; see "Still open" #2).
- `data/cebu-locations.json`: GENERATED. 4 regions, 53 localities, 1,203 barangays with PSGC codes. Publication recorded as "2026-06-30 (2Q 2026)".
- `scripts/build-cebu-locations.mjs` + `npm run locations:build`: rebuilds the file from two independent PSGC npm packages (dev deps `@ianlabicani/geoph-lite`, `@aivangogh/ph-address`) and fails, writing nothing, if they disagree on any code or name, if a locality has no barangays, or if the count is not 53. Deduped by PSGC code, never by name.
- `src/locations.ts` (new): loads the directory once at startup; `resolveLocation()` checks region -> city -> barangay belong to each other; legacy city matching; read-only endpoints.
- `src/propertyInput.ts`, `src/admin.ts`: structured validation. `city` / `area` are filled by the server from the directory (whatever the browser sends for them is ignored). `/api/admin/locations/*` is mounted under the existing admin auth. A plain `city`/`area` PATCH is refused on listings that already have codes.
Frontend (`frontend/`)
- `components/admin/SearchableSelect.tsx` (new), `components/admin/LocationSelector.tsx` (new, used by BOTH Add and Edit through `PropertyForm.tsx`), `components/admin/PropertyForm.tsx` (old "Area of Cebu" select and manual City input removed, location block replaced), `lib/admin-api.ts` (types).

### API
All admin-only (`/api/admin/locations/...`): `GET regions`, `GET localities?region=KEY`, `GET barangays?city=PSGC`, `GET match?city=TEXT` (pre-fills older listings). Property responses keep their old shape and gain `region`, `cityCode`, `barangay`, `barangayCode`, `subdivision`.

### Decisions
- Regions are website browsing categories, not official ones. Region/city/barangay data is a versioned JSON file read at startup, NOT new DB tables: it is read-only, changes only with each quarterly PSGC release, and needs no reference-data migration. Updating it is a code change (rebuild + redeploy).
- `area` (NORTH/SOUTH) is derived from the region so the public North/South filter keeps working. West/Central and Metro localities get `area = null` (no legacy equivalent; public code not changed). Those are: Aloguinsan, Asturias, Balamban, Pinamungajan, Tabuelan, Toledo City, Cebu City, Mandaue City, Lapu-Lapu City, Cordova.
- Old listings are never rewritten automatically. The Edit form pre-fills region + city by matching the old city text and saves a location only if the admin changes it.
- Live listings need region + city + barangay; Drafts may have none, but a started location must be complete.
- Cascade: changing Region resets City and Barangay; changing City resets Barangay; child dropdowns are disabled until the parent is chosen; lists are cached per parent.

### Verified (2026-11-11, sandbox)
- Locality count 53 (21 North, 22 South, 6 West/Central, 4 Metro); the region lists match the spec names exactly and in order. Barangays: 451 North, 456 South, 146 West/Central, 150 Metro = 1,203.
- `npm run locations:build` is deterministic: a rebuild is byte-identical to the shipped file.
- Server validation (called `parsePropertyInput` directly): valid South and Metro saves OK (Metro `area` = null); "Carcar City is not in North Cebu" (400); a Bogo barangay under Carcar -> "Choose a barangay that belongs to Carcar City" (400); bogus region and bogus city code rejected; region/city/barangay must be sent together; a client-supplied `city: "Manila"`, `area: "NORTH"` is overwritten by the directory values; sending all three as null clears the location.
- Backend `tsc` clean (Prisma client generated with `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true`). Frontend `next lint` and `tsc` clean.
- Public code read only: it reads `city` and `area` only (`backend/src/properties.ts` filters, `GET /api/properties/locations`; `frontend/lib/search.ts`, `lib/public-api.ts`).

### NOT verified
- `next build`: fails in the sandbox ONLY because Google Fonts cannot be fetched (not a code error). Run it once on Vercel or locally.
- The migration against a real Postgres, and the HTTP endpoints / admin screens in a browser (the form was only type-checked and linted, plus the validation calls above).
- Barangay data against the official PSA file (psa.gov.ph is blocked from the sandbox).

### Still open (needs a decision from Zee)
1. PSGC SOURCE. The barangay data comes from two community npm packages that both state PSA's 30 June 2026 PSGC; they agree on every code and name. The spec says to use only the official PSA publication and to stop and ask for the file if it cannot be downloaded. Either attach the official PSGC `.xlsx` (the import script gets repointed, the data rebuilt and diffed) or explicitly accept the two-package data.
2. REGION MAPPING is keyed by locality name in `cebu-regions.json` (resolved to PSGC codes at build time). The spec wants it keyed by PSGC code. To do.
3. BACKFILL is not done as the spec describes (exact name match, unmatched listed). Currently there is no write: the Edit form does a normalised on-the-fly match ("Carcar" -> "Carcar City"). A dry-run-by-default backfill script (exact match only) still has to be written and run against the real DB; its matched/unmatched list is the report the spec asks for.
4. PUBLIC CITY FILTER: it matches `city` text exactly, and the dropdown lists distinct `city` values. A re-saved listing becomes "Carcar City" while an old one still says "Carcar", so both can appear. Public code was left untouched as instructed.
5. The public site does not show barangay/subdivision and its filters do not offer West/Central or Metro. Left alone on purpose.

### To do on deploy
1. `cd backend && npm install && npx prisma migrate deploy` (then `npx prisma generate`).
2. Redeploy the backend (it needs the `data/` folder) and the frontend.
3. Test in /admin: add a listing in each of the 4 regions, edit an old listing (note shows how its city was read), try changing region and confirm city/barangay reset.

---

## After Phase 13 — Frontend moved to Next.js 14.2.35 (requested by Zee, 2026-11-07, to match the Zee Zafra Properties project)
Versions now (`frontend/package.json`): next 14.2.35 (exact), react/react-dom ^18.3.1, tailwindcss ^3.4.7 + postcss + autoprefixer, typescript ^5.5.4, eslint ^8.57 + eslint-config-next 14.2.35, sonner ^2.0.7. Before: Next 16.4.3, React 19.3.0, Tailwind 4. The backend is untouched. `package-lock.json` was regenerated.
Changes (all in `frontend/`):
- `next.config.ts` -> `next.config.mjs` (Next 14 cannot read .ts configs). Kept the `/api/*` rewrite to Render. REMOVED `cacheComponents`, `partialPrefetching` and the Turbopack/Tailwind loader (Next 16-only).
- `proxy.ts` -> `middleware.ts` (function renamed `middleware`; same /admin cookie gate and matcher).
- Tailwind 4 -> 3: new `tailwind.config.js` (same colors cream/gold/gold-dark/ink/muted/sage, `shadow-card`, serif/sans fonts, borders default to currentColor as in v4) and `postcss.config.js`; `app/globals.css` starts with `@tailwind base/components/utilities` and the old `@theme static` tokens are now plain `:root` variables (same names). One appended rule keeps placeholder text the same colour as before.
- ESLint: `eslint.config.mjs` -> `.eslintrc.json` (`next/core-web-vitals`); `npm run lint` is `next lint`.
- Types: `PageProps<>`/`LayoutProps<>` replaced with plain types; `params` and `searchParams` are plain objects in Next 14 (no `await`) in `app/properties/page.tsx`, `app/properties/[id]/page.tsx`, `app/admin/properties/[id]/page.tsx`, both layouts. `RawParams` is now exported from `lib/search.ts`. `tsconfig.json` got `jsx: preserve` from Next 14.
- `app/page.tsx` and `app/sitemap.ts` got `export const dynamic = "force-dynamic"`. Reason: Next 14 prerenders at build time, and if the Render API is asleep during the Vercel build the home page would show "Listings are unavailable" until it revalidated. API fetches stay cached 60 s (sitemap 1 h).
Verified (production `next build` of a test copy with real fonts via @fontsource, headless Chromium): `tsc` clean, `next lint` clean, build passes (17 pages). Pixel-compared against the Next 16 build at 360 and 1280 px: home, about, contact, sell, /properties (+ rent tab), a detail page, admin login are identical (with and without listings, using a mock API). /admin redirects to login without a cookie; sitemap and robots work; modal, menu, sticky header and the overflow guard behave as before.
NOT verified: the logged-in admin screens (login, add/edit listing, inquiries, Cloudinary upload) were only type-checked, not run; a real Vercel build; the real fonts through `next/font/google` (test used local copies of the same fonts); the Render API. Next 14 gives `/properties/<missing id>` a 200 page with noindex (same soft 404 as before).
Going back to Next 16: use `tagsip-phase13-logo-and-overflow-guard.zip` (the previous zip).

## After Phase 13 — Logo fix (requested by Zee, 2026-11-07)
1. New house icon (`components/Header.tsx`, inline SVG, same gold line style): pitched roof with a small chimney, walls with rounded base corners, arched door with a knob. Replaces the plain house-with-center-line icon. Only the header uses it (the footer has no logo).
2. Phones (max-width 440px): the logo is now two lines, "Cebu Properties" over a small gold "BY MCT" (`app/globals.css`, the rule that used to hide `.brand-by`). Wider screens still show one line "Cebu Properties by MCT". The text is the same on every screen; only the layout changes.
Verified (production build of a test copy, real fonts, headless Chromium): header at 320, 360, 390 and 1280 px, nothing clipped, no horizontal overflow, the Inquire Now button and menu toggle keep their space. NOT verified: on a real phone. Favicon (`app/favicon.ico`) was not changed and still shows the old look.

## After Phase 13 — Mobile horizontal-scroll guard (requested by Zee, 2026-11-07)
Symptom (Zee's phone screenshot): on the home page the search card, "View All Properties" arrow and the Inquire Now button run past the right edge; the page scrolls sideways. Layout width on the phone is about 383 CSS px on a 360 px screen.
Cause: NOT FOUND. A real Chromium sweep (real Playfair/DM Sans/Allura via @fontsource, API unreachable so the "Listings are unavailable" state shows, 5 pages x 6 widths 320-412) found no overflowing element and no sideways scroll. Something on Zee's phone differs (browser, system font size, or an in-app browser such as Messenger's).
Change: ONE block appended at the end of `frontend/app/globals.css` ("Mobile overflow guard"): `html{text-size-adjust:100%;overflow-x:hidden}` and `body{overflow-x:clip}`. html uses hidden (applies to the viewport, so the sticky header still works); body uses clip (never a scroll container). This is a safety net, not a root-cause fix.
Verified (production `next build` of a test copy, stand-in-free real fonts): build passes; with a forced 470 px element the layout width stays 360 (without the guard it grew to 470); sticky header stays at top after scrolling; menu toggle and Inquire modal open/close and body overflow resets; all 5 pages x 6 widths still show no overflow.
NOT verified: on a real phone. If sideways scroll remains, send a screenshot of the very bottom of the page plus the browser name (Chrome, Samsung, Messenger/Facebook in-app, etc.).
Earlier "Date.now() prerender error": appeared only in the sandbox dev server; the production build of this project completed cleanly (18/18 pages) with no Date.now message. Real Vercel build still unconfirmed.

## After Phase 13 — Resend inquiry emails + Sell nav link (requested by Zee, 2026-11-07)
1. Sell nav: the header "Sell" link now ALWAYS goes to `/sell` (`components/Header.tsx`). It used to go to `/#contact` (the footer credentials bar) until `sellPage.approved` was true, so clicking Sell showed nothing. `approved` still controls the "Draft wording" note, `noindex` and the sitemap entry, so nothing is claimed as broker-approved. Phase 0 decision ("Sell nav stays as in the HTML") was overridden by Zee.
2. Email on every new inquiry via Resend (`backend/src/notify.ts`, new; called from `src/inquiries.ts` right after the inquiry is saved and the 201 is sent; `src/config.ts` only adds startup warnings). Uses Resend's REST API through fetch: NO new dependency, NO migration. Failures are caught and logged (HTTP status + Resend's message, never visitor data); the lead is always saved first. Visitor text is HTML-escaped; Reply-To is the visitor's email. Honeypot hits and duplicates send nothing.
Render env vars: `RESEND_API_KEY`, `INQUIRY_NOTIFY_TO` (comma-separated, e.g. Marie Chris + Zee), `INQUIRY_FROM` (e.g. `Cebu Properties by MCT <inquiries@yourdomain.com>`). Without key + recipients nothing is sent.
LIMIT: without a verified domain in Resend, only the test sender `onboarding@resend.dev` works and it delivers ONLY to the Resend account owner's own email. Domain is not chosen yet, so for now set INQUIRY_NOTIFY_TO to the email used to sign up to Resend. Add the domain DNS records in Resend before emailing Marie Chris's Gmail.
Verified: notifier unit-tested with a mocked fetch (recipients, reply_to, subject line-break stripping, script tag escaped, no key = no call, HTTP 403 logged not thrown). NOT verified: `tsc` on the backend (no node_modules/Prisma client here), a real Resend send, the browser view of the header link.

## After Phase 13 — About page UI/UX redesign (requested by Zee, 2026-11-06)
Scope: /about only. The homepage broker section, /contact, /sell, footer and `components/BrokerParts.tsx` are NOT touched.
What changed:
- `components/AboutParts.tsx` (NEW) — `AboutName` (script name + large surname, ", REB, REA" shown smaller; still ONE h1), `AboutPositioning`, `AboutBio`, `AboutCredentials`, `AboutContact`. All values read from `lib/broker.ts`.
- `app/about/page.tsx` — new layout (portrait + brand caption on the left, sticky on desktop; intro, About, Professional credentials, Get in touch on the right). Heading order is now h1 > h2 (it was h1 > h3). Portrait still uses `BrokerPortrait` with `priority`.
- `lib/broker.ts` — new OPTIONAL `positioning?: string`. When not set, /about shows the two tagline lines from her card joined together ("Helping you find the right property. Turning your real estate goals into reality."). Set it only with her approval.
- `app/globals.css` — one block appended at the end ("About page redesign"), everything scoped under `.about-page`/`.ab-*`. The old `.about-h`, `.about-bio`, `.about-creds`, `.bio-placeholder` rules are now unused by /about (still used or harmless: `.bio-placeholder` is still used by /sell; left in place).
- `scripts/launch-check.mjs` — only the wording of the empty-bio warning.
Bio: still `broker.bio` (string[] or null), one paragraph per string; first paragraph is shown larger as a lead. While null it shows a plain gold-ruled line "Marie Chris's personal introduction will appear here." (no dashed box, no invented text).
Contact: phone (`tel:`), email (`mailto:`) and Facebook (new tab, `noopener noreferrer`, "(opens in a new tab)" for screen readers) were already links; they are now full-width rows with label, hover and focus-visible states. Location is plain text. Only ONE phone number exists in `lib/broker.ts`; a second number would need a data change first.
Contrast: gold #B98A4A on cream is ~2.9:1, so text that was gold now uses #9b7138 (script name, large) and #85602a (small labels); grey labels use #5f5d57 (about 6:1). Icons and borders keep the brand gold.
Credentials cards also show the full agency names (Professional Regulation Commission; Department of Human Settlements and Urban Development). Those are the public names of the agencies, not claims about her; remove them in `AboutParts.tsx` if she prefers.
Verified (sandbox, real components rendered with react-dom/server + the real CSS, headless Chromium, font stand-ins, a TEST-ONLY sample bio that is not in the project): no horizontal overflow at 1440, 1024, 768, 390, 320 px (empty bio and sample bio); links have the right href/target/rel; tab order phone > email > Facebook; focus ring visible; one h1, h2s in order.
NOT verified: `next build`/`tsc` under the project's strict config (no node_modules here), real fonts (Playfair, DM Sans, Allura; the script-name width and the surname size were checked with fallback fonts), Lighthouse, a real deploy.
Still awaiting the broker: bio text, real Facebook URL (link still goes to facebook.com), approval of the positioning line, confirmation of PRC/DHSUD/phone/email.

## After Phase 13 — North / South Cebu in the Location dropdowns (requested by Zee, 2026-11-05)
Why: the Location dropdown only listed cities typed into listings (so just "Cebu"). Zee wants North and South Cebu, chosen by the admin per listing (e.g. Carcar = South).
Design: new OPTIONAL `Property.area` (enum `CebuArea` NORTH|SOUTH). The admin picks it on each listing; nothing is guessed from the city name, so no town-to-region list was invented. Empty = not set (fine for Cebu City / Metro Cebu). The two options "North Cebu" / "South Cebu" are fixed and always shown in the hero and /properties Location dropdowns (group "Area"), followed by the cities from listings (group "City"). One dropdown still holds one choice (an area OR a city).
Files:
- `backend/prisma/schema.prisma` — enum `CebuArea`, `Property.area CebuArea?`
- `backend/prisma/migrations/20261105020000_add_property_area/migration.sql` — HAND-WRITTEN (CREATE TYPE + ADD COLUMN); run `npx prisma migrate deploy`, then `npx prisma generate`
- `backend/src/propertyInput.ts` — validates `area` (NORTH, SOUTH, ""/null clears)
- `backend/src/properties.ts` — `GET /api/properties?area=NORTH|SOUTH` (400 on bad value)
- `frontend/lib/search.ts` — `AREA_OPTIONS`, `area` in SearchState / URL (`?area=south`), `locationValue` / `splitLocation` helpers, `heroHref` takes `location`; an area replaces a city if a URL has both
- `frontend/components/Hero.tsx`, `PropertyFilters.tsx` — Location select now `name="location"` with Area + City groups
- `frontend/app/properties/page.tsx` — removable "North Cebu" / "South Cebu" chip
- `frontend/lib/admin-api.ts`, `components/admin/PropertyForm.tsx` — "Area of Cebu" select on the listing form (Address now spans both columns)
TO DO AFTER DEPLOY: existing listings have no area. Edit each one in /admin and set North/South, or searching "South Cebu" returns nothing.
Verified: `lib/search.ts` typechecked (strict) and 15 behavior checks pass (hero hrefs, URL round trip, API param, bad values). All edited files parse. NOT verified: Prisma migration against a real Postgres, `prisma generate`, full `next build`, browser check (no node_modules / no network in the sandbox this time).
Not done on purpose: area is not shown on listing cards or the detail page (would change the ported card text); say so if you want "Carcar, South Cebu" there.

## After Phase 13 — filter changes requested by Zee (2026-11-05)
1. /properties: the Min price / Max price boxes are replaced by ONE "Price range" dropdown (`components/PropertyFilters.tsx`, `lib/search.ts`). Buy/All use the hero's purchase bands (Below ₱5M, ₱5M–10M, ₱10M–20M, Above ₱20M); Rent uses monthly-rent bands (`RENT_PRICE_BANDS`: below ₱15,000, 15–30k, 30–60k, above ₱60,000). THE RENT EDGES ARE MY PROPOSAL, edit the numbers in `lib/search.ts`. URL params stay `minPrice`/`maxPrice` (backend unchanged), so old links work; a range that matches no band shows as a "Custom: ..." option.
2. New property type "Lot": enum value `LOT` (`schema.prisma`), migration `20261105010000_add_lot_property_type` (ALTER TYPE ... ADD VALUE, hand-written; run `npx prisma migrate deploy`, then `npx prisma generate`), label in `lib/admin-api.ts` (admin form picks it up automatically), filter option in `lib/search.ts` (hero + /properties), API comment. Verified locally: API filter `propertyType=LOT`, hero and /properties dropdowns.
Tested in the font-stubbed test build with headless Chromium: dropdown options, filtering by Lot and by a band, selection kept after reload, Custom option, no horizontal scroll at 390px.


## Phase 13 — Deploy hardening, SEO & polish (CODE DONE in sandbox, 2026-11-05; real deploy still unconfirmed)
Status: backend typechecked and runtime-tested (headers, CORS, 404, 413, bad JSON); frontend typechecked, linted (only the old PropertyList.tsx error) and built + browser-tested in a font-stubbed test copy against local Postgres 16. Real fonts and real Render/Vercel deploy NOT verified.
Backend: `src/config.ts` (origins trimmed, trailing slash removed; `checkEnvironment()` warns at startup about missing DATABASE_URL/JWT_SECRET, localhost or http in CORS_ORIGINS in production, missing Cloudinary vars, leftover ADMIN*_PASSWORD), `src/index.ts` (security headers, 100kb JSON limit, no-store on /api/auth + /api/admin, JSON 404 for unknown /api paths, 4xx body errors no longer become 500).
Frontend: `lib/site.ts` (NEXT_PUBLIC_SITE_URL -> VERCEL_PROJECT_PRODUCTION_URL -> localhost), `app/layout.tsx` (metadataBase, default description, Open Graph, twitter card; default share image = next-chapter.jpg), `app/robots.ts` (disallows /admin, /api/, /status), `app/sitemap.ts` (pages + every non-placeholder listing, hourly; /sell only once approved), canonical on home/about/contact/sell/detail, sample listings' detail pages are noindex, `/status` noindex, `components/BrokerJsonLd.tsx` (RealEstateAgent from lib/broker.ts only), `app/not-found.tsx`, `app/error.tsx`, skip link + `id="main"`, focus-visible rings, InquiryModal focus trap/return, sticky close button, short modal entrance, reduced-motion rule, /about portrait `priority`, detail skeleton min-height. All CSS is an appended Phase 13 block.
`scripts/launch-check.mjs` (run `node scripts/launch-check.mjs` from the project root): fails on wrong PRC/DHSUD/phone/email, Merlinda or Zee brand data, secrets or .env files; lists what still needs confirming. Currently PASS.
Lighthouse (local, mobile, stubbed fonts, external images blocked): perf 92-99, a11y 94-98, best-practices 96-100, SEO 91-100. Detail page SEO 91 is Lighthouse not seeing the streamed meta description (Googlebot UA gets it in <head>, checked with curl). Detail CLS 0.15 reported by Lighthouse on the hidden modal; NOT reproduced in a throttled real browser (0 shifts). Baseline check done: the same 0.154 appears WITHOUT the Phase 13 CSS, so it is pre-existing (not a Phase 13 regression); likely a Lighthouse/streaming artifact on the hidden modal. Re-measure on the real Vercel deploy.
Open observations (not changed, design): white text on the gold buttons/price badge fails WCAG contrast (about 3:1); heading order skips h2 on /properties and /about; the detail 404 is still a soft 404 (200 + noindex).
Launch checklist (Zee/broker): confirm PRC, DHSUD, phone, email; real Facebook URL; bio; approve /sell wording and the consent text; replace placeholder listings; set NEXT_PUBLIC_SITE_URL (Vercel) and CORS_ORIGINS (Render, https, no localhost); blank ADMIN*_PASSWORD after seeding. COSTS: Vercel Hobby is non-commercial only (a client site paid for needs Pro); Render free Postgres expires after 30 days (+14 days grace, then deleted) and free web services sleep after 15 min (~1 min cold start), so use paid Render for production. Domain not chosen yet.


## Phase 12 — Contact page (DONE in sandbox, 2026-11-05; real deploy still unconfirmed)
Status: code complete, typechecked, linted, built and browser-tested (local Postgres 16 + headless Chromium). No backend or migration change in this phase.
What was added:
- `/contact` (`app/contact/page.tsx`): headline, intro, the same phone / email / location / Facebook list as /about (`BrokerContactList`, all from `lib/broker.ts`), and an inquiry form. Wording in `lib/contact.ts` (no office hours, response times or office address: none were supplied).
- `components/ContactForm.tsx`: name, phone, email, message, same consent line + honeypot as the modal; posts to `/api/inquiries` WITHOUT `service`, so it is saved as a GENERAL inquiry (shows as "General inquiry" in the inbox).
- Header: Contact now links to `/contact` (desktop + mobile menu) and is underlined on that page.
- The page reuses the `/sell` layout classes (`sell`, `sell-grid`, `sell-card`, `sell-sent`) so the two pages match; one tiny CSS rule added at the end of `globals.css`.
- A visible dashed "Placeholder" note shows on /contact while `broker.facebook.isPlaceholder` is true (the Facebook link still goes to facebook.com).
DECISIONS: the footer keeps `id="contact"` and the Sell nav still points at `/#contact` until `sellPage.approved` is true (Phase 0 decision), so the "retire /#contact" idea from the Phase 11 notes was NOT done. The footer design (credentials bar only) was not changed: adding phone/email there would be a redesign, not a port.
Verified: nav click from home lands on /contact; tel: and mailto: links; required fields block; bad email shows the server message and keeps typed values; success view; "Send another" resets; header Inquire modal still works; no horizontal scroll at 390 and 320 px; mobile menu Contact link; new inquiry appears in /admin/inquiries as General; no page errors.
NOT verified: real Render/Vercel deploy; real fonts (sandbox test copy needs `:root{--font-serif:Georgia,serif}` or every h1 shows at 16px); phone and email were read from a card image and the broker must confirm them before launch, because /contact now shows them prominently.
Awaiting broker: phone, email, Facebook page URL (then set `facebook.isPlaceholder` to false and the note disappears), consent wording, `/sell` copy.

Next: Phase 13 (polish and launch checklist): confirm costs and domain, real Facebook URL, sticky modal close button on small phones, `approved` flags, sitemap/robots, metadata, real fonts check, replace seeded placeholder listings, final deploy test.

## Phase 11 — Sell & Appraisal (DONE in sandbox, 2026-11-05; real deploy still unconfirmed)
Status: code complete, typechecked, built, and browser-tested the same way as Phase 10 (local Postgres 16, headless Chromium). The "Sell" link in the header still points at `/#contact` ON PURPOSE (Phase 0 decision) until the broker approves the page wording.
What was added:
- Backend: migration `20261105000000_add_sell_appraisal` (enum value `SELL_APPRAISAL` on `InquiryType`, new enum `InquiryService` SELL|APPRAISAL, nullable `Inquiry.service` + `Inquiry.propertyLocation`). `POST /api/inquiries` accepts optional `service` + `propertyLocation` (location required 3-150 chars when `service` is set; `propertyId` is ignored on sell inquiries; duplicate check includes `service`). `GET /api/admin/inquiries` takes `type=GENERAL|LISTING|SELL_APPRAISAL` (tab counts respect it).
- Frontend: `/sell` page (`app/sell/page.tsx`), `components/SellForm.tsx` (radio: Sell / Appraisal, location, name, phone, email, message, same consent line + honeypot as the modal), copy in `lib/sell.ts`, Phase 11 block at the end of `globals.css`. Inbox: "Type" filter, "Wants to sell" / "Wants an appraisal" badge and a "Property location" line.
- `lib/sell.ts` has ONE switch, `approved: false`. While false: visible "Draft wording" note, `noindex` meta, header Sell link unchanged. To publish: edit the wording if the broker supplied her own, set `approved: true` (note disappears, noindex removed, header Sell goes to `/sell`).
Verified: curl (sell ok; missing location -> clear 400; bad service -> 400; propertyId ignored; duplicate resend saved once; admin type filter + bad type 400); browser (radio required, server error keeps typed values and the chosen option, success view, "Send another" resets, header Inquire modal still works on /sell, Sell nav underline on /sell, no horizontal scroll at 390 and 320 px, inbox badges, Type filter and tab counts, no page errors).
SANDBOX GOTCHA (not an app bug): in the font-stubbed test copy, `--font-serif` is invalid because `--font-playfair` does not exist, so EVERY h1 shows at 16px. Add `:root{--font-serif:Georgia,serif}` to the test copy only. Do not use `pkill -f` in a command (it kills the shell itself); kill by PID. Postgres must be restarted each session (`service postgresql start`).
NOT verified: real Render/Vercel deploy and `prisma migrate deploy` (the sandbox applied the SQL with psql); real fonts. Run the new migration on the real DB before testing /sell there.
Wording on /sell is DRAFT: it only restates her title and numbers and makes no claims about fees, process, timelines or results. Marie Chris must approve or supply her own text.
No email notification for new inquiries yet (inbox only).

Next: Phase 12 (Contact page; header/footer contact details from `lib/broker.ts`, `/#contact` links retire). Then Phase 13 polish (sticky modal close button, real broker bio, Facebook URL, sitemap/robots, `approved` flags).

## Phase 10 — Lead capture (DONE in sandbox, 2026-11-04; real deploy still unconfirmed)
Status: code complete and now browser-tested. Verified 2026-11-04 against local Postgres 16 + real `next build` (fonts stubbed in a test copy only) + headless Chromium:
- Backend: `tsc` clean; curl matrix (valid inquiry saved with listing snapshot, invalid email -> 400 message, honeypot -> `{ok:true}` but NOT saved, foreign Origin -> 403, admin list without login -> 401, admin list with login returns counts).
- Public modal (desktop 1440): detail-page button shows "About: <listing>"; consent checkbox required; server error shown inline with typed values kept; fix + resend -> "Thank you"; reopening shows a fresh empty form; Escape closes; header button gives a general inquiry (no "About" line); honeypot is 1x1 px and invisible.
- Mobile modal (390x844 and 320x640): no horizontal overflow, modal scrolls inside the viewport, Send button reachable. KNOWN MINOR: at 320x640 the "x" is absolutely positioned inside the scrolling modal, so it scrolls out of view once the form is scrolled down. Escape, backdrop tap (20 px margin) and scrolling up still close it; not changed (Phase 10 is additive). A sticky close button is a small Phase 13 polish item.
- Admin inbox: logged out -> /admin/login; login -> dashboard shows the Inquiries card; inbox lists newest first; tab counts update after "Mark contacted"; per-listing filter works; delete confirm ("Keep it" keeps, "Delete" removes); dashboard count updates; mobile 390px has no horizontal overflow; no page errors.
- Console errors seen were only blocked external images (Unsplash) in the sandbox plus the deliberate 400 from the bad-email test.
NOT done / NOT verified: a real Render + Vercel deploy (Phases 1, 4, 5, 6 also still unconfirmed on a real deploy); real fonts; real Cloudinary photos; `prisma migrate dev` drift check (the sandbox applied the hand-written migration SQL directly with psql because Prisma's schema engine can't download); email notification (none exists).
Sandbox note: `service postgresql start`, `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true npx prisma generate`, `npm install --ignore-scripts`; background servers must be started with `setsid nohup ... < /dev/null &` or they die when the command ends.
Awaiting confirmation: inquiry consent wording (`CONSENT_TEXT` in `frontend/lib/inquiry.ts` is DRAFT, not legal text) from Zee and the broker.

Original Phase 10 notes:
Backend (backend/):
- `prisma/schema.prisma` — enums `InquiryType` (GENERAL/LISTING), `InquiryStatus` (NEW/CONTACTED/CLOSED); model `Inquiry` (name, phone, email, message, propertyId? SetNull, propertyTitle snapshot, consentAt); `Property.inquiries` back-relation.
- `prisma/migrations/20261104000000_add_inquiry/migration.sql` — HAND-WRITTEN (applied cleanly to Postgres 16; first real `prisma migrate dev` should report no drift).
- `src/inquiries.ts` (new) — public `POST /api/inquiries`: validation, honeypot `hp_extra`, Origin check, duplicate suppression (same email+message+listing within 10 min), in-memory throttle (5 per IP / 60 total per 15 min) counted only for inquiries that would be saved. Unknown/draft listing -> saved as GENERAL (never lose a lead). Returns only `{ok:true}`.
- `src/admin.ts` — added `GET /api/admin/inquiries` (status, propertyId, limit, offset; returns counts), `PATCH /api/admin/inquiries/:id` {status}, `DELETE /api/admin/inquiries/:id`; `/summary` now also returns `inquiries`.
- `src/index.ts` — mounts `/api/inquiries`.
Frontend (frontend/):
- `lib/inquiry.ts` (new) — `CONSENT_TEXT` (DRAFT wording, not legal text), `sendInquiry()` (60 s timeout for Render cold starts).
- `components/InquiryModal.tsx` — real form: consent checkbox, honeypot, sending/error/sent states, `open()` and `openForListing()`; `InquireButton` takes optional `property`.
- `components/PropertyDetail.tsx` — Inquire button passes the listing.
- `lib/admin-api.ts` (types/labels appended), `components/admin/InquiryInbox.tsx` + `app/admin/inquiries/page.tsx` (new), `AdminShell.tsx` (Inquiries link), `AdminDashboard.tsx` (inquiries card).
- `app/globals.css` — appended Phase 10 block.
Decisions: bug found and fixed while testing (throttle originally counted invalid requests and would lock out a visitor fixing typos). Honeypot named `hp_extra` so autofill can't trip it. Inquiries are deletable (privacy requests/spam). Per-listing filter in the inbox uses the listings list from the admin API.
Open items: consent wording must be confirmed by Zee and the broker. No email/notification on new inquiry yet (Marie Chris must check /admin/inquiries) — recommend deciding on an email provider. Phase 11 needs a SELL_APPRAISAL value added to `InquiryType`.
Setup: `cd backend && npx prisma migrate deploy` (Render build already runs it).
Sandbox tip: `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true npx prisma generate` works offline.
Next: Phase 11 (Sell & Appraisal pages; add SELL_APPRAISAL to `InquiryType` with a migration). Before that, Zee should run the Phase 10 migration on the real DB (`npx prisma migrate deploy`) and test one inquiry end to end on Render + Vercel.

---

## Phase 9 — Meet the Broker + About (written 2026-11-03)
Files created (frontend/):
- `lib/broker.ts` — the ONE `broker` constant: name lines, title, brand, phone (+tel href), email, location, Facebook (flagged placeholder), PRC/DHSUD numbers, taglines, trust line, photo, `bio` (null until the broker supplies it). Phase 12 must read this too; never copy these values.
- `components/BrokerParts.tsx` — `BrokerPortrait`, `BrokerContactList`, `BrokerTagline`, `HouseDivider`, shared by the homepage section and /about.
- `app/about/page.tsx` — /about: portrait, name (h1), About (marked placeholder until `broker.bio` is set), Credentials (PRC / DHSUD), Contact rows, tagline. Metadata built from the constant. Indexable.
Files changed:
- `components/Broker.tsx`, `components/Footer.tsx` — now read from `lib/broker.ts`; markup/classes identical to before (no visual change).
- `components/Header.tsx` — About now links to `/about` (was `/#broker`) and highlights on that page.
- `app/globals.css` — appended a Phase 9 block (nothing above edited).
Decisions:
- Bio is NOT invented. While `broker.bio` is null the page shows a dashed "Placeholder" note. To publish her text: set `bio: ["paragraph 1", "paragraph 2"]` in `lib/broker.ts`; the note disappears. Do this only with her written approval.
- Homepage broker section gets no "Read more" link (design unchanged); the nav About link is the way in. Suggestion for later: a small link under the tagline.
- Facebook link is still the generic facebook.com placeholder (Phase 12 needs the real URL).
Verified: `next typegen` + `tsc` clean, eslint clean on touched files, real `next build` (fonts stubbed in the test copy only) passes with /about prerendered; headless Chromium at 1440 and 390px: one h1, About highlighted in nav, no horizontal overflow, no console errors, contact list text identical on home and /about, footer shows both credentials.
NOT verified: real fonts (the test used fallbacks, so re-check spacing of the script name over "TAGSIP"), a real Vercel deploy, editing the constant and watching both pages change (both import the same object, so expected). The portrait top-alignment tweak was added after the screenshots and not re-rendered. Phases 1, 4, 5, 6 still unconfirmed on a real deploy.
Next: Phase 10 (lead capture: Inquiry table, POST /api/inquiries, admin inbox, real modal form). Needs the privacy/consent wording confirmed with Zee and the broker.

---

## Phase 8 — Search & filters (finished 2026-11-03)
Finishing pass (the last roadmap item, "Location options come from distinct locations in the data, not a hardcoded list"):
- `backend/src/properties.ts` — new `GET /api/properties/locations` -> `{data: ["Cebu City", ...]}`: distinct non-empty cities of non-DRAFT listings, trimmed, case-insensitive duplicates merged, A-Z. Declared above `/:id`.
- `frontend/lib/public-api.ts` — `getLocations()` (server, revalidate 60 s, never throws, `[]` on failure).
- `frontend/components/HeroSection.tsx` (new) — server wrapper: fetches locations inside Suspense (fallback = the same hero with no cities, so no layout jump). `app/page.tsx` uses it instead of `Hero`.
- `Hero.tsx` and `PropertyFilters.tsx` take a `locations` prop; `app/properties/page.tsx` fetches and passes it. `LOCATION_OPTIONS` removed from `lib/search.ts`.
- Visible effect: until listings have a city, the Location dropdowns show only "Location"/"All locations". The 3 seeded placeholders have no city. Cities appear as soon as an admin enters one on a listing (within ~60 s). To restore the HTML's four fixed cities instead, re-add the constant and pass it as `locations`.
- Checked: frontend `tsc` clean after `next typegen`, eslint clean on touched files (1 pre-existing warning in admin-api.ts). NOT checked: the backend change was not run or type-checked here (Prisma's engine download returns 403 in this sandbox), so run `cd backend && npm run typecheck`, then `curl localhost:4000/api/properties/locations` after adding a listing with a city.
- Phase 8 roadmap items now all present: backend filters + sort, real hero search, DB-driven locations, URL-synced filters, empty state with clear.

Original Phase 8 notes:
Backend (`backend/src/properties.ts` only, no migration, no new dependency): `GET /api/properties` now also accepts `q` (each word must appear in title/city/address/description), `city` (exact city, or inside the address; case-insensitive), `propertyType`, `minPrice`/`maxPrice` (inclusive), `minBedrooms` (1-9), `sort=newest|price_asc|price_desc`. All validated (400 + message on bad input), combined with AND, DRAFT still hidden. `%` and `_` typed by a visitor are matched literally.
Files created (frontend/):
- `lib/search.ts` — option lists (locations, property types, hero price bands, sort), `parseSearch` (URL -> clean state, bad values dropped), `buildHref` (clean URLs), `toApiParams`, `heroHref`, peso label helpers
- `components/PropertyFilters.tsx` — client: search box, type, location, bedrooms, min/max price, sort (sort applies immediately); writes everything to the URL; Filters toggle on <=650px
Files changed:
- `components/Hero.tsx` — search bar is real: submit goes to `/properties?...` (same markup/classes; selects got `name`/values)
- `app/properties/page.tsx` — reads full URL state, filter bar, removable chips, "N properties match your search", empty state with Clear link, pagination keeps filters, `noindex, follow` when filtered
- `lib/public-api.ts` — `getProperties(state)` takes the whole search state; `ListingFilter` now defined in `lib/search.ts` and re-exported
- `app/globals.css` — appended Phase 8 block (nothing above edited)
Decisions:
- Choosing a hero Price Range also switches results to Buy (the bands are purchase prices; otherwise "Below ₱5M" would list every rental). Undo: in `heroHref` use `listing: "all"`.
- Switching Buy/Rent tab keeps search words and filters but drops the price range (sale vs. monthly rent scales).
- Price on /properties is free Min/Max (works for rent too); hero bands just fill it in. Band edges are inclusive (₱5M exactly appears in two bands).
- Location and type lists are the HTML's dropdown options; broker still to confirm. Reversed min/max are swapped silently.
- Added bedrooms filter and keyword search (not in the HTML hero); remove from `PropertyFilters` if unwanted.
Verified (local Postgres 16 + real `next build` of a copy with Google Fonts removed + headless Chromium): backend curl matrix (every filter, sort, 400 cases, drafts hidden, wildcard escaping); `tsc` and eslint clean on touched files; hero -> /properties, keyword, chips, Back button, sort, reversed range, tab switch, pagination with filters, empty state, detail page, mobile filter panel, no horizontal overflow at 320-1440px.
NOT verified: real fonts, real Render API / Cloudinary photos, touch devices, Lighthouse. Phases 1, 4, 5, 6 still unconfirmed on a real deploy.
Heads-up: the 3 seeded placeholder listings have NO city, so the Location filter returns nothing for them until real listings with a city exist. Pre-existing lint error in `components/admin/PropertyList.tsx` untouched.
Note: Next 16 keeps the previous route hidden in the DOM; tests must target visible elements.
Next: Phase 9 (Meet the Broker + About).

---

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
- (Old note, obsolete since the Next 14 move: Tailwind 4 ran only under Turbopack. Tailwind is now 3 and builds with the normal webpack pipeline.)

## Observations (not changed, per "port, don't redesign")
- Placeholder cards look like real listings on the page; Phase 3 adds the placeholder flag and label.
- After a demo submit the modal shows "Thank you" again on reopen (same as the original). Phase 10 replaces the form.
- Modal has no focus trap or focus return; "Sell" and "View All Properties" still scroll to `#contact`; the footer `#contact` is just the credentials bar.
- Footer "Contact" and "Sell" get real pages in Phases 11 and 12.

## Secrets
None in this repo. All values live in `.env` files (gitignored) and host dashboards.
