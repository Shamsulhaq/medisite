"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Appointment, AppointmentStatus, Availability } from "@/lib/types";
import {
  setAppointmentStatusAction,
  deleteAppointmentAction,
} from "@/app/admin/actions";
import { createPatientAction } from "@/app/admin/patient-actions";
import { findPatientByPhoneAction } from "@/app/admin/patient-actions";
import { savePendingVitalsAction, rescheduleAppointmentAction } from "@/app/admin/patient-actions";
import { generateSlotsForDate } from "@/lib/availability";
import { useToast } from "@/components/admin/ToastProvider";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

function QuickPatientModal({
  appointment,
  onClose,
  onSubmit,
  submitting,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string; email: string; age: string; gender: string; vitals: { bp: string; spo2: string; weight: string; temperature: string; pulse: string; complaint: string } }) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(appointment.name);
  const [phone, setPhone] = useState(appointment.phone);
  const [email, setEmail] = useState(appointment.email);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bp, setBp] = useState("");
  const [spo2, setSpo2] = useState("");
  const [weight, setWeight] = useState("");
  const [temperature, setTemperature] = useState("");
  const [pulse, setPulse] = useState("");
  const [complaint, setComplaint] = useState(appointment.reason || "");

  const canSubmit = age.trim() !== "" && gender.trim() !== "";

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-ink">Start Visit</h2>
        <p className="mt-1 text-sm text-muted">
          Enter patient details and record vitals.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted">
                Age <span className="text-red-500">*</span>
              </label>
              <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 35" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">
                Gender <span className="text-red-500">*</span>
              </label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Vitals Section */}
          <div className="border-t border-slate-200 pt-3">
            <h3 className="text-sm font-semibold text-ink mb-2">Record Vitals</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted">BP</label>
                <input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">SpO₂</label>
                <input value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="99%" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Weight</label>
                <input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70 kg" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Temperature</label>
                <input value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="98.6°F" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Pulse</label>
                <input value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="72 bpm" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Chief Complaint</label>
                <input value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Fever, cough..." className={inputCls} />
              </div>
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
            onClick={() => onSubmit({ name, phone, email, age, gender, vitals: { bp, spo2, weight, temperature, pulse, complaint } })}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save & Record Vitals"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsManager({
  appointments,
  availability,
  userId,
  userName,
  isDoctor,
}: {
  appointments: Appointment[];
  availability?: Availability;
  userId?: string;
  userName?: string;
  isDoctor?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modalAppointment, setModalAppointment] = useState<Appointment | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const { toast } = useToast();

  const rescheduleSlots = rescheduleDate && availability
    ? generateSlotsForDate(availability, rescheduleDate)
    : [];

  async function handlePrintPrescription(phone: string) {
    try {
      const res = await fetch(`/api/admin/print-prescription?phone=${encodeURIComponent(phone)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", data.error || "Failed to load prescription.");
        return;
      }
      const html = await res.text();
      const w = window.open("", "_blank");
      if (!w) { toast("error", "Popup blocked. Please allow popups."); return; }
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 400);
    } catch {
      toast("error", "Failed to print prescription.");
    }
  }

  function changeStatus(id: string, status: AppointmentStatus) {
    startTransition(async () => {
      try {
        await setAppointmentStatusAction(id, status);
        router.refresh();
      } catch {
        toast("error", "Failed to update status");
      }
    });
  }

  function remove(id: string, name: string) {
    if (!confirm(`Delete the appointment request from ${name}?`)) return;
    startTransition(async () => {
      try {
        await deleteAppointmentAction(id);
        toast("success", "Appointment deleted");
        router.refresh();
      } catch {
        toast("error", "Failed to delete appointment");
      }
    });
  }

  async function startVisit(appointment: Appointment) {
    startTransition(async () => {
      try {
        const existing = await findPatientByPhoneAction(appointment.phone);
        if (existing.id) {
          // Patient exists - save vitals via modal still since we need vitals
          setModalAppointment(appointment);
        } else {
          // Show modal to collect age/gender + vitals before creating
          setModalAppointment(appointment);
        }
      } catch {
        toast("error", "Failed to look up patient");
      }
    });
  }

  function handleModalSubmit(data: { name: string; phone: string; email: string; age: string; gender: string; vitals: { bp: string; spo2: string; weight: string; temperature: string; pulse: string; complaint: string } }) {
    startTransition(async () => {
      try {
        // Find or create patient
        const existing = await findPatientByPhoneAction(data.phone);
        let patientId = existing.id;

        if (!patientId) {
          const res = await createPatientAction({
            name: data.name,
            age: data.age,
            gender: data.gender,
            phone: data.phone,
            email: data.email,
            address: "",
            notes: modalAppointment ? `Created from appointment on ${modalAppointment.date} (${modalAppointment.time}).` : "",
          });
          if (!res.ok || !res.id) {
            toast("error", res.error || "Failed to create patient");
            return;
          }
          patientId = res.id;
        }

        // Save pending vitals
        const hasVitals = data.vitals.bp || data.vitals.weight || data.vitals.spo2 || data.vitals.pulse || data.vitals.temperature || data.vitals.complaint;
        if (hasVitals && patientId) {
          const vitalsRes = await savePendingVitalsAction(
            patientId,
            data.vitals,
            userId || "attendant",
            userName || "Attendant"
          );
          if (!vitalsRes.ok) {
            toast("error", vitalsRes.error || "Failed to save vitals");
            return;
          }
        }

        // Mark appointment as confirmed (patient is present)
        if (modalAppointment) {
          await setAppointmentStatusAction(modalAppointment.id, "confirmed");
        }

        setModalAppointment(null);
        toast("success", "Vitals recorded. Doctor will complete the consultation.");
        router.refresh();
      } catch {
        toast("error", "Something went wrong");
      }
    });
  }

  function handleReschedule(appointmentId: string) {
    if (!rescheduleDate || !rescheduleTime) {
      toast("error", "Please select both date and time");
      return;
    }
    startTransition(async () => {
      try {
        const res = await rescheduleAppointmentAction(appointmentId, rescheduleDate, rescheduleTime);
        if (!res.ok) {
          toast("error", res.error || "Failed to reschedule");
          return;
        }
        toast("success", "Appointment rescheduled");
        setRescheduleId(null);
        setRescheduleDate("");
        setRescheduleTime("");
        router.refresh();
      } catch {
        toast("error", "Something went wrong");
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
                    {a.status === "completed" && (
                      <button
                        type="button"
                        onClick={() => handlePrintPrescription(a.phone)}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-slate-200"
                      >
                        🖨️ Print Prescription
                      </button>
                    )}
                    {a.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => startVisit(a)}
                          disabled={pending}
                          className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
                        >
                          Start Visit
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRescheduleId(rescheduleId === a.id ? null : a.id); setRescheduleDate(""); setRescheduleTime(""); }}
                          disabled={pending}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => changeStatus(a.id, "cancelled")}
                          disabled={pending}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        {isDoctor !== false && (
                          <button
                            type="button"
                            onClick={() => remove(a.id, a.name)}
                            disabled={pending}
                            className="text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                    {a.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() => { setRescheduleId(rescheduleId === a.id ? null : a.id); setRescheduleDate(""); setRescheduleTime(""); }}
                        disabled={pending}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Reschedule
                      </button>
                    )}
                    {a.status === "cancelled" && isDoctor !== false && (
                      <button
                        type="button"
                        onClick={() => remove(a.id, a.name)}
                        disabled={pending}
                        className="text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  {rescheduleId === a.id && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <input
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => { setRescheduleDate(e.target.value); setRescheduleTime(""); }}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-brand"
                      />
                      <select
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        disabled={rescheduleSlots.length === 0}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-brand disabled:opacity-50"
                      >
                        <option value="">{rescheduleSlots.length === 0 ? "Pick date first" : "Select time"}</option>
                        {rescheduleSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleReschedule(a.id)}
                        disabled={pending || !rescheduleDate || !rescheduleTime}
                        className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setRescheduleId(null)}
                        className="text-xs text-muted hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
