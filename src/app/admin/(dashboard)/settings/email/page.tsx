import { getSettings } from "@/lib/store";
import EmailSettingsForm from "@/components/admin/EmailSettingsForm";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Email Settings",
  robots: { index: false, follow: false },
};

export default async function EmailSettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="Email Settings"
        description="Configure SMTP for outgoing emails (prescriptions, notifications)."
      />
      <EmailSettingsForm initial={settings} />
    </>
  );
}
