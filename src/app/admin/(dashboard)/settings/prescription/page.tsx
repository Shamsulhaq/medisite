import { getSettings } from "@/lib/store";
import PrescriptionConfigForm from "@/components/admin/PrescriptionConfigForm";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Prescription Utilities",
  robots: { index: false, follow: false },
};

export default async function PrescriptionSettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="Prescription Utilities"
        description="Manage advices, diagnoses, investigations, timing rules, and prescription templates."
      />
      <PrescriptionConfigForm initial={settings} />
    </>
  );
}
