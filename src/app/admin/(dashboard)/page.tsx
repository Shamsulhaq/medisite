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
      label: "Edit site content",
      description: "Branding, text & translations",
      icon: "settings",
      href: "/admin/settings",
    },
  ];

  const recent = [...appointments]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

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
    </div>
  );
}
