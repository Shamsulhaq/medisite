#!/usr/bin/env node
// -----------------------------------------------------------------------------
// Medex.com.bd Scraper — Human-like mode with random delays and session cookies.
//
// Run: node scripts/scrape-medex.js
//
// Behavior:
//   - Random delay between 5-30 seconds per request (mimics human browsing)
//   - Maintains session cookies across all requests
//   - Follows redirects (handles initial cookie-setting redirect)
//   - Processes one page at a time: fetches index page → extracts links →
//     visits each generic detail page → extracts clean data
//   - Saves progress after every page (safe to interrupt with Ctrl+C)
//   - On restart, skips already-scraped generics (resumes from where it stopped)
//   - Output: data/medicines.json
//
// Flags:
//   --start N    Start from index page N (default: 1)
//   --end N      Stop after index page N (default: 83)
//   --min N      Minimum delay in seconds (default: 5)
//   --max N      Maximum delay in seconds (default: 30)
// -----------------------------------------------------------------------------

const https = require("https");
const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "data", "medicines.json");
const PROGRESS_FILE = path.join(__dirname, "..", "data", "scrape-progress.json");
const args = process.argv.slice(2);

const getArg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) || def : def;
};

const START_PAGE = getArg("start", 1);
const END_PAGE = getArg("end", 83);
const MIN_DELAY = getArg("min", 5);
const MAX_DELAY = getArg("max", 30);

// Use curl for requests — curl has a browser-like TLS fingerprint
// that most bot detection systems don't block (unlike Node.js https)
const { execSync } = require("child_process");

const COOKIE_JAR = path.join(__dirname, "..", "data", ".medex-cookies.txt");

function fetch(url) {
  try {
    const result = execSync(
      `curl -sL -b "${COOKIE_JAR}" -c "${COOKIE_JAR}" ` +
      `-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" ` +
      `-H "Accept: text/html,application/xhtml+xml" ` +
      `-H "Accept-Language: en-US,en;q=0.9" ` +
      `--max-time 30 "${url}"`,
      { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
    );
    return result;
  } catch (err) {
    return "";
  }
}

function randomDelay() {
  return Math.round((MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)) * 1000);
}

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { /* busy wait — simple and reliable */ }
}

// Load DB
function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch { return []; }
}
function saveDB(db) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8")); } catch { return { scrapedSlugs: [] }; }
}
function saveProgress(progress) {
  fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
}

// Validate data
function isValidDosage(s) {
  if (!s || s.length > 30) return false;
  if (!/\d/.test(s)) return false;
  if (/[^\x00-\x7F]/.test(s)) return false;
  if (!/mg|mcg|ml|gm|g|IU/i.test(s)) return false;
  if (/^\d+%$/.test(s)) return false;
  return true;
}
function isValidForm(s) {
  return s && s.length < 40 && /^[\x20-\x7E]+$/.test(s);
}

// Extract medicine data from a detail page HTML
function extractMedicine(html) {
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const generic = h1 ? h1[1].trim() : "";
  if (!generic || generic.length > 100) return null;

  const brands = [];
  const brandRe = /"name":"([^"]{2,50})","generic_id"/g;
  let m;
  while ((m = brandRe.exec(html))) {
    const name = m[1].trim();
    if (name && name.toLowerCase() !== generic.toLowerCase() && !brands.includes(name)) brands.push(name);
  }

  const forms = [];
  const formRe = /"dosage_form":\{[^}]*?"name":"([^"]+)"/g;
  while ((m = formRe.exec(html))) {
    const f = m[1].trim();
    if (isValidForm(f) && !forms.includes(f)) forms.push(f);
  }

  const dosages = [];
  const doseRe = /"strength":"([^"]+)"/g;
  while ((m = doseRe.exec(html))) {
    const d = m[1].trim();
    if (isValidDosage(d) && !dosages.includes(d)) dosages.push(d);
  }

  return { generic, brands, forms, dosages };
}

function mergeInto(db, med) {
  const key = med.generic.toLowerCase();
  const existing = db.find((m) => m.generic.toLowerCase() === key);
  if (existing) {
    let changed = false;
    for (const b of med.brands) { if (!existing.brands.some(eb => eb.toLowerCase() === b.toLowerCase())) { existing.brands.push(b); changed = true; } }
    for (const f of med.forms) { if (!existing.forms.some(ef => ef.toLowerCase() === f.toLowerCase())) { existing.forms.push(f); changed = true; } }
    for (const d of med.dosages) { if (!existing.dosages.some(ed => ed.toLowerCase() === d.toLowerCase())) { existing.dosages.push(d); changed = true; } }
    return changed ? "updated" : "unchanged";
  }
  db.push({ generic: med.generic, brands: med.brands, forms: med.forms, dosages: med.dosages, defaultAdvice: "" });
  return "new";
}

