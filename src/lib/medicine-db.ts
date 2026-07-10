// -----------------------------------------------------------------------------
// Medicine database — stored in data/medicines.json.
// Supports CRUD, JSON/CSV import/export, and fast prefix search.
// The built-in seed list (src/lib/medicines.ts) is used as a fallback only
// when data/medicines.json doesn't exist.
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import type { MedicineRef } from "./medicines";
import { MEDICINES as BUILT_IN } from "./medicines";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "medicines.json");

export async function getMedicineDB(): Promise<MedicineRef[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : BUILT_IN;
  } catch {
    // Seed from built-in + custom
    const custom = await loadCustom();
    const merged = [...BUILT_IN, ...custom];
    await fs.writeFile(FILE, JSON.stringify(merged, null, 2), "utf8");
    return merged;
  }
}

async function loadCustom(): Promise<MedicineRef[]> {
  try {
    const raw = await fs.readFile(
      path.join(DATA_DIR, "custom-medicines.json"),
      "utf8"
    );
    return JSON.parse(raw) ?? [];
  } catch {
    return [];
  }
}

export async function saveMedicineDB(medicines: MedicineRef[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(medicines, null, 2), "utf8");
}

export async function addMedicine(med: MedicineRef): Promise<void> {
  const db = await getMedicineDB();
  // Avoid duplicate generics
  const existing = db.find(
    (m) => m.generic.toLowerCase() === med.generic.toLowerCase()
  );
  if (existing) {
    // Merge brands
    const newBrands = med.brands.filter(
      (b) => !existing.brands.some((eb) => eb.toLowerCase() === b.toLowerCase())
    );
    existing.brands.push(...newBrands);
    const newForms = med.forms.filter(
      (f) => !existing.forms.some((ef) => ef.toLowerCase() === f.toLowerCase())
    );
    existing.forms.push(...newForms);
    const newDosages = med.dosages.filter(
      (d) =>
        !existing.dosages.some((ed) => ed.toLowerCase() === d.toLowerCase())
    );
    existing.dosages.push(...newDosages);
  } else {
    db.push(med);
  }
  await saveMedicineDB(db);
}

export async function removeMedicine(generic: string): Promise<boolean> {
  const db = await getMedicineDB();
  const next = db.filter(
    (m) => m.generic.toLowerCase() !== generic.toLowerCase()
  );
  if (next.length === db.length) return false;
  await saveMedicineDB(next);
  return true;
}

export async function importMedicines(
  medicines: MedicineRef[],
  mode: "merge" | "replace"
): Promise<number> {
  if (mode === "replace") {
    await saveMedicineDB(medicines);
    return medicines.length;
  }
  // Merge
  const db = await getMedicineDB();
  let added = 0;
  for (const med of medicines) {
    const existing = db.find(
      (m) => m.generic.toLowerCase() === med.generic.toLowerCase()
    );
    if (existing) {
      med.brands.forEach((b) => {
        if (!existing.brands.some((eb) => eb.toLowerCase() === b.toLowerCase())) {
          existing.brands.push(b);
        }
      });
      med.forms.forEach((f) => {
        if (!existing.forms.some((ef) => ef.toLowerCase() === f.toLowerCase())) {
          existing.forms.push(f);
        }
      });
      med.dosages.forEach((d) => {
        if (
          !existing.dosages.some((ed) => ed.toLowerCase() === d.toLowerCase())
        ) {
          existing.dosages.push(d);
        }
      });
    } else {
      db.push(med);
      added++;
    }
  }
  await saveMedicineDB(db);
  return added;
}

/**
 * Fast prefix + substring search. Prefix matches rank higher.
 */
export function searchMedicineDB(
  db: MedicineRef[],
  query: string,
  limit = 15
): MedicineRef[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  const prefix: MedicineRef[] = [];
  const contains: MedicineRef[] = [];

  for (const m of db) {
    if (prefix.length + contains.length >= limit * 2) break;
    // Check generic
    const gl = m.generic.toLowerCase();
    if (gl.startsWith(q)) {
      prefix.push(m);
      continue;
    }
    if (gl.includes(q)) {
      contains.push(m);
      continue;
    }
    // Check brands
    let matched = false;
    for (const b of m.brands) {
      const bl = b.toLowerCase();
      if (bl.startsWith(q)) {
        prefix.push(m);
        matched = true;
        break;
      }
      if (bl.includes(q)) {
        contains.push(m);
        matched = true;
        break;
      }
    }
    if (matched) continue;
  }

  return [...prefix, ...contains].slice(0, limit);
}

/**
 * Parse a CSV string (generic,brand,form,dosage per line) into MedicineRef[].
 */
export function parseMedicineCSV(csv: string): MedicineRef[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  const result: MedicineRef[] = [];
  // Skip header if it looks like one
  const start = /^generic/i.test(lines[0] ?? "") ? 1 : 0;

  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 1 || !cols[0]) continue;
    const generic = cols[0];
    const brands = cols[1] ? cols[1].split("|").map((b) => b.trim()).filter(Boolean) : [];
    const forms = cols[2] ? cols[2].split("|").map((f) => f.trim()).filter(Boolean) : [];
    const dosages = cols[3] ? cols[3].split("|").map((d) => d.trim()).filter(Boolean) : [];
    result.push({ generic, brands, forms, dosages });
  }
  return result;
}

/**
 * Export medicine DB to CSV.
 */
export function exportMedicineCSV(db: MedicineRef[]): string {
  const header = "generic,brands,forms,dosages";
  const rows = db.map(
    (m) =>
      `"${m.generic}","${m.brands.join("|")}","${m.forms.join("|")}","${m.dosages.join("|")}"`
  );
  return [header, ...rows].join("\n");
}
