"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Patient, PatientInfoInput } from "@/lib/patients";
import {
  createPatientAction,
  updatePatientAction,
} from "@/app/admin/patient-actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

function ReadOnlyView({ patient, onEdit }: { patient: Patient; onEdit: () => void }) {
  const fields: { label: string; value: string }[] = [
    { label: "Full Name", value: patient.name },
    { label: "Age", value: patient.age },
    { label: "Gender", value: patient.gender },
    { label: "Phone", value: patient.phone },
    { label: "Email", value: patient.email },
    { label: "Address", value: patient.address },
    { label: "Notes", value: patient.notes },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div
            key={f.label}
            className={f.label === "Full Name" || f.label === "Address" || f.label === "Notes" ? "sm:col-span-2" : ""}
          >
            <p className="text-xs font-medium text-muted uppercase tracking-wide">{f.label}</p>
            <p className="mt-0.5 text-sm text-ink">{f.value || <span className="text-slate-400">—</span>}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="mt-4 rounded-full border border-brand px-5 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
      >
        Edit
      </button>
    </div>
  );
}

export default function PatientForm({ patient }: { patient?: Patient }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!patient); // new patient → always editing
  const [form, setForm] = useState<PatientInfoInput>({
    name: patient?.name ?? "",
    age: patient?.age ?? "",
    gender: patient?.gender ?? "",
    phone: patient?.phone ?? "",
    email: patient?.email ?? "",
    address: patient?.address ?? "",
    notes: patient?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const set = (k: keyof PatientInfoInput) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function handleCancel() {
    // Revert to patient data
    if (patient) {
      setForm({
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        notes: patient.notes,
      });
    }
    setEditing(false);
    setMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!form.name.trim()) {
      setMsg({ type: "err", text: "Patient name is required." });
      return;
    }
    if (!patient && !form.phone.trim()) {
      setMsg({ type: "err", text: "Phone number is required (used as patient identity)." });
      return;
    }
    setSaving(true);
    if (patient) {
      const res = await updatePatientAction(patient.id, form);
      setSaving(false);
      if (res.ok) {
        setMsg({ type: "ok", text: "Patient details saved." });
        setEditing(false);
        router.refresh();
      } else {
        setMsg({ type: "err", text: res.error ?? "Failed to save." });
      }
    } else {
      const res = await createPatientAction(form);
      setSaving(false);
      if (res.ok && res.id) {
        router.push(`/admin/patients/${res.id}`);
        router.refresh();
      } else {
        setMsg({ type: "err", text: res.error ?? "Failed to create." });
      }
    }
  }

  // Read-only view for existing patients
  if (patient && !editing) {
    return <ReadOnlyView patient={patient} onEdit={() => setEditing(true)} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            msg.type === "ok"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-ink">
            Full Name <span className="text-red-500">*</span>
          </span>
          <input
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Age</span>
          <input
            value={form.age}
            onChange={(e) => set("age")(e.target.value)}
            className={inputClass}
            placeholder="e.g. 45"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Gender</span>
          <select
            value={form.gender}
            onChange={(e) => set("gender")(e.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Phone</span>
          <input
            value={form.phone}
            onChange={(e) => set("phone")(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-ink">Address</span>
          <input
            value={form.address}
            onChange={(e) => set("address")(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-ink">General Notes</span>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes")(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Allergies, chronic conditions, etc."
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : patient ? "Save Details" : "Create Patient"}
        </button>
        {patient && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-muted transition hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
