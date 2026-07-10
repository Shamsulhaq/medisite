// -----------------------------------------------------------------------------
// Auto-learn: saves new medicines from prescriptions directly to the main DB.
// This replaces the old separate custom-medicines.json approach.
// -----------------------------------------------------------------------------

import { addMedicine } from "./medicine-db";
import type { MedicineRef } from "./medicines";

export async function addCustomMedicine(med: {
  name: string;
  generic: string;
  form: string;
  dosage: string;
}): Promise<void> {
  const entry: MedicineRef = {
    generic: med.generic || med.name,
    brands: med.generic && med.generic !== med.name ? [med.name] : [],
    forms: med.form ? [med.form] : [],
    dosages: med.dosage ? [med.dosage] : [],
  };
  await addMedicine(entry);
}

// Re-export for backward compatibility
export { getMedicineDB as getCustomMedicines } from "./medicine-db";
