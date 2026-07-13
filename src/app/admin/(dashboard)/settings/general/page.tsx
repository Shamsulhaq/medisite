import { getSettings } from "@/lib/store";
import GeneralSettingsForm from "@/components/admin/GeneralSettingsForm";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "General Settings",
  robots: { index: false, follow: false },
};

export default async function GeneralSettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="General Settings"
        description="Site metadata, branding, doctor profile, contact info, and social links."
      />
      <GeneralSettingsForm initial={settings} />
    </>
  );
}
