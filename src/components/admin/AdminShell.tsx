"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/admin/actions";
import AdminIcon from "@/components/admin/AdminIcon";
import TopProgressBar from "@/components/admin/TopProgressBar";

type NavChild = {
  href: string;
  label: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  permission?: string; // required permission key
  roleOnly?: string; // only show for this role
  children?: NavChild[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "DASHBOARD",
    items: [
      { href: "/admin", label: "Dashboard", icon: "layout", exact: true },
      { href: "/admin/reports", label: "Reports", icon: "barChart", roleOnly: "DOCTOR" },
    ],
  },
  {
    label: "CLINIC",
    items: [
      {
        href: "/admin/appointments",
        label: "Appointments",
        icon: "calendarCheck",
        children: [
          { href: "/admin/appointments", label: "All Appointments" },
          { href: "/admin/appointments/settings", label: "Configure Settings" },
        ],
      },
      {
        href: "/admin/patients",
        label: "Patients",
        icon: "users",
        children: [
          { href: "/admin/patients", label: "Patient List" },
          { href: "/admin/settings/prescription", label: "Prescription Utilities" },
        ],
      },
      { href: "/admin/medicines", label: "Medicines", icon: "pill", permission: "canManageMedicines" },
    ],
  },
  {
    label: "PAGES",
    items: [
      {
        href: "/admin/pages/home",
        label: "Home",
        icon: "home",
        permission: "canManageSettings",
      },
      {
        href: "/admin/pages/about",
        label: "About Us",
        icon: "info",
        permission: "canManageSettings",
      },
      {
        href: "/admin/pages/contact",
        label: "Contact Us",
        icon: "mail",
        permission: "canManageSettings",
      },
      {
        href: "/admin/posts",
        label: "Blogs",
        icon: "newspaper",
        permission: "canManageBlog",
        children: [
          { href: "/admin/posts/categories", label: "Categories" },
          { href: "/admin/posts", label: "All Posts" },
        ],
      },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { href: "/admin/settings/general", label: "General Settings", icon: "settings", permission: "canManageSettings" },
      { href: "/admin/settings/prescription/design", label: "Prescription Design", icon: "penTool", permission: "canManageSettings" },
      { href: "/admin/settings/email", label: "Email Settings", icon: "send", permission: "canManageSettings" },
      { href: "/admin/settings/payment", label: "Payment Settings", icon: "creditCard", permission: "canManageSettings" },
      { href: "/admin/settings/backup", label: "Backup & Restore", icon: "database", roleOnly: "DOCTOR" },
      { href: "/admin/audit", label: "Audit Log", icon: "history", roleOnly: "DOCTOR" },
    ],
  },
  {
    label: "USERS",
    items: [
      { href: "/admin/users", label: "Manage Users", icon: "userCog", roleOnly: "DOCTOR" },
    ],
  },
];

function pageTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/pages")) return "Pages";
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
  if (pathname.startsWith("/admin/backup")) return "Backup & Restore";
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
  const [collapsed, setCollapsed] = useState(true);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "0") setCollapsed(false);
    setIsMac(/Mac/.test(navigator.userAgent));
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
        } ${collapsed ? "lg:w-16 lg:overflow-visible" : "lg:w-64"}`}
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
        <nav className={`flex-1 space-y-0.5 px-2 py-3 ${collapsed ? "overflow-visible" : "overflow-y-auto"}`}>
          {visibleGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[10px] uppercase tracking-wider text-slate-500 px-3 pt-3 pb-1">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <NavItemWithChildren
                  key={item.href + item.label}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  onNavigate={() => setSideOpen(false)}
                />
              ))}
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
                {isMac ? "⌘K" : "Ctrl+K"}
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

// ─── Nav Item with Expandable Children ────────────────────────────────────────

function NavItemWithChildren({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  // For expansion: detect if current path belongs to any child (including nested sub-routes)
  const isChildActive = hasChildren && item.children!.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
  const active = isActive || isChildActive;
  const [expanded, setExpanded] = useState(active);
  const [showPopover, setShowPopover] = useState(false);
  const popoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-expand when a child becomes active
  useEffect(() => {
    if (isChildActive && !expanded) setExpanded(true);
  }, [isChildActive, expanded]);

  // No children — simple link
  if (!hasChildren) {
    if (collapsed) {
      return (
        <div
          className="relative group"
        >
          <Link
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center justify-center rounded-lg px-0 py-2 text-sm font-medium transition active:scale-[0.98] ${
              active ? "bg-brand text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <AdminIcon name={item.icon} className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
          </Link>
          <div className="invisible group-hover:visible absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[100] whitespace-nowrap rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-lg">
            {item.label}
          </div>
        </div>
      );
    }
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-[0.98] ${
          active ? "bg-brand text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        <AdminIcon name={item.icon} className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
        <span>{item.label}</span>
      </Link>
    );
  }

  // Collapsed sidebar — show icon as link to first child, with popover on hover for sub-items
  if (collapsed) {
    return (
      <div
        className="relative"
        onMouseEnter={() => {
          if (popoverTimeout.current) clearTimeout(popoverTimeout.current);
          setShowPopover(true);
        }}
        onMouseLeave={() => {
          popoverTimeout.current = setTimeout(() => setShowPopover(false), 150);
        }}
      >
        <Link
          href={item.children![0].href}
          onClick={onNavigate}
          className={`flex items-center justify-center rounded-lg px-0 py-2 text-sm font-medium transition active:scale-[0.98] ${
            active ? "bg-brand text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <AdminIcon name={item.icon} className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
        </Link>
        {/* Popover flyout for collapsed sub-items */}
        {showPopover && (
          <div className="absolute left-full top-0 z-[100] ml-2 min-w-[180px] rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
            <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
            {item.children!.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.href + child.label}
                  href={child.href}
                  onClick={() => { setShowPopover(false); onNavigate(); }}
                  className={`block px-3 py-2 text-sm transition ${
                    childActive
                      ? "bg-brand/20 text-brand-light font-medium"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Expanded sidebar — parent is clickable to navigate AND has expand/collapse toggle
  return (
    <div>
      <div className="flex items-center">
        <Link
          href={item.children![0].href}
          onClick={onNavigate}
          className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-[0.98] ${
            active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <AdminIcon name={item.icon} className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
          <span className="flex-1 text-left">{item.label}</span>
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
          {item.children!.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href + child.label}
                href={child.href}
                onClick={onNavigate}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  childActive
                    ? "bg-brand text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${childActive ? "bg-white" : "bg-slate-600"}`} />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
