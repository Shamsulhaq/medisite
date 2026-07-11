// -----------------------------------------------------------------------------
// Medicine database for prescription auto-suggestion. This is a seed list of
// common generics/brands in Bangladesh. The admin can extend it over time, but
// this gives instant autocomplete out of the box.
//
// Fields: generic (salt name), brands (common brand names), forms, dosages.
// -----------------------------------------------------------------------------

export type MedicineRef = {
  generic: string;
  brands: string[];
  forms: string[];
  dosages: string[];
  defaultAdvice?: string; // auto-added to prescription advices when this medicine is prescribed
};

export const MEDICINES: MedicineRef[] = [
  { generic: "Paracetamol", brands: ["Napa", "Ace", "Panacet", "Renova"], forms: ["Tablet", "Syrup", "Suppository"], dosages: ["500mg", "250mg", "120mg/5ml"] },
  { generic: "Amoxicillin", brands: ["Moxacil", "Amoxil", "Tycil"], forms: ["Capsule", "Suspension"], dosages: ["250mg", "500mg", "125mg/5ml"] },
  { generic: "Azithromycin", brands: ["Azith", "Zimax", "Zithrin"], forms: ["Tablet", "Capsule", "Suspension"], dosages: ["250mg", "500mg"] },
  { generic: "Ciprofloxacin", brands: ["Ciprocin", "Cipro-A", "Ciprox"], forms: ["Tablet"], dosages: ["250mg", "500mg"] },
  { generic: "Metformin", brands: ["Comet", "Glucomet", "Informet"], forms: ["Tablet"], dosages: ["500mg", "850mg", "1000mg"] },
  { generic: "Omeprazole", brands: ["Seclo", "Losectil", "Omenix"], forms: ["Capsule"], dosages: ["20mg", "40mg"] },
  { generic: "Esomeprazole", brands: ["Maxpro", "Nexium", "Sergel"], forms: ["Capsule", "MUPS Tablet"], dosages: ["20mg", "40mg"] },
  { generic: "Pantoprazole", brands: ["Pantonix", "Topraz", "Pantid"], forms: ["Tablet"], dosages: ["20mg", "40mg"] },
  { generic: "Amlodipine", brands: ["Amlopin", "Amdocal", "Norvasc"], forms: ["Tablet"], dosages: ["5mg", "10mg"] },
  { generic: "Losartan", brands: ["Losatan", "Angiazin", "Losar"], forms: ["Tablet"], dosages: ["25mg", "50mg", "100mg"] },
  { generic: "Atenolol", brands: ["Tenolol", "Atcard"], forms: ["Tablet"], dosages: ["25mg", "50mg", "100mg"] },
  { generic: "Clopidogrel", brands: ["Clopilet", "Plavix", "Clopid"], forms: ["Tablet"], dosages: ["75mg"] },
  { generic: "Aspirin", brands: ["Ecosprin", "Disprin", "Ascard"], forms: ["Tablet"], dosages: ["75mg", "150mg", "300mg"] },
  { generic: "Montelukast", brands: ["Monas", "Montec", "Airlukast"], forms: ["Tablet", "Chewable"], dosages: ["4mg", "5mg", "10mg"] },
  { generic: "Salbutamol", brands: ["Sultolin", "Ventolin", "Brodil"], forms: ["Inhaler", "Tablet", "Syrup"], dosages: ["100mcg/puff", "2mg", "4mg"] },
  { generic: "Ranitidine", brands: ["Neoceptin", "Rantac", "Ranidin"], forms: ["Tablet"], dosages: ["150mg", "300mg"] },
  { generic: "Metronidazole", brands: ["Flagyl", "Amodis", "Metril"], forms: ["Tablet", "Suspension", "IV"], dosages: ["200mg", "400mg"] },
  { generic: "Diclofenac", brands: ["Voltalin", "Clofenac", "Diclofen"], forms: ["Tablet", "Gel", "Suppository"], dosages: ["25mg", "50mg"] },
  { generic: "Cetirizine", brands: ["Alatrol", "Cetzin", "Rizin"], forms: ["Tablet", "Syrup"], dosages: ["5mg", "10mg"] },
  { generic: "Fexofenadine", brands: ["Fexo", "Telfast", "Fexomin"], forms: ["Tablet"], dosages: ["60mg", "120mg", "180mg"] },
  { generic: "Domperidone", brands: ["Motilium", "Omidon", "Domstal"], forms: ["Tablet", "Suspension"], dosages: ["10mg"] },
  { generic: "Calcium + Vitamin D", brands: ["Calbo-D", "Coralcal-D", "Ostoite-D"], forms: ["Tablet"], dosages: ["500mg+200IU"] },
  { generic: "Iron + Folic Acid", brands: ["Ferogen", "Feroven", "Ipec"], forms: ["Capsule", "Syrup"], dosages: [""] },
  { generic: "Levofloxacin", brands: ["Lebac", "Levocin", "Tavanic"], forms: ["Tablet"], dosages: ["250mg", "500mg", "750mg"] },
  { generic: "Doxycycline", brands: ["Doxicap", "Doxylin"], forms: ["Capsule"], dosages: ["100mg"] },
  { generic: "Flucloxacillin", brands: ["Fluclox", "Floxapen"], forms: ["Capsule", "Syrup"], dosages: ["250mg", "500mg"] },
  { generic: "Atorvastatin", brands: ["Atorva", "Lipitor", "Atocor"], forms: ["Tablet"], dosages: ["10mg", "20mg", "40mg"] },
  { generic: "Rosuvastatin", brands: ["Rosuva", "Crestor", "Rosulip"], forms: ["Tablet"], dosages: ["5mg", "10mg", "20mg"] },
  { generic: "Insulin (Mixed)", brands: ["Mixtard", "Insul-Mix"], forms: ["Injection"], dosages: ["30/70", "50/50"] },
  { generic: "Prednisolone", brands: ["Deltasone", "Pred"], forms: ["Tablet", "Syrup"], dosages: ["5mg", "10mg", "20mg"] },
];

