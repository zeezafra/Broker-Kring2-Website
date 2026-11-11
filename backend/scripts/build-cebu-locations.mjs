// Builds backend/data/cebu-locations.json: the Cebu location directory (region -> city/municipality -> barangay)
// with official PSGC codes. Run `npm run locations:build` after a new PSGC quarterly release (bump the two
// dev dependencies first: `npm i -D @ianlabicani/geoph-lite@latest @aivangogh/ph-address@latest`).
//
// Two independent PSGC packages are used and MUST agree on every locality and barangay (code and name),
// otherwise the build fails and writes nothing. The app itself only reads the generated JSON at runtime.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { philippines } from "@ianlabicani/geoph-lite";
import * as phAddress from "@aivangogh/ph-address";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "data", "cebu-locations.json");
const CEBU_PROVINCE = "0702200000";
const REGION_VII = "0700000000";
const EXPECTED_LOCALITIES = 53;

const regionConfig = JSON.parse(fs.readFileSync(path.join(here, "..", "data", "cebu-regions.json"), "utf8"));

const fail = (msg) => {
  console.error(`\nBUILD FAILED: ${msg}\nNothing was written.`);
  process.exit(1);
};

// "City of Bogo", "Bogo City" and "Bogo" all normalise to "bogo"; "Lapu-Lapu City" -> "lapulapu".
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^city of /, "")
    .replace(/ city$/, "")
    .replace(/[^a-z0-9]/g, "");

// ---- Source A: geoph-lite (PSGC hierarchy, 30 June 2026) -------------------------------------------
const aLocalities = [
  ...(await philippines.localities(CEBU_PROVINCE)),
  // Cebu City, Mandaue and Lapu-Lapu sit directly under Region VII in this package (official parentage)
  ...(await philippines.localities(REGION_VII)).filter((l) => ["cebu", "mandaue", "lapulapu"].includes(norm(l.name))),
];

// ---- Source B: ph-address (PSGC hierarchy, 30 June 2026) -------------------------------------------
const bLocalities = phAddress.getMunicipalitiesByProvince(CEBU_PROVINCE);

if (aLocalities.length !== EXPECTED_LOCALITIES) fail(`geoph-lite has ${aLocalities.length} Cebu localities, expected ${EXPECTED_LOCALITIES}`);
if (bLocalities.length !== EXPECTED_LOCALITIES) fail(`ph-address has ${bLocalities.length} Cebu localities, expected ${EXPECTED_LOCALITIES}`);

const aByCode = new Map(aLocalities.map((l) => [l.psgc_code, l]));
const bByCode = new Map(bLocalities.map((l) => [l.psgcCode, l]));
for (const code of aByCode.keys()) if (!bByCode.has(code)) fail(`locality ${code} is in geoph-lite but not in ph-address`);
for (const code of bByCode.keys()) if (!aByCode.has(code)) fail(`locality ${code} is in ph-address but not in geoph-lite`);

// ---- Resolve the website's display names to PSGC localities ----------------------------------------
const localities = [];
const regions = [];
const claimed = new Set();
for (const r of regionConfig.regions) {
  const codes = [];
  for (const display of r.localities) {
    const hits = aLocalities.filter((l) => norm(l.name) === norm(display));
    if (hits.length !== 1) fail(`"${display}" matched ${hits.length} PSGC localities (needs exactly 1)`);
    const hit = hits[0];
    if (claimed.has(hit.psgc_code)) fail(`"${display}" (${hit.psgc_code}) is listed in more than one region`);
    claimed.add(hit.psgc_code);
    codes.push(hit.psgc_code);
    localities.push({ code: hit.psgc_code, name: display, officialName: hit.name, type: hit.type, regionKey: r.key });
  }
  regions.push({ key: r.key, label: r.label, localityCodes: codes });
}
if (localities.length !== EXPECTED_LOCALITIES) fail(`region config has ${localities.length} localities, expected ${EXPECTED_LOCALITIES}`);
for (const code of aByCode.keys()) if (!claimed.has(code)) fail(`PSGC locality ${aByCode.get(code).name} (${code}) is not assigned to any region`);

// ---- Barangays: both sources must agree exactly -----------------------------------------------------
const barangays = {};
let total = 0;
for (const loc of localities) {
  const a = await philippines.barangays(loc.code);
  const b = phAddress.getBarangaysByMunicipality(loc.code);
  const aMap = new Map(a.map((x) => [x.psgc_code, x.name.trim()]));
  const bMap = new Map(b.map((x) => [x.psgcCode, x.name.trim()]));
  if (a.length === 0) fail(`${loc.name} has no barangays in geoph-lite`);
  if (aMap.size !== a.length || bMap.size !== b.length) fail(`${loc.name}: duplicate barangay codes inside one source`);
  if (aMap.size !== bMap.size) fail(`${loc.name}: geoph-lite has ${aMap.size} barangays, ph-address has ${bMap.size}`);
  for (const [code, name] of aMap) {
    if (bMap.get(code) !== name) fail(`${loc.name}: barangay ${code} is "${name}" in geoph-lite but "${bMap.get(code)}" in ph-address`);
    if (!code.startsWith(loc.code.slice(0, 7))) fail(`${loc.name}: barangay code ${code} does not belong under ${loc.code}`);
  }
  const names = [...aMap.values()].map((n) => n.toLowerCase());
  if (new Set(names).size !== names.length) fail(`${loc.name}: two barangays share the same name`);
  barangays[loc.code] = [...aMap.entries()]
    .map(([code, name]) => [code, name])
    .sort((x, y) => x[1].localeCompare(y[1], "en", { sensitivity: "base", numeric: true }));
  loc.barangayCount = barangays[loc.code].length;
  total += loc.barangayCount;
}

const version = (pkg) => JSON.parse(fs.readFileSync(path.join(here, "..", "node_modules", pkg, "package.json"), "utf8")).version;
const output = {
  meta: {
    description: "Cebu province location directory: website region -> city/municipality -> barangay, with official PSGC codes.",
    regionsNote: "The four regions are website browsing categories, not official administrative classifications.",
    psgcPublication: "2026-06-30 (2Q 2026)",
    provinceCode: CEBU_PROVINCE,
    sources: [
      { package: "@ianlabicani/geoph-lite", version: version("@ianlabicani/geoph-lite") },
      { package: "@aivangogh/ph-address", version: version("@aivangogh/ph-address") },
    ],
    verification: "Both sources agreed on every locality and barangay (code and name) when this file was built.",
    counts: { regions: regions.length, localities: localities.length, barangays: total },
  },
  regions,
  localities,
  barangays,
};

fs.writeFileSync(OUT, JSON.stringify(output, null, 1) + "\n");
console.log(`Wrote ${path.relative(process.cwd(), OUT)}: ${regions.length} regions, ${localities.length} localities, ${total} barangays.`);
for (const r of regions) {
  const n = localities.filter((l) => l.regionKey === r.key).reduce((s, l) => s + l.barangayCount, 0);
  console.log(`  ${r.label}: ${r.localityCodes.length} localities, ${n} barangays`);
}
