"use client";

import { useMemo, useState } from "react";
import type { Appointment, Availability } from "@/lib/types";
import { downloadCSV, downloadExcel, openPrintPDF } from "@/lib/export";
import { todayInBD } from "@/lib/utils";
import AppointmentsManager from "@/components/admin/AppointmentsManager";

type RangeMode = "all" | "today" | "upcoming" | "past" | "custom";

function todayStr(): string {
  return todayInBD();
}

const control =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function AppointmentsExplorer({
  appointments,
  chambers,
  availability,
  userId,
  userName,
  isDoctor,
}: {
  appointments: Appointment[];
  chambers: string[];
  availability?: Availability;
  userId?: string;
  userName?: string;
  isDoctor?: boolean;
}) {
  const [range, setRange] = useState<RangeMode>("upcoming");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<"all" | "online" | "offline">("all");
  const [chamber, setChamber] = useState<string>("all");
  const [search, setSearch] = useState("");

  const today = todayStr();

  const filtered = useMemo(() => {
    const bySearch = (a: Appointment) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.phone.includes(q);
    };
    const byRange = (a: Appointment) => {
      switch (range) {
        case "today":
          return a.date === today;
        case "upcoming":
          return a.date >= today;
        case "past":
          return a.date < today;
        case "custom":
          return (!from || a.date >= from) && (!to || a.date <= to);
        case "all":
        default:
          return true;
      }
    };
    const byType = (a: Appointment) => type === "all" || a.mode === type;
    const byChamber = (a: Appointment) =>
      chamber === "all" || (a.mode === "offline" && a.location === chamber);

    return appointments
      .filter((a) => bySearch(a) && byRange(a) && byType(a) && byChamber(a))
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return a.time < b.time ? -1 : 1;
      });
  }, [appointments, range, from, to, type, chamber, search, today]);

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

  const exportRows = () =>
    filtered.map((a) => [
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

  return (
    <div>
      {/* Filter + export bar */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[180px] flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-muted">Search</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or phone..."
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Period</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as RangeMode)}
              className={control}
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="custom">Custom range</option>
            </select>
          </label>

          {range === "custom" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted">From</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className={control}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted">To</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className={control}
                />
              </label>
            </>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Type</span>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as "all" | "online" | "offline")
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
              value={chamber}
              onChange={(e) => setChamber(e.target.value)}
              disabled={type === "online"}
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
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() =>
                downloadCSV(
                  EXPORT_HEADERS,
                  exportRows(),
                  `appointments-${stamp}.csv`
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-slate-50"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() =>
                downloadExcel(
                  EXPORT_HEADERS,
                  exportRows(),
                  `appointments-${stamp}.xls`
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-slate-50"
            >
              Excel
            </button>
            <button
              type="button"
              onClick={() =>
                openPrintPDF(
                  "Appointments",
                  EXPORT_HEADERS,
                  exportRows()
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-slate-50"
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      <AppointmentsManager appointments={filtered} availability={availability} userId={userId} userName={userName} isDoctor={isDoctor} />
    </div>
  );
}
