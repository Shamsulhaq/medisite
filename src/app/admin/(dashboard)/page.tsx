import Link from "next/link";
import { getPosts } from "@/lib/store";
import { getAppointments, filterAppointments } from "@/lib/appointments";
import { getPatients } from "@/lib/patients";
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
  const [posts, appointments, patients] = await Promise.all([
    getPosts(),
    getAppointments(),
    getPatients(),
  ]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = filterAppointments(appointments, "today").length;
  const upcomingCount = filterAppointments(appointments, "upcoming").length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const publishedCount = posts.filter((p) => p.published).length;

  const stats = [
    {
      label: "Today's Appointments",
      value: todayCount,
      icon: "calendar",
      tone: "text-sky-600 bg-sky-50",
      href: "/admin/appointments?filter=today",
    },
    {
      label: "Upcoming",
      value: upcomingCount,
      icon: "clock",
      tone: "text-brand bg-brand-light",
      href: "/admin/appointments?filter=upcoming",
    },
    {
      label: "Pending Requests",
      value: pendingCount,
      icon: "check",
      tone: "text-amber-600 bg-amber-50",
      href: "/admin/appointments",
    },
    {
      label: "Patients",
      value: patients.length,
      icon: "users",
      tone: "text-violet-600 bg-violet-50",
      href: "/admin/patients",
    },
  ];

  // Today's revenue from consultation payments
  const todaysRevenue = patients.reduce((sum, p) => {
    for (const con of p.consultations) {
      if (con.date === todayStr && con.payment) {
        sum += con.payment.received;
      }
    }
    return sum;
  }, 0);

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

  const recent = [...appointments]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  // Today's appointments (for new section)
  const todaysAppointments = appointments
    .filter((a) => a.date === todayStr)
    .sort((a, b) => (a.time < b.time ? -1 : 1));

  // Recent patients (by updatedAt)
  const recentPatients = [...patients]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 5);

  // Pending follow-ups
  const pendingFollowups: { id: string; name: string; patientId: string; lastVisitDate: string; followUp: string; daysOverdue: number }[] = [];
  const now = new Date();
  for (const p of patients) {
    if (p.consultations.length === 0) continue;
    const latest = p.consultations[0]; // already sorted newest-first
    if (!latest.followUp) continue;
    // Try to extract a date from the followUp text
    const dateMatch = latest.followUp.match(/(\d{4}-\d{2}-\d{2})/);
    let followUpDate: Date | null = null;
    if (dateMatch) {
      followUpDate = new Date(dateMatch[1]);
    } else {
      // Try relative durations like "৭ দিন পর", "After 7 days", "1 month পর", "After 1 month"
      const daysMatch = latest.followUp.match(/(\d+)\s*(দিন|days?)/i);
      const weeksMatch = latest.followUp.match(/(\d+)\s*(সপ্তাহ|weeks?)/i);
      const monthsMatch = latest.followUp.match(/(\d+)\s*(মাস|months?)/i);
      const visitDate = new Date(latest.date);
      if (daysMatch) {
        followUpDate = new Date(visitDate.getTime() + Number(daysMatch[1]) * 86400000);
      } else if (weeksMatch) {
        followUpDate = new Date(visitDate.getTime() + Number(weeksMatch[1]) * 7 * 86400000);
      } else if (monthsMatch) {
        followUpDate = new Date(visitDate);
        followUpDate.setMonth(followUpDate.getMonth() + Number(monthsMatch[1]));
      }
    }
    if (followUpDate && followUpDate < now) {
      const daysOverdue = Math.floor((now.getTime() - followUpDate.getTime()) / 86400000);
      pendingFollowups.push({
        id: p.id,
        name: p.name,
        patientId: p.patientId,
        lastVisitDate: latest.date,
        followUp: latest.followUp,
        daysOverdue,
      });
    }
  }
  pendingFollowups.sort((a, b) => b.daysOverdue - a.daysOverdue);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s what&apos;s happening across your site today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}
              >
                <AdminIcon name={s.icon} className="h-5 w-5" />
              </span>
              <AdminIcon
                name="chevronRight"
                className="h-4 w-4 text-slate-300 transition group-hover:text-brand"
              />
            </div>
            <p className="mt-4 text-3xl font-bold text-ink">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Today's Revenue */}
      <div className="mt-4 rounded-xl border border-green-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg text-green-600 bg-green-50">
            <AdminIcon name="check" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-ink">৳{todaysRevenue}</p>
            <p className="text-sm text-muted">Today&apos;s Revenue (received)</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent appointments */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-ink">Recent Appointments</h2>
              <Link
                href="/admin/appointments"
                className="text-sm font-medium text-brand hover:text-brand-dark"
              >
                View all
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">
                No appointment requests yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {a.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {a.date} · {a.time}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[a.status] ?? "slate"}>
                      {a.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-ink">Quick Actions</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {quickActions.map((q) => (
                <li key={q.href}>
                  <Link
                    href={q.href}
                    className="group flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-brand-light group-hover:text-brand-dark">
                      <AdminIcon name={q.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">
                        {q.label}
                      </span>
                      <span className="block text-xs text-muted">
                        {q.description}
                      </span>
                    </span>
                    <AdminIcon
                      name="chevronRight"
                      className="h-4 w-4 text-slate-300 group-hover:text-brand"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-ink">Content</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted">Published posts</span>
              <span className="font-semibold text-ink">{publishedCount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted">Draft posts</span>
              <span className="font-semibold text-ink">
                {posts.length - publishedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-ink">Today&apos;s Appointments</h2>
          <span className="text-sm text-muted">{todaysAppointments.length} total</span>
        </div>
        {todaysAppointments.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No appointments scheduled for today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-muted">
                <tr>
                  <th className="px-5 py-2">Patient</th>
                  <th className="px-5 py-2">Time</th>
                  <th className="px-5 py-2">Chamber</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {todaysAppointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-2.5">
                      <p className="font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-muted">{a.phone}</p>
                    </td>
                    <td className="px-5 py-2.5 text-muted">{a.time}</td>
                    <td className="px-5 py-2.5 text-muted">{a.location}</td>
                    <td className="px-5 py-2.5">
                      <Badge tone={STATUS_TONE[a.status] ?? "slate"}>{a.status}</Badge>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Link href={`/admin/appointments`} className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-dark">
                        Start Visit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Patients */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
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
                <Link href={`/admin/patients/${p.id}`} className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-slate-50">
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
      {pendingFollowups.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-100 px-5 py-4">
            <h2 className="font-semibold text-ink">Pending Follow-ups</h2>
            <span className="text-sm text-amber-600 font-medium">{pendingFollowups.length} overdue</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-amber-50/50 text-left text-xs font-semibold uppercase text-muted">
                <tr>
                  <th className="px-5 py-2">Patient</th>
                  <th className="px-5 py-2">Last Visit</th>
                  <th className="px-5 py-2">Follow-up</th>
                  <th className="px-5 py-2">Overdue</th>
                  <th className="px-5 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingFollowups.slice(0, 10).map((f) => (
                  <tr key={f.id} className="hover:bg-amber-50/30">
                    <td className="px-5 py-2.5">
                      <p className="font-medium text-ink">{f.name}</p>
                      <p className="text-xs text-muted">{f.patientId}</p>
                    </td>
                    <td className="px-5 py-2.5 text-muted">{f.lastVisitDate}</td>
                    <td className="px-5 py-2.5 text-muted">{f.followUp}</td>
                    <td className="px-5 py-2.5">
                      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        {f.daysOverdue} day{f.daysOverdue !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Link href={`/admin/patients/${f.id}`} className="text-xs font-medium text-brand hover:text-brand-dark">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
