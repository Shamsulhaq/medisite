// =============================================================================
// MEDEX.COM.BD — Browser Data Extractor (Batch Mode)
// 
// Works in batches of 10 index pages to avoid CAPTCHA.
// If CAPTCHA appears, solve it in the browser, then re-run with the next batch.
//
// HOW TO USE:
// 1. Open https://medex.com.bd/generics in your browser
// 2. F12 → Console
// 3. Paste this script → Enter
// 4. It asks: "Start page?" — type 1 for first run
// 5. It processes pages 1-10, extracts details, downloads JSON
// 6. Next run: type 11, then 21, 31... until page 83
// 7. Each run appends to previous data (stored in localStorage)
// 8. Final run: type "download" to get the complete file
//
// Commands when prompted:
//   1-83    = Start from that page (processes 10 pages)
//   all     = Try all pages (may hit CAPTCHA)
//   download = Download all collected data so far
//   clear   = Clear saved progress and start fresh
//   status  = Show how much data is collected
// =============================================================================

(async function medexBatch() {
  const STORAGE_KEY = 'medex_medicines';
  const BATCH_SIZE = 10;
  const PAGE_DELAY = 2000;
  const DETAIL_DELAY = 1000;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Load previously collected data
  let medicines = [];
  let collectedLinks = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) medicines = JSON.parse(saved);
  } catch {}

  const input = prompt(
    `MedEx Extractor — ${medicines.length} generics collected so far.\n\n` +
    `Enter start page (1-83), or:\n` +
    `• "download" — download collected data\n` +
    `• "status" — show stats\n` +
    `• "clear" — reset and start fresh\n` +
    `• "all" — try all pages (risky)\n\n` +
    `Start page:`,
    medicines.length === 0 ? '1' : String(Math.min(83, Math.ceil(medicines.length / 20) * 10 + 1))
  );

  if (!input) return;

  if (input.toLowerCase() === 'download') {
    downloadData(medicines);
    return;
  }
  if (input.toLowerCase() === 'status') {
    console.log(`Collected: ${medicines.length} generics, ${medicines.reduce((s,m) => s+m.brands.length, 0)} brands`);
    return;
  }
  if (input.toLowerCase() === 'clear') {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Cleared all saved data.');
    return;
  }

  const startPage = parseInt(input) || 1;
  const endPage = input.toLowerCase() === 'all' ? 83 : Math.min(83, startPage + BATCH_SIZE - 1);

  console.log(`%c[MedEx] Processing index pages ${startPage} to ${endPage}...`, 'color:green;font-weight:bold');

  // STEP 1: Collect links from index pages
  const newLinks = [];
  for (let page = startPage; page <= endPage; page++) {
    try {
      const res = await fetch(`https://medex.com.bd/generics?page=${page}`, { credentials: 'include' });
      if (!res.ok) { console.warn(`Page ${page}: HTTP ${res.status}`); continue; }
      const html = await res.text();

      if (html.includes('captcha-challenge') || html.includes('/captcha')) {
        console.error(`%c[MedEx] CAPTCHA on page ${page}! Solve it in browser, then re-run starting from page ${page}.`, 'color:red;font-weight:bold');
        if (newLinks.length > 0) console.log(`Processing ${newLinks.length} links collected before CAPTCHA...`);
        break;
      }

      const re = /https:\/\/medex\.com\.bd\/generics\/(\d+\/[^"]+)/g;
      let m, count = 0;
      while ((m = re.exec(html))) {
        if (!newLinks.includes(m[1])) { newLinks.push(m[1]); count++; }
      }
      console.log(`[MedEx] Page ${page}: +${count} links (batch total: ${newLinks.length})`);
      await sleep(PAGE_DELAY);
    } catch (err) {
      console.warn(`Page ${page} error:`, err.message);
    }
  }

  if (newLinks.length === 0) {
    console.log('[MedEx] No links found. Try solving CAPTCHA first.');
    return;
  }

  // STEP 2: Extract details from each link
  console.log(`%c[MedEx] Extracting details from ${newLinks.length} generics...`, 'color:blue;font-weight:bold');
  let processed = 0, errors = 0;

  for (const link of newLinks) {
    processed++;
    try {
      const res = await fetch(`https://medex.com.bd/generics/${link}`, { credentials: 'include' });
      if (!res.ok) { errors++; continue; }
      const html = await res.text();

      if (html.includes('captcha-challenge')) {
        console.error(`%c[MedEx] CAPTCHA at detail ${processed}/${newLinks.length}. Saving progress...`, 'color:red');
        break;
      }

      // Generic name
      const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const generic = h1 ? h1[1].trim() : '';
      if (!generic || generic.length > 100) continue;

      // Brands
      const brands = [];
      const brandRe = /"name":"([^"]{2,50})","generic_id"/g;
      let bm;
      while ((bm = brandRe.exec(html))) {
        const name = bm[1].trim();
        if (name && name.toLowerCase() !== generic.toLowerCase() && !brands.includes(name)) brands.push(name);
      }

      // Forms (English only)
      const forms = [];
      const formRe = /"dosage_form":\{[^}]*?"name":"([^"]+)"/g;
      while ((bm = formRe.exec(html))) {
        const f = bm[1].trim();
        if (f && f.length < 40 && /^[\x20-\x7E]+$/.test(f) && !forms.includes(f)) forms.push(f);
      }

      // Dosages (English only, validated)
      const dosages = [];
      const doseRe = /"strength":"([^"]+)"/g;
      while ((bm = doseRe.exec(html))) {
        const d = bm[1].trim();
        if (d && d.length < 30 && /\d/.test(d) && /^[\x20-\x7E]+$/.test(d) &&
            /mg|mcg|ml|gm|g|IU/i.test(d) && !/^\d+%$/.test(d) && !dosages.includes(d)) {
          dosages.push(d);
        }
      }

      // Merge into collection
      const existing = medicines.find(med => med.generic.toLowerCase() === generic.toLowerCase());
      if (existing) {
        brands.forEach(b => { if (!existing.brands.includes(b)) existing.brands.push(b); });
        forms.forEach(f => { if (!existing.forms.includes(f)) existing.forms.push(f); });
        dosages.forEach(d => { if (!existing.dosages.includes(d)) existing.dosages.push(d); });
      } else {
        medicines.push({ generic, brands, forms, dosages });
      }

      if (processed % 10 === 0) {
        console.log(`[MedEx] ${processed}/${newLinks.length} — ${medicines.length} generics total`);
        // Save progress to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
      }

      await sleep(DETAIL_DELAY);
    } catch (err) { errors++; }
  }

  // Save final progress
  localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));

  console.log(`%c[MedEx] Batch done!`, 'color:green;font-weight:bold');
  console.log(`  Processed: ${processed}/${newLinks.length}, Errors: ${errors}`);
  console.log(`  Total collected: ${medicines.length} generics, ${medicines.reduce((s,m)=>s+m.brands.length,0)} brands`);
  console.log(`  Data saved to localStorage.`);

  // Ask to download
  if (confirm(`Done! ${medicines.length} generics collected.\n\nDownload JSON file now?\n(You can also type "download" on next run)`)) {
    downloadData(medicines);
  }

  const nextPage = endPage + 1;
  if (nextPage <= 83) {
    console.log(`%c[MedEx] Next run: paste script again and enter ${nextPage}`, 'color:blue');
  } else {
    console.log(`%c[MedEx] All pages processed! Use "download" to get the file.`, 'color:green;font-weight:bold');
  }

  function downloadData(data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medex-medicines-${data.length}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1000);
    console.log(`%c[MedEx] ✓ Downloaded: medex-medicines-${data.length}.json`, 'color:green;font-weight:bold');
    console.log('Import via: Admin → Medicines → Import');
  }
})();
