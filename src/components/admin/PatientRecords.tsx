"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Patient, Consultation, MedicineEntry, RecordKind } from "@/lib/patients";
import type { PrescriptionConfig, Chamber, Appointment, PrescriptionTemplate } from "@/lib/types";
import type { MedicineRef } from "@/lib/medicines";
import { FREQUENCIES, DURATIONS, FORMS } from "@/lib/medicines";
import { addRecordAction, deleteRecordAction, learnFromConsultationAction } from "@/app/admin/patient-actions";
import { saveSettingsAction } from "@/app/admin/actions";
import PrescriptionActions from "@/components/admin/PrescriptionActions";
import type { DoctorInfo } from "@/lib/prescription-pdf";

function CollapsibleSection({ title, expanded, onToggle, children }: {
  title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <button type="button" onClick={onToggle}
        className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-slate-100 transition">
        <span>{title}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`h-4 w-4 text-muted transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {expanded && <div className="px-4 py-4 space-y-4">{children}</div>}
    </div>
  );
}

function TimelineItem({ consultation: con, patient, doctor, prescriptionConfig, chambers, onDelete }: {
  consultation: Consultation; patient: Patient; doctor: DoctorInfo;
  prescriptionConfig: PrescriptionConfig; chambers: Chamber[]; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="relative pb-6 last:pb-0">
      {/* Timeline dot */}
      <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-brand bg-white" />
      {/* Date */}
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <p className="text-xs font-bold text-brand">{con.date}</p>
        <p className="mt-0.5 text-sm text-ink">
          {con.chiefComplaint.filter(Boolean).join(", ") || "Consultation"}{" "}
          <span className="text-muted">— Dx: {con.diagnosis.filter(Boolean).join(", ") || "—"}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Rx: {con.medicines.length} medicine{con.medicines.length !== 1 ? "s" : ""} · {con.advices.filter(Boolean).length} advice{con.advices.filter(Boolean).length !== 1 ? "s" : ""}
        </p>
      </button>
      {expanded && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <p className="font-medium text-ink">Vitals</p>
              <p className="text-xs text-muted">
                BP: {con.vitals.bp || "—"} | Pulse: {con.vitals.pulse || "—"} | Wt: {con.vitals.weight || "—"} | SpO₂: {con.vitals.spo2 || "—"} | Temp: {con.vitals.temperature || "—"}
              </p>
              {con.history && <p className="mt-1 text-xs text-muted"><span className="font-medium text-ink">History:</span> {con.history}</p>}
              {con.onExamination && <p className="mt-1 text-xs text-muted"><span className="font-medium text-ink">O/E:</span> {con.onExamination}</p>}
            </div>
            <div>
              <p className="font-medium text-ink">Medicines</p>
              <ul className="text-xs text-muted space-y-0.5">
                {con.medicines.map((m, i) => (
                  <li key={i}>{i + 1}. {m.form} {m.name} {m.dosage} — {m.frequency} {m.timing} ({m.duration})</li>
                ))}
              </ul>
            </div>
          </div>
          {con.advices.filter(Boolean).length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink">Advices</p>
              <ul className="mt-1 text-xs text-muted list-disc list-inside">
                {con.advices.filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {con.followUp && <p className="text-xs text-muted"><span className="font-medium text-ink">Follow-up:</span> {con.followUp}</p>}
          {con.notes && <p className="text-xs text-muted"><span className="font-medium text-ink">Notes:</span> {con.notes}</p>}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
            <PrescriptionActions patient={patient} consultation={con} doctor={doctor} rxConfig={prescriptionConfig} chambers={chambers} />
            <button type="button" onClick={onDelete} className="text-xs font-medium text-red-600 hover:underline ml-auto">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const today = () => new Date().toISOString().split("T")[0];

function AttachmentField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.ok) onChange(data.url);
    } catch {} finally { setUploading(false); }
  }
  return (
    <div className="flex items-center gap-3">
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60">
        {uploading ? "Uploading…" : "Attach"}
      </button>
      {value && (
        <span className="flex items-center gap-2 text-xs text-muted">
          <a href={value} target="_blank" rel="noreferrer" className="text-brand underline">View</a>
          <button type="button" onClick={() => onChange("")} className="text-red-600 hover:underline">remove</button>
        </span>
      )}
    </div>
  );
}

function MedicineInput({ entry, onChange, onRemove, index, onAdviceAdd }: {
  entry: MedicineEntry; onChange: (m: MedicineEntry) => void; onRemove: () => void; index: number;
  onAdviceAdd?: (advice: string) => void;
}) {
  const [query, setQuery] = useState(entry.name);
  const [suggestions, setSuggestions] = useState<MedicineRef[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [availDosages, setAvailDosages] = useState<string[]>([]);
  const [availForms, setAvailForms] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleSearch(v: string) {
    setQuery(v); onChange({ ...entry, name: v });
    if (timerRef.current) clearTimeout(timerRef.current);
    if (v.length < 1) { setSuggestions([]); setShowSugg(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/medicines?q=${encodeURIComponent(v)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setShowSugg(data.length > 0);
      } catch { setSuggestions([]); }
    }, 150);
  }

  function pick(med: MedicineRef, brand: string, type: "generic" | "brand") {
    const name = type === "generic" ? med.generic : brand;
    const autoForm = med.forms[0] || "";
    setAvailDosages(med.dosages);
    setAvailForms(med.forms);
    onChange({
      ...entry,
      name,
      generic: med.generic,
      type,
      form: autoForm,
      dosage: med.dosages.length === 1 ? med.dosages[0] : entry.dosage,
    });
    setQuery(name);
    setShowSugg(false);
    // Auto-add medicine-specific advice
    if (med.defaultAdvice && onAdviceAdd) {
      onAdviceAdd(med.defaultAdvice);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted">{index + 1}.</span>
        <button type="button" onClick={onRemove} className="text-xs text-red-600 hover:underline">Remove</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_120px_120px]">
        <div className="relative">
          <input value={query} onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (suggestions.length) setShowSugg(true); }}
            onBlur={() => setTimeout(() => setShowSugg(false), 200)}
            placeholder="Medicine name (brand or generic)..."
            className={inputClass} />
          {showSugg && (
            <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {suggestions.map((s) => (
                <div key={s.generic} className="border-b border-slate-100 px-3 py-2 last:border-0">
                  <button type="button" onClick={() => pick(s, s.generic, "generic")}
                    className="block w-full text-left text-sm font-medium text-ink hover:text-brand">
                    {s.generic} <span className="text-xs text-muted">({s.forms[0] || "—"}) {s.dosages.slice(0, 3).join(", ")}</span>
                  </button>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.brands.map((b) => (
                      <button key={b} type="button" onClick={() => pick(s, b, "brand")}
                        className="rounded bg-brand-light px-1.5 py-0.5 text-xs text-brand-dark hover:bg-brand/20">{b}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <select value={entry.form} onChange={(e) => onChange({ ...entry, form: e.target.value })} className={inputClass}>
          <option value="">Form</option>
          {(availForms.length > 0 ? availForms : FORMS).map((f) => <option key={f}>{f}</option>)}
          {availForms.length > 0 && <optgroup label="All forms">{FORMS.filter((f) => !availForms.includes(f)).map((f) => <option key={f}>{f}</option>)}</optgroup>}
        </select>
        {availDosages.length > 0 ? (
          <select value={entry.dosage} onChange={(e) => onChange({ ...entry, dosage: e.target.value })} className={inputClass}>
            <option value="">Dosage</option>
            {availDosages.map((d) => <option key={d}>{d}</option>)}
          </select>
        ) : (
          <input value={entry.dosage} onChange={(e) => onChange({ ...entry, dosage: e.target.value })}
            className={inputClass} placeholder="Dosage" />
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <select value={entry.frequency} onChange={(e) => onChange({ ...entry, frequency: e.target.value })} className={inputClass}>
          <option value="">Frequency</option>
          {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
        </select>
        <input value={entry.timing} onChange={(e) => onChange({ ...entry, timing: e.target.value })}
          className={inputClass} placeholder="Timing" list="timing-options" />
        <select value={entry.duration} onChange={(e) => onChange({ ...entry, duration: e.target.value })} className={inputClass}>
          <option value="">Duration</option>
          {DURATIONS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <input value={entry.specialNote} onChange={(e) => onChange({ ...entry, specialNote: e.target.value })}
        className={inputClass} placeholder="Special note (optional)" />
    </div>
  );
}

export default function PatientRecords({ patient, doctor, prescriptionConfig, prescriptionTemplates, chambers, appointments }: {
  patient: Patient;
  doctor: DoctorInfo;
  prescriptionConfig: PrescriptionConfig;
  prescriptionTemplates: PrescriptionTemplate[];
  chambers: Chamber[];
  appointments: Appointment[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Auto-detect chamber from patient's appointment matching today's date
  const todayDate = today();
  const patientAppointment = appointments.find(
    (a) =>
      a.phone.replace(/[\s\-()]/g, "") === patient.phone.replace(/[\s\-()]/g, "") &&
      a.date === todayDate &&
      a.mode === "offline"
  );
  const autoChamberId = patientAppointment
    ? chambers.find((c) => c.name === patientAppointment.location)?.id || chambers[0]?.id || ""
    : chambers[0]?.id || "";

  const emptyMed: MedicineEntry = { name: "", generic: "", type: "brand", form: "", dosage: "", frequency: "", timing: "", duration: "", specialNote: "" };

  // Pre-fill from the latest consultation
  const lastC = patient.consultations[0]; // sorted newest-first
  const initialConsultation: Omit<Consultation, "id"> = lastC
    ? {
        date: todayDate,
        chamberId: autoChamberId,
        vitals: { ...lastC.vitals }, // carry over vitals for comparison
        chiefComplaint: [...lastC.chiefComplaint],
        history: lastC.history,
        onExamination: lastC.onExamination,
        diagnosis: [...lastC.diagnosis],
        medicines: lastC.medicines.map((m) => ({ ...m })),
        advices: [...lastC.advices],
        followUp: lastC.followUp,
        notes: "",
        attachment: "",
      }
    : {
        date: todayDate,
        chamberId: autoChamberId,
        vitals: { bp: "", pulse: "", weight: "", spo2: "", temperature: "", others: "" },
        chiefComplaint: [""],
        history: "",
        onExamination: "",
        diagnosis: [""],
        medicines: [{ ...emptyMed }],
        advices: [],
        followUp: "",
        notes: "",
        attachment: "",
      };

  const [c, setC] = useState<Omit<Consultation, "id">>(initialConsultation);

  // Test report state
  const [report, setReport] = useState({ date: today(), title: "", result: "", attachment: "" });

  function add(kind: RecordKind, data: object, reset: () => void) {
    startTransition(async () => {
      await addRecordAction(patient.id, kind, data);
      // Auto-learn new advices and medicines
      if (kind === "consultations") {
        const con = data as Omit<Consultation, "id">;
        await learnFromConsultationAction({
          advices: con.advices.filter(Boolean),
          medicines: con.medicines
            .filter((m) => m.name.trim())
            .map((m) => ({ name: m.name, generic: m.generic, form: m.form, dosage: m.dosage })),
        });
      }
      reset(); router.refresh();
    });
  }
  function remove(kind: RecordKind, id: string) {
    if (!confirm("Delete this record?")) return;
    startTransition(async () => { await deleteRecordAction(patient.id, kind, id); router.refresh(); });
  }

  // Helpers for array fields
  const setComplaint = (i: number, v: string) => setC({ ...c, chiefComplaint: c.chiefComplaint.map((x, idx) => idx === i ? v : x) });
  const setDiagnosis = (i: number, v: string) => setC({ ...c, diagnosis: c.diagnosis.map((x, idx) => idx === i ? v : x) });
  const setAdvice = (i: number, v: string) => setC({ ...c, advices: c.advices.map((x, idx) => idx === i ? v : x) });

  function resetConsultation() {
    setC({
      date: today(),
      vitals: { bp: "", pulse: "", weight: "", spo2: "", temperature: "", others: "" },
      chiefComplaint: [""], history: "", onExamination: "", diagnosis: [""],
      medicines: [{ ...emptyMed }], advices: [""], followUp: "", notes: "", attachment: "",
    });
  }

  const SECTIONS = ["complaint", "vitals", "diagnosis", "medicines", "advices"] as const;
  type SectionId = (typeof SECTIONS)[number];
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(["complaint"]));

  function toggleSection(id: SectionId) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function advanceToSection(id: SectionId) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  // --- Draft auto-save ---
  const draftKey = `consultation-draft-${patient.id}`;
  const [draftBanner, setDraftBanner] = useState<"show" | "hidden">("hidden");

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) setDraftBanner("show");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(c));
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [c, draftKey]);

  function restoreDraft() {
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setC(parsed);
      }
    } catch {}
    setDraftBanner("hidden");
  }

  function discardDraft() {
    try { localStorage.removeItem(draftKey); } catch {}
    setDraftBanner("hidden");
  }

  // Wrap add function to clear draft on successful save
  function addAndClearDraft(kind: RecordKind, data: object, reset: () => void) {
    add(kind, data, () => {
      reset();
      try { localStorage.removeItem(draftKey); } catch {}
    });
  }

  return (
    <div className={`space-y-6 ${pending ? "opacity-70" : ""}`}>
      {/* CONSULTATIONS LIST (Timeline) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Consultations / Prescriptions</h2>
        <div className="mt-4">
          {patient.consultations.length === 0 && <p className="text-sm text-muted">No consultations yet.</p>}
          {patient.consultations.length > 0 && (
            <div className="relative ml-4 border-l-2 border-slate-200 pl-6">
              {patient.consultations.map((con) => (
                <TimelineItem key={con.id} consultation={con} patient={patient} doctor={doctor} prescriptionConfig={prescriptionConfig} chambers={chambers} onDelete={() => remove("consultations", con.id)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* NEW CONSULTATION FORM */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">New Consultation</h2>
        <p className="mt-1 text-sm text-muted">Fill in examination + prescription details for this visit.</p>

        {draftBanner === "show" && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
            <p className="flex-1 text-sm text-amber-800">You have an unsaved draft.</p>
            <button type="button" onClick={restoreDraft} className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700">Restore</button>
            <button type="button" onClick={discardDraft} className="text-xs font-medium text-amber-700 hover:underline">Discard</button>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs font-medium text-muted">Date</label>
              <input type="date" value={c.date} onChange={(e) => setC({ ...c, date: e.target.value })} className={`${inputClass} max-w-xs`} />
            </div>
            {chambers.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted">Chamber</label>
                <select value={c.chamberId || ""} onChange={(e) => setC({ ...c, chamberId: e.target.value })}
                  className={`${inputClass} max-w-xs`}>
                  {chambers.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Two-column prescription-style layout */}
          <div className="grid gap-4 lg:grid-cols-[38%_1fr]">
            {/* LEFT: Examination (mirrors printed prescription left side) */}
            <div className="space-y-3 rounded-lg border-l-4 border-brand bg-slate-50 p-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-brand">Chief Complaint</label>
                {c.chiefComplaint.map((v, i) => (
                  <div key={i} className="mt-1 flex gap-2">
                    <span className="mt-2 text-xs text-muted">•</span>
                    <input value={v} onChange={(e) => setComplaint(i, e.target.value)} className={inputClass} placeholder={`Complaint ${i + 1}`} />
                    {c.chiefComplaint.length > 1 && <button type="button" onClick={() => setC({ ...c, chiefComplaint: c.chiefComplaint.filter((_, idx) => idx !== i) })} className="text-xs text-red-600">✕</button>}
                  </div>
                ))}
                <button type="button" onClick={() => setC({ ...c, chiefComplaint: [...c.chiefComplaint, ""] })} className="mt-1 text-xs font-medium text-brand">+ Add</button>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-brand">History</label>
                <textarea value={c.history} onChange={(e) => setC({ ...c, history: e.target.value })} rows={2} className={`${inputClass} mt-1`} placeholder="Vaccination, allergy..." />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-brand">On Examination</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <input value={c.vitals.bp} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, bp: e.target.value } })} className={inputClass} placeholder="BP: 120/80" />
                  <input value={c.vitals.pulse} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, pulse: e.target.value } })} className={inputClass} placeholder="Pulse: 72" />
                  <input value={c.vitals.weight} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, weight: e.target.value } })} className={inputClass} placeholder="Wt: 71 kg" />
                  <input value={c.vitals.spo2} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, spo2: e.target.value } })} className={inputClass} placeholder="SpO2: 99%" />
                  <input value={c.vitals.temperature} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, temperature: e.target.value } })} className={inputClass} placeholder="Temp: 98.6°F" />
                  <input value={c.vitals.others} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, others: e.target.value } })} className={inputClass} placeholder="Lungs: Clear" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-brand">Diagnosis</label>
                {c.diagnosis.map((v, i) => (
                  <div key={i} className="mt-1 flex gap-2">
                    <span className="mt-2 text-xs text-muted">•</span>
                    <input value={v} onChange={(e) => setDiagnosis(i, e.target.value)} className={inputClass} placeholder={`Diagnosis ${i + 1}`} />
                    {c.diagnosis.length > 1 && <button type="button" onClick={() => setC({ ...c, diagnosis: c.diagnosis.filter((_, idx) => idx !== i) })} className="text-xs text-red-600">✕</button>}
                  </div>
                ))}
                <button type="button" onClick={() => setC({ ...c, diagnosis: [...c.diagnosis, ""] })} className="mt-1 text-xs font-medium text-brand">+ Add</button>
              </div>
            </div>

            {/* RIGHT: Prescription Rx (mirrors printed prescription right side) */}
            <div className="space-y-3 rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xl font-bold text-brand">Rx,</span>
              </div>

              <div className="space-y-2">
                {c.medicines.map((med, i) => (
                  <MedicineInput key={i} index={i} entry={med}
                    onChange={(m) => setC({ ...c, medicines: c.medicines.map((x, idx) => idx === i ? m : x) })}
                    onRemove={() => setC({ ...c, medicines: c.medicines.filter((_, idx) => idx !== i) })}
                    onAdviceAdd={(advice) => {
                      if (!c.advices.includes(advice)) {
                        setC((prev) => ({ ...prev, advices: [...prev.advices.filter(Boolean), advice] }));
                      }
                    }}
                  />
                ))}
                <button type="button" onClick={() => setC({ ...c, medicines: [...c.medicines, { ...emptyMed }] })}
                  className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-brand hover:border-brand hover:bg-brand-light/20">
                  + Add medicine
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="text-xs font-bold uppercase tracking-wide text-brand">Advices</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {prescriptionConfig.predefinedAdvices.slice(0, 8).map((adv) => {
                    const added = c.advices.includes(adv);
                    return (
                      <button key={adv} type="button"
                        onClick={() => { if (!added) setC({ ...c, advices: [...c.advices.filter(Boolean), adv] }); }}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${added ? "bg-brand text-white" : "bg-slate-100 text-ink hover:bg-brand-light"}`}>
                        {added ? "✓" : "+"} {adv.slice(0, 20)}{adv.length > 20 ? "…" : ""}
                      </button>
                    );
                  })}
                </div>
                {c.advices.map((v, i) => (
                  <div key={i} className="mt-1 flex gap-2">
                    <span className="mt-2 text-xs text-muted">{i + 1}.</span>
                    <input value={v} onChange={(e) => setAdvice(i, e.target.value)} className={inputClass} placeholder="Advice" />
                    <button type="button" onClick={() => setC({ ...c, advices: c.advices.filter((_, idx) => idx !== i) })} className="text-xs text-red-600">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => setC({ ...c, advices: [...c.advices, ""] })} className="mt-1 text-xs font-medium text-brand">+ Custom</button>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="text-xs font-bold uppercase tracking-wide text-brand">Follow-up</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {prescriptionConfig.followUpOptions.slice(0, 6).map((opt) => (
                    <button key={opt} type="button" onClick={() => setC({ ...c, followUp: opt })}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${c.followUp === opt ? "bg-brand text-white" : "bg-slate-100 text-ink hover:bg-brand-light"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                <input value={c.followUp} onChange={(e) => setC({ ...c, followUp: e.target.value })} className={`${inputClass} mt-1`} placeholder="Or type custom..." />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="text-xs font-medium text-muted">Notes</label>
                <textarea value={c.notes} onChange={(e) => setC({ ...c, notes: e.target.value })} rows={2} className={inputClass} />
                <div className="mt-2">
                  <AttachmentField value={c.attachment ?? ""} onChange={(url) => setC({ ...c, attachment: url })} />
                </div>
              </div>
            </div>
          </div>

          <button type="button" disabled={pending || c.medicines.length === 0}
            onClick={() => addAndClearDraft("consultations", { ...c, chiefComplaint: c.chiefComplaint.filter(Boolean), diagnosis: c.diagnosis.filter(Boolean), advices: c.advices.filter(Boolean) }, resetConsultation)}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50">
            Save Consultation
          </button>
        </div>
      </section>

      {/* TEST REPORTS */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Test Report Results</h2>
        <div className="mt-4 space-y-3">
          {patient.testReports.length === 0 && <p className="text-sm text-muted">No test reports yet.</p>}
          {patient.testReports.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-xs font-medium text-brand">{r.date}</p>
                <p className="mt-1 text-sm font-medium text-ink">{r.title}</p>
                {r.result && <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{r.result}</p>}
                {r.attachment && <a href={r.attachment} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-brand underline">View file</a>}
              </div>
              <button type="button" onClick={() => remove("testReports", r.id)} className="text-xs font-medium text-red-600 hover:underline">Delete</button>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3 rounded-lg border border-dashed border-slate-300 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="text-xs font-medium text-muted">Date</label><input type="date" value={report.date} onChange={(e) => setReport({ ...report, date: e.target.value })} className={inputClass} /></div>
            <div><label className="text-xs font-medium text-muted">Test Title</label><input value={report.title} onChange={(e) => setReport({ ...report, title: e.target.value })} className={inputClass} placeholder="e.g. CBC, PFT" /></div>
          </div>
          <div><label className="text-xs font-medium text-muted">Result</label><textarea value={report.result} onChange={(e) => setReport({ ...report, result: e.target.value })} rows={2} className={inputClass} /></div>
          <AttachmentField value={report.attachment} onChange={(url) => setReport({ ...report, attachment: url })} />
          <button type="button" disabled={pending || !report.title.trim()} onClick={() => add("testReports", report, () => setReport({ date: today(), title: "", result: "", attachment: "" }))}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50">
            Add Test Report
          </button>
        </div>
      </section>

      {/* Timing datalist for medicine inputs */}
      <datalist id="timing-options">
        {prescriptionConfig.timingOptions.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>
  );
}
