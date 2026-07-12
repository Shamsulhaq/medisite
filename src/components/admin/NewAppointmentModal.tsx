"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import { createAppointmentAction } from "@/app/admin/patient-actions";

const control =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const label = "flex flex-col gap-1 text-xs font-medium text-muted";

interface PatientHit {
  id: string;
  name: string;
  phone: string;
  patientId: string;
}

export default function NewAppointmentModal({
  chambers,
  onlineEnabled,
}: {
  chambers: string[];
  onlineEnabled: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    mode: "offline" as "offline" | "online",
    location: chambers[0] ?? "",
    date: today,
    time: "",
    status: "confirmed" as "confirmed" | "pending",
    reason: "",
  });

  // Patient search prefill
  const [patientQuery, setPatientQuery] = useState("");
  const [hits, setHits] = useState<PatientHit[]>([]);
  const [showHits, setShowHits] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!patientQuery.trim()) {
      setHits([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/patients/search?q=${encodeURIComponent(patientQuery.trim())}`
        );
        if (res.ok) {
          setHits(await res.json());
          setShowHits(true);
        }
      } catch {
        /* ignore */
      }
    }, 300);
  }, [patientQuery]);

  const selectPatient = (p: PatientHit) => {
    set("name", p.name);
    set("phone", p.phone);
    setPatientQuery(`${p.name} (${p.patientId})`);
    setShowHits(false);
  };

  const reset = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      mode: "offline",
      location: chambers[0] ?? "",
      date: today,
      time: "",
      status: "confirmed",
      reason: "",
    });
    setPatientQuery("");
    setHits([]);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.date || !form.time.trim()) {
      toast("error", "Name, phone, date and time are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await createAppointmentAction({
        name: form.name,
        phone: form.phone,
        email: form.email,
        mode: form.mode,
        location: form.mode === "online" ? "Online" : form.location,
        date: form.date,
        time: form.time,
        reason: form.reason,
        status: form.status,
      });
      if (!res.ok) throw new Error(res.error || "Failed to create appointment");
      toast("success", "Appointment created.");
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to create appointment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
      >
        + Add Appointment
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">New Appointment</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted hover:text-ink"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Patient prefill search */}
            <div className="relative mb-4">
              <label className={label}>
                <span>Find existing patient (optional)</span>
                <input
                  type="text"
                  placeholder="Search by name, phone or ID…"
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  onFocus={() => hits.length > 0 && setShowHits(true)}
                  className={control}
                />
              </label>
              {showHits && hits.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {hits.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => selectPatient(p)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium text-ink">{p.name}</span>
                        <span className="text-xs text-muted">
                          {p.phone} · {p.patientId}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={label}>
                <span>Patient name *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={control}
                />
              </label>
              <label className={label}>
                <span>Phone *</span>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={control}
                />
              </label>
              <label className={label}>
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={control}
                />
              </label>
              <label className={label}>
                <span>Type</span>
                <select
                  value={form.mode}
                  onChange={(e) => set("mode", e.target.value as "offline" | "online")}
                  className={control}
                >
                  <option value="offline">In-person (chamber)</option>
                  {onlineEnabled && <option value="online">Online</option>}
                </select>
              </label>

              {form.mode === "offline" && chambers.length > 0 && (
                <label className={label}>
                  <span>Chamber</span>
                  <select
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    className={control}
                  >
                    {chambers.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className={label}>
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as "confirmed" | "pending")}
                  className={control}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                </select>
              </label>

              <label className={label}>
                <span>Date *</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className={control}
                />
              </label>
              <label className={label}>
                <span>Time *</span>
                <input
                  type="text"
                  placeholder="e.g. 06:30 PM"
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                  className={control}
                />
              </label>

              <label className={`${label} sm:col-span-2`}>
                <span>Reason / notes</span>
                <textarea
                  rows={2}
                  value={form.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  className={control}
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
