import {
  getAppointmentsPage,
  getAppointmentsForExport,
  type AppointmentRange,
  type AppointmentsQuery,
} from "@/lib/appointments";
import { getSettings } from "@/lib/store";
import { getCurrentUser } from "@/lib/rbac";
import AppointmentsExplorer from "@/components/admin/AppointmentsExplorer";
import NewAppointmentModal from "@/components/admin/NewAppointmentModal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Appointments",
  robots: { index: false, follow: false },
};

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) ?? "";

  const query: AppointmentsQuery = {
    page: Number(str(sp.page)) || 1,
    q: str(sp.q),
    // Default view is "today". Also accept the legacy `filter` param (used by
    // the dashboard stat cards) as an alias for `range`.
    range: (str(sp.range) || str(sp.filter) || "today") as AppointmentRange,
    from: str(sp.from),
    to: str(sp.to),
    type: (str(sp.type) || "all") as "all" | "online" | "offline",
    chamber: str(sp.chamber) || "all",
  };

  const [result, settings, currentUser] = await Promise.all([
    getAppointmentsPage(query),
    getSettings(),
    getCurrentUser(),
  ]);
  const chamberNames = settings.appointment.chambers.map((c) => c.name);
  const defaultAvailability = settings.appointment.chambers[0]?.availability;

  // Server action: fetch ALL rows matching the current filters so CSV/Excel/PDF
  // exports include every match, not just the visible page.
  async function exportAppointments(filters: AppointmentsQuery) {
    "use server";
    return getAppointmentsForExport(filters);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {result.total} request{result.total === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <NewAppointmentModal appointment={settings.appointment} />
        </div>
      </div>
      <AppointmentsExplorer
        appointments={result.items}
        chambers={chamberNames}
        availability={defaultAvailability}
        appointment={settings.appointment}
        userId={currentUser?.id}
        userName={currentUser?.displayName || currentUser?.username}
        isDoctor={currentUser?.role === "DOCTOR"}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        totalPages={result.totalPages}
        filters={{
          q: query.q ?? "",
          range: query.range ?? "today",
          from: query.from ?? "",
          to: query.to ?? "",
          type: query.type ?? "all",
          chamber: query.chamber ?? "all",
        }}
        exportAppointments={exportAppointments}
      />
    </div>
  );
}
