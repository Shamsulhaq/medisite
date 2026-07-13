import { getSettings } from "@/lib/store";
import PaymentSettingsForm from "@/components/admin/PaymentSettingsForm";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payment Settings",
  robots: { index: false, follow: false },
};

export default async function PaymentSettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="Payment Settings"
        description="Consultation fee structure based on visit frequency."
      />
      <PaymentSettingsForm initial={settings} />
    </>
  );
}
