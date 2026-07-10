import Link from "next/link";
import { getSettings } from "@/lib/store";
import { PageHeader } from "@/components/admin/ui";
import AdminIcon from "@/components/admin/AdminIcon";
import AppointmentSettingsForm from "@/components/admin/AppointmentSettingsForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Appointment Settings",
  robots: { index: false, follow: false },
};

export default async function AppointmentSettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <Link
        href="/admin/appointments"
        className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
      >
        ← Back to appointments
      </Link>
      <PageHeader
        title="Appointment Configuration"
        description="Booking availability, chambers, and online consultation."
        action={
          <Link
            href="/admin/appointments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            <AdminIcon name="calendar" className="h-4 w-4" />
            View Requests
          </Link>
        }
      />
      <AppointmentSettingsForm initial={settings} />
    </div>
  );
}