// MAIN
function main() {
  console.log("=== Medex.com.bd Scraper (Human-like mode) ===");
  console.log(`Pages: ${START_PAGE} to ${END_PAGE} | Delay: ${MIN_DELAY}-${MAX_DELAY}s random`);
  console.log(`Output: ${DB_FILE}\n`);

  const db = loadDB();
  const progress = loadProgress();
  let added = 0, updated = 0, skipped = 0, errors = 0;

  console.log(`DB has ${db.length} medicines. ${progress.scrapedSlugs.length} slugs already scraped.\n`);

  // First request to establish session
  console.log("Establishing session...");
  fetch("https://medex.com.bd/generics");
  const d1 = randomDelay();
  console.log(`  Session OK. Waiting ${(d1/1000).toFixed(0)}s...\n`);
  sleep(d1);

  for (let page = START_PAGE; page <= END_PAGE; page++) {
    console.log(`\n--- Index page ${page}/${END_PAGE} ---`);

    const html = fetch(`https://medex.com.bd/generics?page=${page}`);

    if (!html || html.includes("captcha-challenge") || html.includes("/captcha")) {
      console.error("⚠ CAPTCHA detected! Saving progress and stopping.");
      console.error(`  Resume later with: node scripts/scrape-medex.js --start ${page}`);
      break;
    }

    // Extract generic links from this page
    const linkRe = /https:\/\/medex\.com\.bd\/generics\/(\d+\/[^"]+)/g;
    const links = [];
    let lm;
    while ((lm = linkRe.exec(html))) {
      if (!links.includes(lm[1])) links.push(lm[1]);
    }

    if (links.length === 0) {
      console.log("  No links found. End of pages.");
      break;
    }

    console.log(`  Found ${links.length} generics on this page.`);

    // Visit each detail page
    for (let i = 0; i < links.length; i++) {
      const slug = links[i];

      // Skip if already scraped
      if (progress.scrapedSlugs.includes(slug)) {
        skipped++;
        continue;
      }

      const delay = randomDelay();
      process.stdout.write(`  [${i + 1}/${links.length}] ${slug.split("/")[1]?.slice(0, 30)}... (wait ${(delay/1000).toFixed(0)}s) `);
      sleep(delay);

      try {
        const detailHtml = fetch(`https://medex.com.bd/generics/${slug}`);

        if (!detailHtml || detailHtml.includes("captcha-challenge")) {
          console.log("⚠ CAPTCHA!");
          console.error(`\n⚠ CAPTCHA detected at page ${page}, item ${i + 1}. Saving and stopping.`);
          console.error(`  Resume: node scripts/scrape-medex.js --start ${page}`);
          saveDB(db);
          saveProgress(progress);
          process.exit(0);
        }

        const med = extractMedicine(detailHtml);
        if (med && med.generic) {
          const result = mergeInto(db, med);
          if (result === "new") { added++; process.stdout.write(`✓ NEW (${med.brands.length} brands)\n`); }
          else if (result === "updated") { updated++; process.stdout.write(`↑ updated\n`); }
          else { process.stdout.write(`= unchanged\n`); }
        } else {
          process.stdout.write(`- skip (no data)\n`);
        }

        progress.scrapedSlugs.push(slug);
      } catch (err) {
        errors++;
        process.stdout.write(`✗ error: ${err.message}\n`);
      }
    }

    // Save after each index page
    saveDB(db);
    saveProgress(progress);
    console.log(`  Page ${page} done. DB: ${db.length} generics | +${added} new, ${updated} updated, ${errors} errors`);
  }

  // Final save
  saveDB(db);
  saveProgress(progress);

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✓ Scraping complete!`);
  console.log(`  DB: ${db.length} medicines`);
  console.log(`  Brands: ${db.reduce((s, m) => s + m.brands.length, 0)}`);
  console.log(`  New: ${added} | Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors}`);
  console.log(`\nData saved to: ${DB_FILE}`);
}

try {
  main();
} catch (err) {
  console.error("\nFatal error:", err.message);
  try { saveDB(loadDB()); } catch {}
  process.exit(1);
}
