import Link from "next/link";
import { getAppointmentCounts, getTodayAppointments } from "@/lib/appointments";
import {
  getPatientCount,
  getTodayRevenue,
  getRecentPatients,
  getRecentFollowUps,
  getDoctorVisitedTodayCount,
  getPatientsWithPendingVitalsCount,
  getPatientsByPhones,
} from "@/lib/patients";
import { getCurrentUser } from "@/lib/rbac";
import { todayInBD } from "@/lib/utils";
import AdminIcon from "@/components/admin/AdminIcon";
import { Badge } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

const STATUS_TONE: Record<string, string> = {
  pending: "amber",
  confirmed: "green",
  cancelled: "red",
};

export default async function DashboardHome() {
  const todayStr = todayInBD();

  // Fetch all dashboard data in parallel using efficient queries
  const [
    appointmentCounts,
    todaysAppointments,
    patientCount,
    todaysRevenue,
    recentPatients,
    pendingFollowups,
    doctorVisitedToday,
    patientsWithPendingVitals,
    currentUser,
  ] = await Promise.all([
    getAppointmentCounts(),
    getTodayAppointments(),
    getPatientCount(),
    getTodayRevenue(todayStr),
    getRecentPatients(5),
    getRecentFollowUps(8),
    getDoctorVisitedTodayCount(todayStr),
    getPatientsWithPendingVitalsCount(),
    getCurrentUser(),
  ]);

  const isDoctor = currentUser?.role === "DOCTOR";

  // Build a phone→patient map for linking appointments to patient records
  const appointmentPhones = todaysAppointments.map((a) => a.phone);
  const patientPhoneMap = await getPatientsByPhones(appointmentPhones);

  const stats = [
    {
      label: "Today's Appointments",
      value: appointmentCounts.today,
      icon: "calendar",
      tone: "text-sky-600 bg-sky-50",
      href: "/admin/appointments?range=today",
    },
    {
      label: "Upcoming",
      value: appointmentCounts.upcoming,
      icon: "clock",
      tone: "text-brand bg-brand-light",
      href: "/admin/appointments?range=upcoming",
    },
    {
      label: "Pending Requests",
      value: appointmentCounts.pending,
      icon: "check",
      tone: "text-amber-600 bg-amber-50",
      href: "/admin/appointments",
    },
    {
      label: "Patients",
      value: patientCount,
      icon: "users",
      tone: "text-violet-600 bg-violet-50",
      href: "/admin/patients",
    },
  ];

  const quickActions = [
    {
      label: "Write a new post",
      description: "Publish a bilingual article",
      icon: "fileText",
      href: "/admin/posts/new",
    },
    {
      label: "Add a patient",
      description: "Record history & prescriptions",
      icon: "users",
      href: "/admin/patients",
    },
    {
      label: "View Reports",
      description: "Analytics & charts",
      icon: "grid",
      href: "/admin/reports",
    },
    {
      label: "Edit site content",
      description: "Branding, text & translations",
      icon: "settings",
      href: "/admin/settings",
    },
  ];

  // Attendant-specific counts
  const confirmedToday = todaysAppointments.filter((a) => a.status === "confirmed").length;
  const pendingToday = todaysAppointments.filter((a) => a.status === "pending").length;

  if (!isDoctor) {
    // ATTENDANT DASHBOARD
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Today&apos;s appointment overview</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <AdminIcon name="calendar" className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-ink">{todaysAppointments.length}</p>
            <p className="mt-1 text-sm text-muted">Total Appointments Today</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <AdminIcon name="check" className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-ink">{confirmedToday}</p>
            <p className="mt-1 text-sm text-muted">Confirmed</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <AdminIcon name="clock" className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-ink">{pendingToday}</p>
            <p className="mt-1 text-sm text-muted">Pending</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                <AdminIcon name="users" className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-ink">{doctorVisitedToday}</p>
            <p className="mt-1 text-sm text-muted">Doctor Visited Today</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Today's appointment list */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-ink">Today&apos;s Appointments</h2>
              <Link href="/admin/appointments" className="text-sm font-medium text-brand hover:text-brand-dark">View all</Link>
            </div>
            {todaysAppointments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">No appointments today.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {todaysAppointments.slice(0, 10).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-muted">{a.time} · {a.location || a.mode}</p>
                    </div>
                    <Badge tone={STATUS_TONE[a.status] ?? "slate"}>{a.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick stats */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-ink">Status</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Patients with vitals recorded</span>
                  <span className="font-semibold text-ink">{patientsWithPendingVitals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Doctor visited today</span>
                  <span className="font-semibold text-ink">{doctorVisitedToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Remaining</span>
                  <span className="font-semibold text-ink">{todaysAppointments.length - doctorVisitedToday}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-ink">Quick Actions</h2>
              <div className="mt-3 space-y-2">
                <Link href="/admin/appointments" className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand">
                  <AdminIcon name="calendar" className="h-4 w-4" /> Manage Appointments
                </Link>
                <Link href="/admin/patients" className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand">
                  <AdminIcon name="users" className="h-4 w-4" /> View Patients
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DOCTOR DASHBOARD (Today's Workflow)
  const nextPatient = todaysAppointments.find(
    (a) => a.status === "pending" || a.status === "confirmed"
  );
  // Look up patient record for the next appointment via the phone map
  const nextPatientRecord = nextPatient
    ? patientPhoneMap.get(nextPatient.phone.replace(/[\s\-()]/g, ""))
    : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Today&apos;s Workflow
        </h1>
        <p className="mt-1 text-sm text-muted">
          {todayStr} · {todaysAppointments.length} appointments scheduled
        </p>
      </div>

      {/* Next Patient Card */}
      {nextPatient ? (
        <div className="rounded-xl border-2 border-brand/30 bg-gradient-to-r from-brand-light/30 to-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">Next Patient</p>
              <h2 className="mt-1 text-xl font-bold text-ink">{nextPatient.name}</h2>
              <p className="mt-0.5 text-sm text-muted">
                {nextPatient.time} · {nextPatient.phone} · <Badge tone={STATUS_TONE[nextPatient.status] ?? "slate"}>{nextPatient.status}</Badge>
              </p>
            </div>
            {nextPatientRecord ? (
              <Link
                href={`/admin/patients/${nextPatientRecord.id}`}
                className="shrink-0 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-dark hover:shadow-lg"
              >
                See Patient →
              </Link>
            ) : (
              <Link
                href="/admin/patients/new"
                className="shrink-0 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-dark hover:shadow-lg"
              >
                Add Patient →
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-muted">No pending patients remaining for today.</p>
        </div>
      )}

      {/* Today's Queue */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-ink">Today&apos;s Queue</h2>
          <Link href="/admin/appointments?filter=today" className="text-sm font-medium text-brand hover:text-brand-dark">
            View all →
          </Link>
        </div>
        {todaysAppointments.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No appointments scheduled for today.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {todaysAppointments.map((a) => {
              const patientRecord = patientPhoneMap.get(
                a.phone.replace(/[\s\-()]/g, "")
              );
              return (
                <li key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="w-14 shrink-0 text-xs font-medium text-muted">{a.time}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{a.name}</span>
                  <Badge tone={STATUS_TONE[a.status] ?? "slate"}>{a.status}</Badge>
                  {a.status === "pending" && patientRecord && (
                    <Link href={`/admin/patients/${patientRecord.id}`} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
                      Start Visit
                    </Link>
                  )}
                  {a.status === "confirmed" && patientRecord && (
                    <Link href={`/admin/patients/${patientRecord.id}`} className="shrink-0 rounded-lg border border-brand bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-light">
                      Open
                    </Link>
                  )}
                  {a.status === "pending" && !patientRecord && (
                    <Link href="/admin/patients/new" className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-200">
                      Add Patient
                    </Link>
                  )}
                  {a.status === "confirmed" && !patientRecord && (
                    <Link href="/admin/patients/new" className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-200">
                      Add Patient
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Stats Row (smaller) */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.tone}`}>
                <AdminIcon name={s.icon} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xl font-bold text-ink">{s.value}</p>
                <p className="text-xs text-muted">{s.label}</p>
              </div>
            </div>
          </Link>
        ))}
        <div className="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-green-600 bg-green-50">
              <AdminIcon name="check" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xl font-bold text-ink">৳{todaysRevenue}</p>
              <p className="text-xs text-muted">Today&apos;s Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary: Recent Patients & Follow-ups */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Patients */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-ink">Recent Patients</h2>
            <Link href="/admin/patients" className="text-sm font-medium text-brand hover:text-brand-dark">View all</Link>
          </div>
          {recentPatients.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">No patients yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPatients.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/patients/${p.id}`} className="flex items-center justify-between gap-4 px-5 py-2.5 transition hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                      <p className="truncate text-xs text-muted">{p.patientId} · {p.phone}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{new Date(p.updatedAt).toLocaleDateString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending Follow-ups */}
        {pendingFollowups.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-100 px-5 py-4">
              <h2 className="font-semibold text-ink">Pending Follow-ups</h2>
              <span className="text-sm text-amber-600 font-medium">{pendingFollowups.length} overdue</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {pendingFollowups.slice(0, 8).map((f) => (
                <li key={f.id}>
                  <Link href={`/admin/patients/${f.id}`} className="flex items-center justify-between gap-3 px-5 py-2.5 transition hover:bg-amber-50/30">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                      <p className="truncate text-xs text-muted">{f.patientId} · Last: {f.lastVisitDate}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {f.daysOverdue}d overdue
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-ink">Quick Actions</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {quickActions.map((q) => (
                <li key={q.href}>
                  <Link href={q.href} className="group flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-brand-light group-hover:text-brand-dark">
                      <AdminIcon name={q.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{q.label}</span>
                      <span className="block text-xs text-muted">{q.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
