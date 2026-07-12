import { getSettings } from "@/lib/store";
import SettingsForm from "@/components/admin/SettingsForm";
import PrescriptionConfigForm from "@/components/admin/PrescriptionConfigForm";
import AppointmentSettingsForm from "@/components/admin/AppointmentSettingsForm";
import BlogSettingsForm from "@/components/admin/BlogSettingsForm";
import SettingsLayout from "@/components/admin/SettingsLayout";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active = tab === "prescription" ? "prescription" : tab === "appointment" ? "appointment" : tab === "blog" ? "blog" : "site";
  const settings = await getSettings();

  const sections = [
    { id: "site", label: "Site Settings", href: "/admin/settings" },
    { id: "prescription", label: "Prescription", href: "/admin/settings?tab=prescription" },
    { id: "appointment", label: "Appointments", href: "/admin/settings?tab=appointment" },
    { id: "blog", label: "Blog", href: "/admin/settings?tab=blog" },
  ];

  return (
    <SettingsLayout sections={sections} active={active}>
      {active === "site" && <SettingsForm initial={settings} />}
      {active === "prescription" && <PrescriptionConfigForm initial={settings} />}
      {active === "appointment" && <AppointmentSettingsForm initial={settings} />}
      {active === "blog" && <BlogSettingsForm initial={settings} />}
    </SettingsLayout>
  );
}
