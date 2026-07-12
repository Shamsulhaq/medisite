// -----------------------------------------------------------------------------
// Investigations database — stored in PostgreSQL via Prisma.
// Provides autocomplete for test/investigation ordering in consultations.
// -----------------------------------------------------------------------------

import prisma from "@/lib/db";

export type InvestigationRef = {
  id?: string;
  name: string;
  category: string;
  aliases: string[];
};

// Common investigations seed data
const SEED_INVESTIGATIONS: InvestigationRef[] = [
  // Blood tests
  { name: "CBC (Complete Blood Count)", category: "Blood", aliases: ["CBC", "FBC", "Full Blood Count"] },
  { name: "ESR", category: "Blood", aliases: ["Erythrocyte Sedimentation Rate"] },
  { name: "RBS (Random Blood Sugar)", category: "Blood", aliases: ["RBS", "Blood Sugar", "Glucose"] },
  { name: "FBS (Fasting Blood Sugar)", category: "Blood", aliases: ["FBS", "Fasting Glucose"] },
  { name: "HbA1c", category: "Blood", aliases: ["Glycated Hemoglobin", "A1C"] },
  { name: "Lipid Profile", category: "Blood", aliases: ["Cholesterol", "Triglycerides", "HDL", "LDL"] },
  { name: "Liver Function Test (LFT)", category: "Blood", aliases: ["LFT", "SGPT", "SGOT", "Bilirubin"] },
  { name: "Renal Function Test (RFT)", category: "Blood", aliases: ["RFT", "Creatinine", "BUN", "Urea"] },
  { name: "Serum Creatinine", category: "Blood", aliases: ["S. Creatinine", "Creatinine"] },
  { name: "Serum Electrolytes", category: "Blood", aliases: ["Na+", "K+", "Cl-", "Electrolytes"] },
  { name: "Serum Uric Acid", category: "Blood", aliases: ["Uric Acid"] },
  { name: "Thyroid Function Test (TFT)", category: "Blood", aliases: ["TFT", "TSH", "T3", "T4", "FT4"] },
  { name: "TSH", category: "Blood", aliases: ["Thyroid Stimulating Hormone"] },
  { name: "Prothrombin Time (PT)", category: "Blood", aliases: ["PT", "INR"] },
  { name: "D-Dimer", category: "Blood", aliases: [] },
  { name: "CRP (C-Reactive Protein)", category: "Blood", aliases: ["CRP"] },
  { name: "Blood Grouping & Rh Typing", category: "Blood", aliases: ["Blood Group"] },
  { name: "Serum Iron & TIBC", category: "Blood", aliases: ["Iron Profile", "Ferritin"] },
  { name: "Serum Ferritin", category: "Blood", aliases: ["Ferritin"] },
  { name: "Vitamin D (25-OH)", category: "Blood", aliases: ["Vit D", "25-Hydroxy Vitamin D"] },
  { name: "Vitamin B12", category: "Blood", aliases: ["Vit B12", "Cobalamin"] },
  { name: "HBsAg", category: "Blood", aliases: ["Hepatitis B Surface Antigen"] },
  { name: "Anti-HCV", category: "Blood", aliases: ["Hepatitis C Antibody"] },
  { name: "Widal Test", category: "Blood", aliases: ["Typhoid Test"] },
  { name: "Blood Culture & Sensitivity", category: "Blood", aliases: ["Blood C/S"] },
  { name: "Peripheral Blood Film (PBF)", category: "Blood", aliases: ["PBF", "Blood Smear"] },
  // Urine tests
  { name: "Urine R/M/E", category: "Urine", aliases: ["Urine Routine", "Urinalysis", "Urine R/E"] },
  { name: "Urine Culture & Sensitivity", category: "Urine", aliases: ["Urine C/S"] },
  { name: "24-Hour Urine Protein", category: "Urine", aliases: ["24hr Protein"] },
  { name: "Urine for Microalbumin", category: "Urine", aliases: ["Microalbumin", "ACR"] },
  // Stool
  { name: "Stool R/M/E", category: "Stool", aliases: ["Stool Routine", "Stool R/E"] },
  { name: "Stool for OBT", category: "Stool", aliases: ["Occult Blood Test", "OBT"] },
  // Imaging
  { name: "X-ray Chest (PA view)", category: "Imaging", aliases: ["CXR", "Chest X-ray"] },
  { name: "X-ray Cervical Spine", category: "Imaging", aliases: ["C-Spine X-ray"] },
  { name: "X-ray Lumbar Spine", category: "Imaging", aliases: ["L-Spine X-ray"] },
  { name: "X-ray KUB", category: "Imaging", aliases: ["KUB"] },
  { name: "USG of Whole Abdomen", category: "Imaging", aliases: ["USG Abdomen", "Abdominal Ultrasound"] },
  { name: "USG of Lower Abdomen", category: "Imaging", aliases: ["Pelvic USG"] },
  { name: "USG of Thyroid", category: "Imaging", aliases: ["Thyroid Ultrasound"] },
  { name: "Echocardiogram", category: "Cardiac", aliases: ["Echo", "2D Echo"] },
  { name: "ECG", category: "Cardiac", aliases: ["Electrocardiogram", "EKG"] },
  { name: "CT Scan Brain", category: "Imaging", aliases: ["CT Head"] },
  { name: "CT Scan Chest", category: "Imaging", aliases: ["HRCT Chest"] },
  { name: "MRI Brain", category: "Imaging", aliases: ["Brain MRI"] },
  { name: "MRI Spine", category: "Imaging", aliases: ["Spine MRI"] },
  // Pulmonary
  { name: "PFT (Pulmonary Function Test)", category: "Pulmonary", aliases: ["PFT", "Spirometry"] },
  { name: "Peak Flow Meter", category: "Pulmonary", aliases: ["PEFR"] },
  // Special
  { name: "Endoscopy (Upper GI)", category: "Special", aliases: ["OGD", "Gastroscopy"] },
  { name: "Colonoscopy", category: "Special", aliases: [] },
  { name: "FNAC", category: "Special", aliases: ["Fine Needle Aspiration Cytology"] },
  { name: "Biopsy", category: "Special", aliases: [] },
  { name: "Skin Prick Test", category: "Special", aliases: ["Allergy Test"] },
  { name: "Sputum for AFB", category: "Special", aliases: ["AFB Stain", "TB Test"] },
  { name: "Mantoux Test", category: "Special", aliases: ["TB Skin Test", "TST"] },
  { name: "ANA (Antinuclear Antibody)", category: "Special", aliases: ["ANA"] },
  { name: "RA Factor", category: "Blood", aliases: ["Rheumatoid Factor", "RF"] },
];

