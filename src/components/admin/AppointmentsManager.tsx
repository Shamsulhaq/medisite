"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import {
  setAppointmentStatusAction,
  deleteAppointmentAction,
} from "@/app/admin/actions";
import { createPatientAction } from "@/app/admin/patient-actions";
import { findPatientByPhoneAction } from "@/app/admin/patient-actions";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function QuickPatientModal({
  appointment,
  onClose,
  onSubmit,
  submitting,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string; email: string; age: string; gender: string }) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(appointment.name);
  const [phone, setPhone] = useState(appointment.phone);
  const [email, setEmail] = useState(appointment.email);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  const canSubmit = age.trim() !== "" && gender.trim() !== "";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-ink">Quick Patient Info</h2>
        <p className="mt-1 text-sm text-muted">
          Enter required details before starting the visit.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 35"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-ink transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => onSubmit({ name, phone, email, age, gender })}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create & Start Visit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsManager({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modalAppointment, setModalAppointment] = useState<Appointment | null>(null);

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

  async function startVisit(appointment: Appointment) {
    // Check if patient already exists by phone
    startTransition(async () => {
      const existing = await findPatientByPhoneAction(appointment.phone);
      if (existing.id) {
        // Patient already exists, navigate directly
        router.push(`/admin/patients/${existing.id}`);
      } else {
        // Show modal to collect age/gender before creating
        setModalAppointment(appointment);
      }
    });
  }

  function handleModalSubmit(data: { name: string; phone: string; email: string; age: string; gender: string }) {
    startTransition(async () => {
      const res = await createPatientAction({
        name: data.name,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        address: "",
        notes: modalAppointment ? `Created from appointment on ${modalAppointment.date} (${modalAppointment.time}).` : "",
      });
      if (res.ok && res.id) {
        setModalAppointment(null);
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
    <>
      {modalAppointment && (
        <QuickPatientModal
          appointment={modalAppointment}
          onClose={() => setModalAppointment(null)}
          onSubmit={handleModalSubmit}
          submitting={pending}
        />
      )}
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
                      onClick={() => startVisit(a)}
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
    </>
  );
}
