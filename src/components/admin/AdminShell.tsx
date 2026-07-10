"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/admin/actions";
import AdminIcon from "@/components/admin/AdminIcon";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "grid", exact: true },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
  { href: "/admin/medicines", label: "Medicines", icon: "fileText" },
  { href: "/admin/posts", label: "Blog Posts", icon: "fileText" },
  { href: "/admin/appointments", label: "Appointments", icon: "calendar" },
  { href: "/admin/patients", label: "Patient Records", icon: "users" },
];

function pageTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  if (pathname.startsWith("/admin/medicines")) return "Medicines";
  if (pathname.startsWith("/admin/account")) return "Account";
  if (pathname === "/admin/posts/new") return "New Post";
  if (pathname.startsWith("/admin/posts/") && pathname !== "/admin/posts") return "Edit Post";
  if (pathname.startsWith("/admin/posts")) return "Blog Posts";
  if (pathname.startsWith("/admin/appointments/settings")) return "Appointment Config";
  if (pathname.startsWith("/admin/appointments")) return "Appointments";
  if (pathname.startsWith("/admin/patients/new")) return "Add Patient";
  if (pathname.startsWith("/admin/patients/") && pathname !== "/admin/patients") return "Patient";
  if (pathname.startsWith("/admin/patients")) return "Patients";
  return "Admin";
}

export default function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const title = pageTitle(pathname);
  const initials = username.slice(0, 2).toUpperCase();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="relative flex min-h-[100dvh] w-full overflow-x-hidden bg-slate-50">
      {/* Sidebar backdrop (mobile) */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setSideOpen(false)}
          onTouchStart={() => setSideOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-64 flex-col bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out lg:shadow-none lg:translate-x-0 ${
          sideOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand + close on mobile */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6a6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" />
              </svg>
            </span>
            <span className="text-sm font-bold text-white">Admin</span>
          </div>
          <button
            type="button"
            onClick={() => setSideOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <AdminIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSideOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition active:scale-[0.98] ${
                  active ? "bg-brand text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}>
                <AdminIcon name={item.icon} className={`h-5 w-5 ${active ? "text-white" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="relative border-t border-white/10 p-3">
          {menuOpen && (
            <div className="absolute inset-x-3 bottom-full z-[80] mb-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
              <Link href="/admin/account" onClick={() => { setMenuOpen(false); setSideOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 active:bg-white/10">
                <AdminIcon name="settings" className="h-4 w-4 text-slate-400" /> Account
              </Link>
              <Link href="/" target="_blank" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 active:bg-white/10">
                <AdminIcon name="external" className="h-4 w-4 text-slate-400" /> View Site
              </Link>
              <form action={logoutAction} className="border-t border-slate-700">
                <button type="submit" className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 active:bg-white/10">
                  <AdminIcon name="logout" className="h-4 w-4 text-slate-400" /> Sign Out
                </button>
              </form>
            </div>
          )}
          <button type="button" onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 active:bg-white/10">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand-light">{initials}</span>
            <span className="flex-1 text-left text-sm font-medium text-white truncate">{username}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 text-slate-400 transition ${menuOpen ? "rotate-180" : ""}`} aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-[50] flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
          <button
            type="button"
            onClick={() => setSideOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 active:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <AdminIcon name="menu" className="h-6 w-6" />
          </button>
          <h1 className="text-base font-semibold text-ink sm:text-lg">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" target="_blank" className="hidden items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-muted hover:border-brand hover:text-brand sm:inline-flex">
              <AdminIcon name="external" className="h-3.5 w-3.5" /> Site
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
