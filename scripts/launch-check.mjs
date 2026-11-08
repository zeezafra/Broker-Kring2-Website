#!/usr/bin/env node
// Phase 13 launch check. Run from the project root:  node scripts/launch-check.mjs   (add --strict to fail on warnings)
//
// FAILS (exit 1) on:
//   1. wrong credentials/contact data in frontend/lib/broker.ts (compared with the values from Marie Chris's card)
//   2. another client's data (Merlinda G. Alonzo, Zee Zafra Properties, their licence numbers) in site code
//   3. anything that looks like a secret in a project file, or an .env file other than .env.example
// WARNS about what still needs the broker's confirmation before the site goes public.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const failures = [];
const warnings = [];

// ---- what Marie Chris's card says (to be confirmed by her before launch) ----
const EXPECTED = {
  prcLicenseNo: "0036820",
  dhsudRegNo: "R7-B-06/26-8696",
  phoneDisplay: "+63 936 948 0702",
  phoneHref: "tel:+639369480702",
  email: "cebupropertiesbymct@gmail.com",
};

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", ".git", ".vercel", "generated"]);
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".css", ".md", ".prisma", ".sql", ".toml", ".yml", ".yaml", ".txt", ".html", ".example", ""]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(root);
const rel = (f) => relative(root, f).replaceAll("\\", "/");

// ---- 3a. env files ----
for (const f of files) {
  const b = basename(f);
  if (b.startsWith(".env") && b !== ".env.example") failures.push(`${rel(f)}: env file must not be in the project or zip (only .env.example)`);
}

// ---- 1. broker.ts ----
const brokerPath = join(root, "frontend/lib/broker.ts");
try {
  const src = readFileSync(brokerPath, "utf8");
  const has = (label, needle) => {
    if (!src.includes(needle)) failures.push(`frontend/lib/broker.ts: ${label} is not "${needle}"`);
  };
  has("PRC licence number", `prcLicenseNo: "${EXPECTED.prcLicenseNo}"`);
  has("DHSUD registration number", `dhsudRegNo: "${EXPECTED.dhsudRegNo}"`);
  has("phone display", `display: "${EXPECTED.phoneDisplay}"`);
  has("phone link", `href: "${EXPECTED.phoneHref}"`);
  has("email", `email: "${EXPECTED.email}"`);
  if (/facebook:\s*\{[^}]*isPlaceholder:\s*true/.test(src)) warnings.push("Facebook page URL is still the facebook.com placeholder (broker.facebook.isPlaceholder).");
  if (/bio:\s*null/.test(src)) warnings.push("Broker bio is empty: /about shows a quiet \"introduction will appear here\" note until she writes or approves text (broker.bio).");
} catch {
  failures.push("frontend/lib/broker.ts not found: run this from the project root");
}

// ---- 2 + 3b. content scans ----
const FORBIDDEN = [
  [/0036821/, "Merlinda's PRC number (one digit off from Marie Chris's)"],
  [/R7-B-06\/26-8695/, "Merlinda's DHSUD number (one digit off from Marie Chris's)"],
  [/Merlinda|Alonzo/i, "another client's name"],
  [/Zee Zafra/i, "Zee's own brand"],
];
const SECRETS = [
  [/postgres(?:ql)?:\/\/(?!USER:PASSWORD@)[^\s:@/"']+:[^\s@/"']{3,}@/i, "database URL with a password"],
  [/(?:JWT_SECRET|CLOUDINARY_API_SECRET|CLOUDINARY_API_KEY|ADMIN\d_PASSWORD)\s*=\s*[^\s#]+/, "secret variable with a value"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/\b(?:ghp_|github_pat_|sk_live_|sk-ant-)[A-Za-z0-9_]{10,}/, "access token"],
  [/\b[0-9a-f]{64,}\b/i, "long hex string (possible secret or hash)"],
  [/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{50,}/, "bcrypt hash"],
];
// A line that only documents the mix-up risk (comments) or a markdown note may name the other numbers.
const isCommentLine = (l) => /^\s*(\/\/|\/\*|\*|#|<!--)/.test(l);

for (const f of files) {
  const ext = extname(f);
  if (!TEXT_EXT.has(ext) || /package-lock\.json$/.test(f) || basename(f) === "launch-check.mjs") continue;
  let text;
  try {
    text = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const where = `${rel(f)}:${i + 1}`;
    if (ext !== ".md" && !isCommentLine(line)) {
      for (const [re, what] of FORBIDDEN) if (re.test(line)) failures.push(`${where}: ${what}`);
    }
    for (const [re, what] of SECRETS) {
      // .env.example holds empty names only; skip its documented placeholder lines
      if (basename(f) === ".env.example") continue;
      if (re.test(line)) failures.push(`${where}: ${what}`);
    }
  });
}

// ---- warnings: wording and switches the broker must approve ----
try {
  const sell = readFileSync(join(root, "frontend/lib/sell.ts"), "utf8");
  if (/approved:\s*false/.test(sell)) warnings.push("/sell wording is not approved (sellPage.approved = false): page is noindex and the Sell nav link still goes to the footer.");
} catch {}
try {
  const inq = readFileSync(join(root, "frontend/lib/inquiry.ts"), "utf8");
  if (/DRAFT/.test(inq)) warnings.push("Inquiry consent wording (CONSENT_TEXT in lib/inquiry.ts) is still DRAFT: broker and Zee must confirm it.");
} catch {}
warnings.push("Confirm PRC and DHSUD numbers, phone and email with Marie Chris (they were read from a card image).");
warnings.push("Replace the seeded placeholder listings in /admin (untick Placeholder / delete samples) before sharing the site.");
warnings.push("Set NEXT_PUBLIC_SITE_URL on Vercel to the final domain, and CORS_ORIGINS on Render to the same address (https, no trailing slash, no localhost).");

// ---- report ----
const line = "-".repeat(60);
console.log(line + "\nLaunch check\n" + line);
if (failures.length) {
  console.log(`\nFAIL (${failures.length})`);
  failures.forEach((f) => console.log("  x " + f));
} else {
  console.log("\nPASS: credentials match the card, no other client's data, no secrets found.");
}
console.log(`\nStill to confirm / do (${warnings.length})`);
warnings.forEach((w) => console.log("  ! " + w));
console.log("");
process.exit(failures.length || (strict && warnings.length) ? 1 : 0);
