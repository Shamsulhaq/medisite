import Link from "next/link";
import { getAppointments } from "@/lib/appointments";
import { getSettings } from "@/lib/store";
import AppointmentsExplorer from "@/components/admin/AppointmentsExplorer";
import AdminIcon from "@/components/admin/AdminIcon";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Appointments",
  robots: { index: false, follow: false },
};

export default async function AdminAppointmentsPage() {
  const [appointments, settings] = await Promise.all([
    getAppointments(),
    getSettings(),
  ]);
  const chamberNames = settings.appointment.chambers.map((c) => c.name);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{appointments.length} total request{appointments.length === 1 ? "" : "s"}</p>
        <Link href="/admin/appointments/settings"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand">
          <AdminIcon name="settings" className="h-4 w-4" /> Configuration
        </Link>
      </div>
      <AppointmentsExplorer appointments={appointments} chambers={chamberNames} />
    </div>
  );
}