export async function getInvestigations(): Promise<InvestigationRef[]> {
  const count = await prisma.investigation.count();
  if (count === 0) {
    // Seed on first run
    for (const inv of SEED_INVESTIGATIONS) {
      await prisma.investigation.create({
        data: { name: inv.name, category: inv.category, aliases: inv.aliases },
      });
    }
    return SEED_INVESTIGATIONS;
  }
  const rows = await prisma.investigation.findMany({ orderBy: { name: "asc" } });
  return rows.map((r) => ({ id: r.id, name: r.name, category: r.category, aliases: r.aliases }));
}

export async function searchInvestigations(query: string, limit = 10): Promise<InvestigationRef[]> {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  const all = await getInvestigations();
  const prefix: InvestigationRef[] = [];
  const contains: InvestigationRef[] = [];

  for (const inv of all) {
    if (prefix.length + contains.length >= limit) break;
    const nl = inv.name.toLowerCase();
    if (nl.startsWith(q)) { prefix.push(inv); continue; }
    if (nl.includes(q)) { contains.push(inv); continue; }
    // Check aliases
    if (inv.aliases.some((a) => a.toLowerCase().startsWith(q) || a.toLowerCase().includes(q))) {
      contains.push(inv);
    }
  }
  return [...prefix, ...contains].slice(0, limit);
}

export async function addInvestigation(inv: { name: string; category: string; aliases?: string[] }): Promise<void> {
  const existing = await prisma.investigation.findFirst({
    where: { name: { equals: inv.name, mode: "insensitive" } },
  });
  if (existing) return; // don't duplicate
  await prisma.investigation.create({
    data: { name: inv.name, category: inv.category || "", aliases: inv.aliases || [] },
  });
}