export const FREQUENCIES = [
  "১+০+০ (সকালে)", "০+০+১ (রাতে)", "১+০+১ (সকাল-রাত)", "১+১+১ (তিনবার)", "১+১+১+১ (চারবার)",
  "1+0+0", "0+0+1", "1+0+1", "1+1+1", "1+1+1+1",
  "OD (Once daily)", "BD (Twice daily)", "TDS (Thrice daily)",
  "QDS (Four times)", "SOS (As needed / প্রয়োজনে)", "At bedtime / ঘুমানোর আগে",
];

export const DURATIONS = [
  "৩ দিন", "৫ দিন", "৭ দিন", "১০ দিন", "১৪ দিন",
  "২১ দিন", "১ মাস", "২ মাস", "৩ মাস", "৬ মাস",
  "চলবে / Continue", "পরবর্তী ভিজিট পর্যন্ত / Until next visit",
  "3 days", "5 days", "7 days", "10 days", "14 days",
  "21 days", "1 month", "2 months", "3 months", "6 months",
];

export const FORM_MAP: Record<string, string> = {
  "Tablet": "Tab.",
  "Capsule": "Cap.",
  "Syrup": "Syp.",
  "Suspension": "Susp.",
  "Drops": "Drop",
  "Inhaler": "Inh.",
  "Injection": "Inj.",
  "Cream": "Cr.",
  "Ointment": "Oint.",
  "Gel": "Gel",
  "Suppository": "Supp.",
  "Sachet": "Sac.",
  "Chewable": "Chew.",
  "MUPS Tablet": "MUPS",
  "IV": "IV",
  "Solution": "Soln.",
  "Powder": "Pwd.",
  "Lotion": "Lot.",
  "Nasal Spray": "N.Spray",
  "Eye Drop": "E.Drop",
  "Ear Drop": "Ear Dr.",
  "Tablet (Sustained Release)": "SR Tab.",
  "Tablet (Extended Release)": "ER Tab.",
};

export const FORMS = Object.keys(FORM_MAP);

/** Get the short abbreviation for a dosage form */
export function shortForm(form: string): string {
  return FORM_MAP[form] || form;
}

/**
 * Search medicines by generic or brand name. Returns up to `limit` matches.
 */
export function searchMedicines(query: string, limit = 10, extras: MedicineRef[] = []): MedicineRef[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: MedicineRef[] = [];
  const all = [...MEDICINES, ...extras];
  for (const m of all) {
    if (results.length >= limit) break;
    if (m.generic.toLowerCase().includes(q)) {
      results.push(m);
      continue;
    }
    if (m.brands.some((b) => b.toLowerCase().includes(q))) {
      results.push(m);
    }
  }
  return results;
}
