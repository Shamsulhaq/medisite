"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Appointment, Availability, AppointmentConfig } from "@/lib/types";
import type { AppointmentsQuery } from "@/lib/appointments";
import { downloadCSV, downloadExcel, openPrintPDF } from "@/lib/export";
import { todayInBD } from "@/lib/utils";
import AppointmentsManager from "@/components/admin/AppointmentsManager";
import Pagination from "@/components/admin/Pagination";

type RangeMode = "all" | "today" | "upcoming" | "past" | "custom";

function todayStr(): string {
  return todayInBD();
}

const control =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

interface Filters {
  q: string;
  range: RangeMode;
  from: string;
  to: string;
  type: "all" | "online" | "offline";
  chamber: string;
}

export default function AppointmentsExplorer({
  appointments,
  chambers,
  availability,
  appointment,
  userId,
  userName,
  isDoctor,
  total,
  page,
  perPage,
  totalPages,
  filters,
  exportAppointments,
}: {
  appointments: Appointment[];
  chambers: string[];
  availability?: Availability;
  appointment?: AppointmentConfig;
  userId?: string;
  userName?: string;
  isDoctor?: boolean;
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: Filters;
  exportAppointments: (query: AppointmentsQuery) => Promise<Appointment[]>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local text-search state so typing is smooth; other filters apply on change.
  const [search, setSearch] = useState(filters.q);
  useEffect(() => setSearch(filters.q), [filters.q]);

  // Push updated filters to the URL. Resets to page 1 whenever a filter
  // changes (page is only preserved by the Pagination control itself).
  const applyFilters = (patch: Partial<Filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    const next: Filters = { ...filters, ...patch };
    const setOrDelete = (key: keyof Filters, val: string, def: string) => {
      if (val && val !== def) params.set(key, val);
      else params.delete(key);
    };
    setOrDelete("q", next.q, "");
    setOrDelete("range", next.range, "today");
    setOrDelete("from", next.from, "");
    setOrDelete("to", next.to, "");
    setOrDelete("type", next.type, "all");
    setOrDelete("chamber", next.chamber, "all");
    params.delete("page"); // any filter change returns to the first page
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  // Debounce the free-text search box.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyFilters({ q: value }), 350);
  };

  const EXPORT_HEADERS = [
    "Name",
    "Phone",
    "Email",
    "Type",
    "Location",
    "Date",
    "Time",
    "Status",
    "Reason",
    "Requested",
  ];

  const toRows = (rows: Appointment[]) =>
    rows.map((a) => [
      a.name,
      a.phone,
      a.email,
      a.mode === "online" ? "Online" : "In-person",
      a.location ?? "",
      a.date,
      a.time,
      a.status,
      a.reason ?? "",
      new Date(a.createdAt).toLocaleString(),
    ]);

  const stamp = todayStr();

  // Exports fetch ALL rows matching the current filters (not just this page).
  const [exporting, setExporting] = useState(false);
  const currentQuery = (): AppointmentsQuery => ({
    q: filters.q,
    range: filters.range,
    from: filters.from,
    to: filters.to,
    type: filters.type,
    chamber: filters.chamber,
  });
  const withExportRows = async (
    run: (rows: (string | number)[][]) => void
  ) => {
    if (exporting) return;
    setExporting(true);
    try {
      const all = await exportAppointments(currentQuery());
      run(toRows(all));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {/* Filter + export bar */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[180px] flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-muted">Search</span>
            <input type="text" value={search} onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Name or phone..."
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Period</span>
            <select
              value={filters.range}
              onChange={(e) => applyFilters({ range: e.target.value as RangeMode })}
              className={control}
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="custom">Custom range</option>
            </select>
          </label>

          {filters.range === "custom" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted">From</span>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => applyFilters({ from: e.target.value })}
                  className={control}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted">To</span>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => applyFilters({ to: e.target.value })}
                  className={control}
                />
              </label>
            </>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Type</span>
            <select
              value={filters.type}
              onChange={(e) =>
                applyFilters({
                  type: e.target.value as "all" | "online" | "offline",
                })
              }
              className={control}
            >
              <option value="all">All types</option>
              <option value="offline">In-person</option>
              <option value="online">Online</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Chamber</span>
            <select
              value={filters.chamber}
              onChange={(e) => applyFilters({ chamber: e.target.value })}
              disabled={filters.type === "online"}
              className={`${control} disabled:bg-slate-50 disabled:text-slate-400`}
            >
              <option value="all">All chambers</option>
              {chambers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          {/* Export */}
          <div className="ml-auto flex items-end gap-2">
            <span className="mb-1 text-xs text-muted">
              {isPending ? "Loading…" : `${total} result${total === 1 ? "" : "s"}`}
            </span>
            <button
              type="button"
              disabled={exporting}
              onClick={() =>
                withExportRows((rows) =>
                  downloadCSV(EXPORT_HEADERS, rows, `appointments-${stamp}.csv`)
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CSV
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={() =>
                withExportRows((rows) =>
                  downloadExcel(EXPORT_HEADERS, rows, `appointments-${stamp}.xls`)
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Excel
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={() =>
                withExportRows((rows) =>
                  openPrintPDF("Appointments", EXPORT_HEADERS, rows)
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      <AppointmentsManager appointments={appointments} availability={availability} appointment={appointment} userId={userId} userName={userName} isDoctor={isDoctor} />

      <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} />
    </div>
  );
}
