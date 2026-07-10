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

export default function PatientForm({ patient }: { patient?: Patient }) {
  const router = useRouter();
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
      setMsg(
        res.ok
          ? { type: "ok", text: "Patient details saved." }
          : { type: "err", text: res.error ?? "Failed to save." }
      );
      router.refresh();
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

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? "Saving..." : patient ? "Save Details" : "Create Patient"}
      </button>
    </form>
  );
}
