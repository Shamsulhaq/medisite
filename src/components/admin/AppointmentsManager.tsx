"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import {
  setAppointmentStatusAction,
  deleteAppointmentAction,
} from "@/app/admin/actions";
import { createPatientFromAppointmentAction } from "@/app/admin/patient-actions";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AppointmentsManager({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeStatus(id: string, status: AppointmentStatus) {
    startTransition(async () => {
      await setAppointmentStatusAction(id, status);
      router.refresh();
    });
  }

  function remove(id: string, name: string) {
    if (!confirm(`Delete the appointment request from ${name}?`)) return;
    startTransition(async () => {
      await deleteAppointmentAction(id);
      router.refresh();
    });
  }

  async function startVisit(appointmentId: string) {
    startTransition(async () => {
      const res = await createPatientFromAppointmentAction(appointmentId);
      if (res.ok && res.id) {
        router.push(`/admin/patients/${res.id}`);
      }
    });
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-muted">
        No appointments in this view.
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm transition ${
        pending ? "opacity-60" : ""
      }`}
    >
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th className="px-5 py-3">Patient</th>
            <th className="px-5 py-3">Contact</th>
            <th className="px-5 py-3">Type</th>
            <th className="px-5 py-3">Preferred</th>
            <th className="px-5 py-3">Reason</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {appointments.map((a) => (
            <tr key={a.id} className="align-top transition hover:bg-slate-50/60">
              <td className="px-5 py-3">
                <p className="font-medium text-ink">{a.name}</p>
                <p className="text-xs text-muted">
                  {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </td>
              <td className="px-5 py-3 text-muted">
                <div>{a.phone}</div>
                <div className="text-xs">{a.email}</div>
              </td>
              <td className="px-5 py-3 text-muted">
                <div>{a.mode === "online" ? "Online" : "In-person"}</div>
                <div className="text-xs">{a.location}</div>
              </td>
              <td className="px-5 py-3 text-muted">
                <div>{a.date}</div>
                <div className="text-xs">{a.time}</div>
              </td>
              <td className="max-w-xs px-5 py-3 text-muted">
                {a.reason || <span className="text-slate-400">—</span>}
              </td>
              <td className="px-5 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[a.status]}`}
                >
                  {a.status}
                </span>
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => startVisit(a.id)}
                    disabled={pending}
                    className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    Start Visit
                  </button>
                  <select
                    value={a.status}
                    disabled={pending}
                    onChange={(e) =>
                      changeStatus(a.id, e.target.value as AppointmentStatus)
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-brand"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(a.id, a.name)}
                    disabled={pending}
                    className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
