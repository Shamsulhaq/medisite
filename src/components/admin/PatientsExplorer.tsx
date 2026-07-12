"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Patient } from "@/lib/patients";
import type { Appointment } from "@/lib/types";
import AdminIcon from "@/components/admin/AdminIcon";
import { Badge } from "@/components/admin/ui";

const control =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function PatientsExplorer({
  patients,
  importable,
}: {
  patients: Patient[];
  importable: Appointment[];
}) {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"all" | "Male" | "Female" | "Other">(
    "all"
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<"lastVisit" | "name" | "patientId" | "created">("lastVisit");

  const filtered = useMemo(() => {
    const list = patients.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.patientId.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q);
      const matchGender = gender === "all" || p.gender === gender;
      const matchFrom = !from || p.createdAt.slice(0, 10) >= from;
      const matchTo = !to || p.createdAt.slice(0, 10) <= to;
      return matchSearch && matchGender && matchFrom && matchTo;
    });

    const sorted = [...list];
    switch (sortBy) {
      case "lastVisit":
        sorted.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "patientId":
        sorted.sort((a, b) => a.patientId.localeCompare(b.patientId));
        break;
      case "created":
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
    }
    return sorted;
  }, [patients, search, gender, from, to, sortBy]);

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
              onChange={(e) => setSearch(e.target.value)}
              className={control}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Gender</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as typeof gender)}
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
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={control}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Added to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={control}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={control}
            >
              <option value="lastVisit">Last Visit</option>
              <option value="name">Name</option>
              <option value="patientId">Patient ID</option>
              <option value="created">Created</option>
            </select>
          </label>
          <span className="ml-auto self-end text-xs text-muted">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Import banner */}
      {importable.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-brand-light bg-brand-light/30 px-4 py-3">
          <p className="text-sm text-brand-dark">
            <strong>{importable.length}</strong> appointment
            {importable.length === 1 ? "" : "s"} can be imported as new patient
            {importable.length === 1 ? "" : "s"}.
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
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-muted">
          {patients.length === 0
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
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="transition hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3">
                      <Badge tone="brand">{p.patientId}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{p.name}</p>
                      {p.email && (
                        <p className="text-xs text-muted">{p.email}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted">{p.phone}</td>
                    <td className="px-5 py-3 text-muted">
                      {[p.age, p.gender].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5 text-xs text-muted">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">
                          {p.consultations.length} consultation{p.consultations.length !== 1 ? "s" : ""}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">
                          {p.testReports.length} test{p.testReports.length !== 1 ? "s" : ""}
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
    </div>
  );
}
