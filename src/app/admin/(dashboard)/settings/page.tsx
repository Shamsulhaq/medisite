import Link from "next/link";
import { getSettings } from "@/lib/store";
import SettingsForm from "@/components/admin/SettingsForm";
import PrescriptionConfigForm from "@/components/admin/PrescriptionConfigForm";
import AppointmentSettingsForm from "@/components/admin/AppointmentSettingsForm";
import BlogSettingsForm from "@/components/admin/BlogSettingsForm";

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

  const tabs = [
    { id: "site", label: "Site Settings", href: "/admin/settings" },
    { id: "prescription", label: "Prescription", href: "/admin/settings?tab=prescription" },
    { id: "appointment", label: "Appointments", href: "/admin/settings?tab=appointment" },
    { id: "blog", label: "Blog", href: "/admin/settings?tab=blog" },
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div className="mb-5 inline-flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <Link key={t.id} href={t.href}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              active === t.id ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-slate-50 hover:text-ink"
            }`}>
            {t.label}
          </Link>
        ))}
      </div>

      {active === "site" && <SettingsForm initial={settings} />}
      {active === "prescription" && <PrescriptionConfigForm initial={settings} />}
      {active === "appointment" && <AppointmentSettingsForm initial={settings} />}
      {active === "blog" && <BlogSettingsForm initial={settings} />}
    </div>
  );
}
