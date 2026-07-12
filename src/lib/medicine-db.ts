// -----------------------------------------------------------------------------
// Medicine database — backed by PostgreSQL via Prisma.
// Supports CRUD, JSON/CSV import/export, and fast prefix search.
// Maintains the same external API as the previous JSON-file-based version.
// -----------------------------------------------------------------------------

import prisma from "@/lib/db";
import type { MedicineRef } from "./medicines";
import { MEDICINES as BUILT_IN } from "./medicines";

// ---- Helpers ---------------------------------------------------------------

function dbRowToRef(row: {
  generic: string;
  brands: string[];
  forms: string[];
  dosages: string[];
  defaultAdvice: string;
}): MedicineRef {
  return {
    generic: row.generic,
    brands: row.brands,
    forms: row.forms,
    dosages: row.dosages,
    defaultAdvice: row.defaultAdvice || undefined,
  };
}

// ---- Public API ------------------------------------------------------------

export async function getMedicineDB(): Promise<MedicineRef[]> {
  const count = await prisma.medicine.count();
  if (count === 0) {
    // Seed from built-in database on first run
    for (const med of BUILT_IN) {
      await prisma.medicine.create({
        data: {
          generic: med.generic,
          brands: med.brands,
          forms: med.forms,
          dosages: med.dosages,
          defaultAdvice: med.defaultAdvice ?? "",
        },
      });
    }
    return [...BUILT_IN];
  }
  const rows = await prisma.medicine.findMany({ orderBy: { generic: "asc" } });
  return rows.map(dbRowToRef);
}

export async function saveMedicineDB(medicines: MedicineRef[]): Promise<void> {
  // Replace entire medicine DB — transaction for consistency
  await prisma.$transaction(async (tx) => {
    await tx.medicine.deleteMany();
    for (const med of medicines) {
      await tx.medicine.create({
        data: {
          generic: med.generic,
          brands: med.brands,
          forms: med.forms,
          dosages: med.dosages,
          defaultAdvice: med.defaultAdvice ?? "",
        },
      });
    }
  });
}

export async function addMedicine(med: MedicineRef): Promise<void> {
  const existing = await prisma.medicine.findFirst({
    where: { generic: { equals: med.generic, mode: "insensitive" } },
  });

  if (existing) {
    // Merge brands, forms, dosages
    const newBrands = med.brands.filter(
      (b) => !existing.brands.some((eb) => eb.toLowerCase() === b.toLowerCase())
    );
    const newForms = med.forms.filter(
      (f) => !existing.forms.some((ef) => ef.toLowerCase() === f.toLowerCase())
    );
    const newDosages = med.dosages.filter(
      (d) => !existing.dosages.some((ed) => ed.toLowerCase() === d.toLowerCase())
    );
    await prisma.medicine.update({
      where: { id: existing.id },
      data: {
        brands: [...existing.brands, ...newBrands],
        forms: [...existing.forms, ...newForms],
        dosages: [...existing.dosages, ...newDosages],
      },
    });
  } else {
    await prisma.medicine.create({
      data: {
        generic: med.generic,
        brands: med.brands,
        forms: med.forms,
        dosages: med.dosages,
        defaultAdvice: med.defaultAdvice ?? "",
      },
    });
  }
}

export async function removeMedicine(generic: string): Promise<boolean> {
  const existing = await prisma.medicine.findFirst({
    where: { generic: { equals: generic, mode: "insensitive" } },
  });
  if (!existing) return false;
  await prisma.medicine.delete({ where: { id: existing.id } });
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

  // Merge mode
  let added = 0;
  for (const med of medicines) {
    const existing = await prisma.medicine.findFirst({
      where: { generic: { equals: med.generic, mode: "insensitive" } },
    });
    if (existing) {
      const newBrands = med.brands.filter(
        (b) => !existing.brands.some((eb) => eb.toLowerCase() === b.toLowerCase())
      );
      const newForms = med.forms.filter(
        (f) => !existing.forms.some((ef) => ef.toLowerCase() === f.toLowerCase())
      );
      const newDosages = med.dosages.filter(
        (d) => !existing.dosages.some((ed) => ed.toLowerCase() === d.toLowerCase())
      );
      if (newBrands.length || newForms.length || newDosages.length) {
        await prisma.medicine.update({
          where: { id: existing.id },
          data: {
            brands: [...existing.brands, ...newBrands],
            forms: [...existing.forms, ...newForms],
            dosages: [...existing.dosages, ...newDosages],
          },
        });
      }
    } else {
      await prisma.medicine.create({
        data: {
          generic: med.generic,
          brands: med.brands,
          forms: med.forms,
          dosages: med.dosages,
          defaultAdvice: med.defaultAdvice ?? "",
        },
      });
      added++;
    }
  }
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
    const gl = m.generic.toLowerCase();
    if (gl.startsWith(q)) {
      prefix.push(m);
      continue;
    }
    if (gl.includes(q)) {
      contains.push(m);
      continue;
    }
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
