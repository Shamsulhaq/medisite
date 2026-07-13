"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PatientListItem } from "@/lib/patients";
import AdminIcon from "@/components/admin/AdminIcon";
import Pagination from "@/components/admin/Pagination";
import { Badge } from "@/components/admin/ui";

const control =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

interface Filters {
  q: string;
  gender: string;
  from: string;
  to: string;
  sort: string;
}

export default function PatientsExplorer({
  items,
  total,
  page,
  perPage,
  totalPages,
  importableCount,
  filters,
}: {
  items: PatientListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  importableCount: number;
  filters: Filters;
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
    setOrDelete("gender", next.gender, "all");
    setOrDelete("from", next.from, "");
    setOrDelete("to", next.to, "");
    setOrDelete("sort", next.sort, "lastVisit");
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

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-muted">Search</span>
            <input
              type="text"
              placeholder="Name, phone, ID, email..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className={control}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Gender</span>
            <select
              value={filters.gender}
              onChange={(e) => applyFilters({ gender: e.target.value })}
              className={control}
            >
              <option value="all">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Added from</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => applyFilters({ from: e.target.value })}
              className={control}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Added to</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => applyFilters({ to: e.target.value })}
              className={control}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Sort by</span>
            <select
              value={filters.sort}
              onChange={(e) => applyFilters({ sort: e.target.value })}
              className={control}
            >
              <option value="lastVisit">Last Visit</option>
              <option value="name">Name</option>
              <option value="patientId">Patient ID</option>
              <option value="created">Created</option>
            </select>
          </label>
          <span className="ml-auto self-end text-xs text-muted">
            {isPending ? "Loading…" : `${total} result${total === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      {/* Import banner */}
      {importableCount > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-brand-light bg-brand-light/30 px-4 py-3">
          <p className="text-sm text-brand-dark">
            <strong>{importableCount}</strong> appointment
            {importableCount === 1 ? "" : "s"} can be imported as new patient
            {importableCount === 1 ? "" : "s"}.
          </p>
          <Link
            href="/admin/patients/new"
            className="text-sm font-medium text-brand hover:text-brand-dark"
          >
            Import →
          </Link>
        </div>
      )}

      {/* List */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-muted">
          {total === 0 && !filters.q && filters.gender === "all" && !filters.from && !filters.to
            ? "No patients yet. Add one to get started."
            : "No patients match your filters."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Age / Gender</th>
                  <th className="px-5 py-3">Records</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => (
                  <tr key={p.id} onClick={() => router.push(`/admin/patients/${p.id}`)} className="cursor-pointer transition hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Badge tone="brand">{p.patientId}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{p.name}</p>
                      {p.email && <p className="text-xs text-muted">{p.email}</p>}
                    </td>
                    <td className="px-5 py-3 text-muted">{p.phone}</td>
                    <td className="px-5 py-3 text-muted">
                      {[p.age, p.gender].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5 text-xs text-muted">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">
                          {p.consultationCount} consultation
                          {p.consultationCount !== 1 ? "s" : ""}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">
                          {p.testReportCount} test
                          {p.testReportCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/patients/${p.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
                      >
                        Open
                        <AdminIcon name="chevronRight" className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} />
    </div>
  );
}
