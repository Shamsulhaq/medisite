import { getMedicineDB } from "@/lib/medicine-db";
import MedicineManager from "@/components/admin/MedicineManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Medicines",
  robots: { index: false, follow: false },
};

export default async function MedicinesPage() {
  const db = await getMedicineDB();
  return <MedicineManager initialCount={db.length} />;
}
