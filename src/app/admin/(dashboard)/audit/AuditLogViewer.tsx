"use client";

import { useState } from "react";
import Link from "next/link";

type AuditLog = {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};

type UserInfo = {
  id: string;
  username: string;
  displayName: string;
};

const ACTION_COLORS: Record<string, string> = {
  CREATE_PATIENT: "bg-green-100 text-green-700",
  UPDATE_PATIENT: "bg-blue-100 text-blue-700",
  DELETE_PATIENT: "bg-red-100 text-red-700",
  CREATE_CONSULTATION: "bg-green-100 text-green-700",
  DELETE_CONSULTATIONS: "bg-red-100 text-red-700",
  SAVE_PENDING_VITALS: "bg-amber-100 text-amber-700",
  CLEAR_PENDING_VITALS: "bg-slate-100 text-slate-700",
  RESCHEDULE_APPOINTMENT: "bg-blue-100 text-blue-700",
  UPDATE_SETTINGS: "bg-purple-100 text-purple-700",
  CREATE_POST: "bg-green-100 text-green-700",
  UPDATE_POST: "bg-blue-100 text-blue-700",
  DELETE_POST: "bg-red-100 text-red-700",
};

function getEntityLink(entity: string, entityId: string | null): string | null {
  if (!entityId) return null;
  if (entity === "patient") return `/admin/patients/${entityId}`;
  if (entity === "consultations") return null; // consultations don't have their own page
  if (entity === "appointment") return `/admin/appointments`;
  if (entity === "post") return `/admin/posts/${entityId}`;
  return null;
}

function formatDetailValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function AuditRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = log.details && Object.keys(log.details).length > 0;
  const entityLink = getEntityLink(log.entity, log.entityId);
  const actionColor = ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-700";

  return (
    <>
      <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="whitespace-nowrap px-4 py-3 text-muted">
          {new Date(log.createdAt).toLocaleString()}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-ink">{log.userName}</span>
            <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              log.userRole === "DOCTOR" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
            }`}>
              {log.userRole}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${actionColor}`}>
            {log.action.replace(/_/g, " ")}
          </span>
        </td>
        <td className="px-4 py-3 text-muted">
          <span className="capitalize">{log.entity}</span>
          {entityLink ? (
            <Link href={entityLink} onClick={(e) => e.stopPropagation()} className="ml-1 text-xs text-brand hover:underline">
              View →
            </Link>
          ) : log.entityId ? (
            <span className="ml-1 text-xs opacity-60">({log.entityId.slice(0, 8)}…)</span>
          ) : null}
        </td>
        <td className="px-4 py-3 text-xs text-muted">
          {hasDetails ? (
            <button className="text-brand hover:underline" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
              {expanded ? "Hide details" : "View details"}
            </button>
          ) : "—"}
        </td>
      </tr>
      {expanded && hasDetails && (
        <tr className="bg-slate-50">
          <td colSpan={5} className="px-6 py-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-muted">Audit Details</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(log.details!).map(([key, value]) => (
                  <div key={key} className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-xs font-medium text-muted capitalize">{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</p>
                    <p className="mt-0.5 text-sm text-ink break-all whitespace-pre-wrap">{formatDetailValue(key, value)}</p>
                  </div>
                ))}
              </div>
              {log.entityId && (
                <p className="mt-3 text-xs text-muted">
                  Entity ID: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">{log.entityId}</code>
                  {entityLink && (
                    <Link href={entityLink} className="ml-2 text-brand hover:underline">Open record →</Link>
                  )}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditLogViewer({
  initialLogs,
  users,
}: {
  initialLogs: AuditLog[];
  users: UserInfo[];
}) {
  const [logs] = useState(initialLogs);
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Get unique actions for filter dropdown
  const actions = Array.from(new Set(logs.map((l) => l.action))).sort();

  const filtered = logs.filter((log) => {
    if (filterUser && log.userId !== filterUser) return false;
    if (filterAction && log.action !== filterAction) return false;
    if (filterFrom && log.createdAt < filterFrom) return false;
    if (filterTo && log.createdAt > filterTo + "T23:59:59") return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-muted mb-1">User</label>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName} (@{u.username})
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-muted mb-1">Action</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
          >
            <option value="">All Actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">From</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">To</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
          />
        </div>
        {(filterUser || filterAction || filterFrom || filterTo) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFilterUser(""); setFilterAction(""); setFilterFrom(""); setFilterTo(""); }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-muted hover:text-ink"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Logs table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-muted">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium text-muted">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Entity</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-muted">
          Showing {filtered.length} of {logs.length} logs
        </div>
      </div>
    </div>
  );
}
