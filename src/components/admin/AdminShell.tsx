"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/admin/actions";
import AdminIcon from "@/components/admin/AdminIcon";
import TopProgressBar from "@/components/admin/TopProgressBar";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  permission?: string; // required permission key
  roleOnly?: string; // only show for this role
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "CLINIC",
    items: [
      { href: "/admin", label: "Dashboard", icon: "grid", exact: true },
      { href: "/admin/appointments", label: "Appointments", icon: "calendar" },
      { href: "/admin/patients", label: "Patient Records", icon: "users" },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { href: "/admin/posts", label: "Blog Posts", icon: "fileText", permission: "canManageBlog" },
      { href: "/admin/medicines", label: "Medicines", icon: "fileText", permission: "canManageMedicines" },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { href: "/admin/settings", label: "Settings", icon: "settings", permission: "canManageSettings" },
      { href: "/admin/reports", label: "Reports", icon: "grid", roleOnly: "DOCTOR" },
      { href: "/admin/users", label: "Users", icon: "users", roleOnly: "DOCTOR" },
      { href: "/admin/audit", label: "Audit Log", icon: "fileText", roleOnly: "DOCTOR" },
    ],
  },
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
  if (pathname.startsWith("/admin/reports")) return "Reports";
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/audit")) return "Audit Log";
  return "Admin";
}

type UserPermissions = Record<string, boolean>;

export default function AdminShell({
  username,
  userRole,
  permissions,
  children,
}: {
  username: string;
  userRole?: string;
  permissions?: UserPermissions;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sideOpen, setSideOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; phone: string; patientId: string }[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const title = pageTitle(pathname);
  const initials = username.slice(0, 2).toUpperCase();

  // Filter nav groups based on permissions
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.roleOnly && userRole !== item.roleOnly) return false;
      if (item.permission && permissions && !permissions[item.permission]) return false;
      return true;
    }),
  })).filter((group) => group.items.length > 0);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: Ctrl+K or / to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); setShowSearch(false); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/patients/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
        setShowSearch(true);
      } catch { setSearchResults([]); }
    }, 250);
  }

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
        className={`fixed inset-y-0 left-0 z-[70] flex flex-col bg-slate-900 shadow-2xl transition-all duration-300 ease-in-out lg:shadow-none lg:translate-x-0 ${
          sideOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
        } ${collapsed ? "lg:w-16" : "lg:w-64"}`}
      >
        {/* Brand */}
        <div className={`flex h-14 items-center border-b border-white/10 px-3 ${collapsed ? "lg:justify-center" : ""}`}>
          <div className={`flex items-center gap-2.5`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6a6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" />
              </svg>
            </span>
            <span className={`text-sm font-bold text-white ${collapsed ? "lg:hidden" : ""}`}>Admin</span>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[10px] uppercase tracking-wider text-slate-500 px-3 pt-3 pb-1">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setSideOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition active:scale-[0.98] ${
                      collapsed ? "lg:justify-center lg:px-0" : ""
                    } ${active ? "bg-brand text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
                    <AdminIcon name={item.icon} className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                    <span className={`${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden border-t border-white/10 px-2 py-2 lg:block">
          <button
            type="button"
            onClick={toggleCollapse}
            className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-slate-400 transition hover:bg-white/10 hover:text-white ${collapsed ? "" : "px-3"}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} aria-hidden="true">
              <path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" />
            </svg>
            <span className={`text-xs font-medium ${collapsed ? "lg:hidden" : ""}`}>{collapsed ? "" : "Collapse"}</span>
          </button>
        </div>

        {/* User section */}
        <div className="relative border-t border-white/10 p-2">
          {menuOpen && (
            <div className="absolute inset-x-2 bottom-full z-[80] mb-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
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
            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 active:bg-white/10 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand-light">{initials}</span>
            <span className={`flex-1 text-left text-sm font-medium text-white truncate ${collapsed ? "lg:hidden" : ""}`}>
              {username}
              {userRole && (
                <span className={`ml-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  userRole === "DOCTOR" ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"
                }`}>
                  {userRole}
                </span>
              )}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 text-slate-400 transition ${collapsed ? "lg:hidden" : ""} ${menuOpen ? "rotate-180" : ""}`} aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
        {/* Progress bar */}
        <TopProgressBar />
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
          {/* Global patient search */}
          <div ref={searchRef} className="relative ml-4 hidden flex-1 max-w-xs sm:block">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => { if (searchResults.length) setShowSearch(true); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults.length > 0) {
                    e.preventDefault();
                    router.push(`/admin/patients/${searchResults[0].id}`);
                    setShowSearch(false);
                    setSearchQuery("");
                  } else if (e.key === "Escape") {
                    setShowSearch(false);
                    searchInputRef.current?.blur();
                  }
                }}
                placeholder="Search patients..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 pr-16 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted">
                {typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent) ? "⌘K" : "Ctrl+K"}
              </span>
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className="absolute inset-x-0 top-full z-[100] mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      router.push(`/admin/patients/${p.id}`);
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                      <p className="truncate text-xs text-muted">{p.patientId} · {p.phone}</p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-400">
                  Press Enter to open first result
                </div>
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Mobile search button */}
            <button
              type="button"
              onClick={() => { setMobileSearchOpen(true); setTimeout(() => mobileSearchInputRef.current?.focus(), 100); }}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 active:bg-slate-100 sm:hidden"
              aria-label="Search"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" /></svg>
            </button>
            <Link href="/" target="_blank" className="hidden items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-muted hover:border-brand hover:text-brand sm:inline-flex">
              <AdminIcon name="external" className="h-3.5 w-3.5" /> Site
            </Link>
          </div>

          {/* Mobile search overlay */}
          {mobileSearchOpen && (
            <div className="absolute inset-x-0 top-0 z-[60] flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:hidden">
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults.length > 0) {
                    e.preventDefault();
                    router.push(`/admin/patients/${searchResults[0].id}`);
                    setShowSearch(false);
                    setSearchQuery("");
                    setMobileSearchOpen(false);
                  } else if (e.key === "Escape") {
                    setMobileSearchOpen(false);
                    setShowSearch(false);
                  }
                }}
                placeholder="Search patients..."
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
              />
              <button type="button" onClick={() => { setMobileSearchOpen(false); setShowSearch(false); }}
                className="rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:text-ink">
                Cancel
              </button>
              {showSearch && searchResults.length > 0 && (
                <div className="absolute inset-x-3 top-full z-[100] mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        router.push(`/admin/patients/${p.id}`);
                        setShowSearch(false);
                        setSearchQuery("");
                        setMobileSearchOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                        <p className="truncate text-xs text-muted">{p.patientId} · {p.phone}</p>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-400">
                    Press Enter to open first result
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-2 sm:p-3 lg:p-4">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
