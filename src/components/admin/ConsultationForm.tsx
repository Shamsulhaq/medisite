"use client";

import { useEffect, useRef, useState } from "react";
import type { Patient, Consultation, MedicineEntry, RecordKind } from "@/lib/patients";
import type { PrescriptionConfig, Chamber, Appointment, PrescriptionTemplate } from "@/lib/types";
import type { MedicineRef } from "@/lib/medicines";
import { FREQUENCIES, DURATIONS, FORMS, shortForm } from "@/lib/medicines";
import DiagnosisAutocomplete from "@/components/admin/DiagnosisAutocomplete";
import InvestigationAutocomplete from "@/components/admin/InvestigationAutocomplete";
import { generateConsultationHtml, printConsultation, type DoctorInfo } from "@/lib/prescription-pdf";
import { useToast } from "@/components/admin/ToastProvider";
import { clearPendingVitalsAction } from "@/app/admin/patient-actions";
import ButtonSpinner from "@/components/admin/ButtonSpinner";
import QRUploadModal from "@/components/admin/QRUploadModal";

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
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
        {uploading ? "Uploading…" : "Attach"}
      </button>
      {value && (
        <span className="flex items-center gap-2 text-xs text-muted">
          <a href={value} target="_blank" rel="noreferrer" className="text-brand underline">View</a>
          <button type="button" onClick={() => onChange("")} className="text-red-600 font-medium hover:underline">remove</button>
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
  const [highlighted, setHighlighted] = useState(-1);
  const [availDosages, setAvailDosages] = useState<string[]>([]);
  const [availForms, setAvailForms] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userTypingRef = useRef(true);
  const deletingRef = useRef(false);
  const inlineSuggestionRef = useRef<{ name: string; med: MedicineRef; type: "generic" | "brand" } | null>(null);

  // Flatten suggestions: generics + their top brands
  const flatItems: { med: MedicineRef; name: string; type: "generic" | "brand" }[] = [];
  const ql = query.toLowerCase();
  // Collect all matching brands across all suggestions
  const allMatchingBrands: { med: MedicineRef; name: string }[] = [];
  const allGenerics: { med: MedicineRef; name: string }[] = [];
  for (const s of suggestions) {
    allGenerics.push({ med: s, name: s.generic });
    for (const b of s.brands) {
      if (b.toLowerCase().startsWith(ql)) {
        allMatchingBrands.push({ med: s, name: b });
      }
    }
  }
  // Sort matching brands: exact match first, then shorter names first (most relevant)
  allMatchingBrands.sort((a, b) => {
    const aExact = a.name.toLowerCase() === ql ? 0 : 1;
    const bExact = b.name.toLowerCase() === ql ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.name.length - b.name.length;
  });
  // Build flat list: matching brands first, then generics with their other brands
  for (const item of allMatchingBrands.slice(0, 8)) {
    flatItems.push({ med: item.med, name: item.name, type: "brand" });
  }
  for (const g of allGenerics) {
    flatItems.push({ med: g.med, name: g.name, type: "generic" });
    // Add a few non-matching brands for context
    const others = g.med.brands.filter((b) => !b.toLowerCase().startsWith(ql)).slice(0, 2);
    for (const b of others) {
      flatItems.push({ med: g.med, name: b, type: "brand" });
    }
    if (flatItems.length > 25) break;
  }

  // Find the best inline suggestion (first brand that starts with query)
  function getInlineSuggestion(q: string): { med: MedicineRef; name: string; type: "generic" | "brand" } | null {
    if (!q) return null;
    const ql = q.toLowerCase();
    for (const item of flatItems) {
      if (item.name.toLowerCase().startsWith(ql)) return item;
    }
    return null;
  }

  function handleSearch(v: string) {
    userTypingRef.current = true;
    inlineSuggestionRef.current = null;
    setQuery(v);
    onChange({ ...entry, name: v });
    if (timerRef.current) clearTimeout(timerRef.current);
    if (v.length < 1) { setSuggestions([]); setShowSugg(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/medicines?q=${encodeURIComponent(v)}`);
        const data: MedicineRef[] = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setShowSugg(data.length > 0);

        // Inline autofill: find best match and set selection range
        if (data.length > 0 && inputRef.current && userTypingRef.current && !deletingRef.current) {
          const ql = v.toLowerCase();
          // Collect ALL matching brands across all results, sort by best match
          const candidates: { name: string; med: MedicineRef; type: "brand" | "generic" }[] = [];
          for (const m of data) {
            for (const b of m.brands) {
              if (b.toLowerCase().startsWith(ql)) candidates.push({ name: b, med: m, type: "brand" });
            }
            if (m.generic.toLowerCase().startsWith(ql)) candidates.push({ name: m.generic, med: m, type: "generic" });
          }
          // Sort: exact match first, then shortest name (most specific)
          candidates.sort((a, b) => {
            const aExact = a.name.toLowerCase() === ql ? 0 : 1;
            const bExact = b.name.toLowerCase() === ql ? 0 : 1;
            if (aExact !== bExact) return aExact - bExact;
            return a.name.length - b.name.length;
          });
          const best = candidates[0];
          if (best && best.name.toLowerCase() !== ql) {
            const newVal = v + best.name.slice(v.length);
            setQuery(newVal);
            inlineSuggestionRef.current = { name: best.name, med: best.med, type: best.type };
            requestAnimationFrame(() => {
              inputRef.current?.setSelectionRange(v.length, newVal.length);
            });
          } else if (best) {
            inlineSuggestionRef.current = { name: best.name, med: best.med, type: best.type };
          } else {
            inlineSuggestionRef.current = null;
          }
          setHighlighted(0);
        }
      } catch { setSuggestions([]); }
    }, 80);
  }

  function pick(med: MedicineRef, name: string, type: "generic" | "brand") {
    userTypingRef.current = false;
    const autoForm = med.forms[0] || "";
    setAvailDosages(med.dosages);
    setAvailForms(med.forms);
    onChange({
      ...entry, name, generic: med.generic, type, form: autoForm,
      dosage: med.dosages.length === 1 ? med.dosages[0] : entry.dosage,
    });
    setQuery(name);
    setShowSugg(false);
    setSuggestions([]);
    if (med.defaultAdvice && onAdviceAdd) onAdviceAdd(med.defaultAdvice);
  }

  function acceptInline() {
    // Accept whatever is in the input (including the auto-completed part)
    if (inlineSuggestionRef.current) {
      const { med, name, type } = inlineSuggestionRef.current;
      pick(med, name, type);
      inlineSuggestionRef.current = null;
      return;
    }
    const current = query;
    const match = flatItems.find((item) => item.name.toLowerCase() === current.toLowerCase());
    if (match) {
      pick(match.med, match.name, match.type);
    } else {
      setShowSugg(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Backspace" || e.key === "Delete") {
      deletingRef.current = true;
      return;
    }
    deletingRef.current = false;
    if (e.key === "Tab" || (e.key === "Enter" && highlighted < 0)) {
      // Accept inline suggestion
      if (inlineSuggestionRef.current) {
        e.preventDefault();
        const { med, name, type } = inlineSuggestionRef.current;
        pick(med, name, type);
        inlineSuggestionRef.current = null;
        return;
      }
      if (showSugg && query) {
        const match = flatItems.find((item) => item.name.toLowerCase() === query.toLowerCase());
        if (match) {
          e.preventDefault();
          pick(match.med, match.name, match.type);
          return;
        }
      }
      if (e.key === "Enter") { e.preventDefault(); acceptInline(); }
      return;
    }
    if (!showSugg || flatItems.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? flatItems.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      const item = flatItems[highlighted];
      pick(item.med, item.name, item.type);
    } else if (e.key === "Escape") {
      setShowSugg(false);
    }
  }

  const expanded = entry.name.trim().length > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted">{index + 1}.</span>
        <button type="button" onClick={onRemove} className="text-xs text-red-600 font-medium hover:underline">Remove</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_120px_120px]">
        <div className="relative">
          <input ref={inputRef} value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (suggestions.length) setShowSugg(true); }}
            onBlur={() => setTimeout(() => setShowSugg(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Type medicine name..."
            autoComplete="off"
            className={inputClass} />
          {showSugg && flatItems.length > 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-56 max-w-full overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              {flatItems.map((item, i) => (
                <button key={`${item.name}-${i}`} type="button"
                  onClick={() => pick(item.med, item.name, item.type)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition ${
                    i === highlighted ? "bg-brand-light text-brand-dark" : "hover:bg-slate-50"
                  } ${item.type === "generic" ? "font-medium text-ink" : "text-muted pl-5"}`}>
                  <span>{item.name}</span>
                  {item.type === "generic" && <span className="ml-auto text-xs text-muted">{shortForm(item.med.forms[0] || "")} {item.med.dosages[0] || ""}</span>}
                  {item.type === "brand" && <span className="ml-auto text-xs text-slate-400">{item.med.generic}</span>}
                </button>
              ))}
              <div className="border-t border-slate-100 px-3 py-1 text-[10px] text-slate-400">↑↓ navigate · Enter/Tab accept · Esc close</div>
            </div>
          )}
        </div>
        <select value={entry.form} onChange={(e) => onChange({ ...entry, form: e.target.value })} className={inputClass}>
          <option value="">Form</option>
          {(availForms.length > 0 ? availForms : FORMS).map((f) => <option key={f} value={f}>{shortForm(f)} ({f})</option>)}
          {availForms.length > 0 && <optgroup label="All forms">{FORMS.filter((f) => !availForms.includes(f)).map((f) => <option key={f} value={f}>{shortForm(f)} ({f})</option>)}</optgroup>}
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
      {/* Progressive disclosure: frequency, timing, duration, special note */}
      <div
        className={`grid gap-2 sm:grid-cols-3 overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
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
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <input value={entry.specialNote} onChange={(e) => onChange({ ...entry, specialNote: e.target.value })}
          className={inputClass} placeholder="Special note (optional)" />
      </div>
    </div>
  );
}
export default function ConsultationForm({ patient, doctor, prescriptionConfig, chambers, appointments, pending, feeStructure, onSave }: {
  patient: Patient;
  doctor: DoctorInfo;
  prescriptionConfig: PrescriptionConfig;
  chambers: Chamber[];
  appointments: Appointment[];
  pending: boolean;
  feeStructure?: { firstVisit: number; within7Days: number; within30Days: number; after30Days: number };
  onSave: (kind: RecordKind, data: object, reset: () => void) => void;
  editingConsultation?: Consultation | null;
}) {
  const { toast } = useToast();
  const [customAdviceInput, setCustomAdviceInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const todayDate = today();
  const patientAppointment = appointments.find(
    (a) =>
      a.phone.replace(/[\s\-()]/g, "") === patient.phone.replace(/[\s\-()]/g, "") &&
      a.date === todayDate &&
      a.mode === "offline"
  );
  const autoChamberId = patientAppointment
    ? chambers.find((ch) => ch.name === patientAppointment.location)?.id || chambers[0]?.id || ""
    : chambers[0]?.id || "";

  const emptyMed: MedicineEntry = { name: "", generic: "", type: "brand", form: "", dosage: "", frequency: "", timing: "", duration: "", specialNote: "" };

  const lastC = patient.consultations[0];
  const initialConsultation: Omit<Consultation, "id"> = lastC
    ? {
        date: todayDate,
        chamberId: autoChamberId,
        vitals: { ...lastC.vitals },
        chiefComplaint: [...lastC.chiefComplaint],
        history: lastC.history,
        onExamination: lastC.onExamination,
        diagnosis: [...lastC.diagnosis],
        medicines: lastC.medicines.map((m) => ({ ...m })),
        investigations: [...(lastC.investigations || [])],
        investigationDiscount: lastC.investigationDiscount ?? 0,
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
        investigations: [],
        investigationDiscount: 0,
        followUp: "",
        notes: "",
        attachment: "",
      };

  const [c, setC] = useState<Omit<Consultation, "id">>(() => {
    const base = initialConsultation;
    // Pre-fill vitals from pending vitals if available
    const pv = patient.pendingVitals;
    if (pv && (pv.bp || pv.weight)) {
      base.vitals = {
        bp: pv.bp || base.vitals.bp,
        pulse: pv.pulse || base.vitals.pulse,
        weight: pv.weight || base.vitals.weight,
        spo2: pv.spo2 || base.vitals.spo2,
        temperature: pv.temperature || base.vitals.temperature,
        others: base.vitals.others,
      };
      if (pv.complaint && base.chiefComplaint[0] === "") {
        base.chiefComplaint = [pv.complaint];
      }
    }
    return base;
  });
  const hasPendingVitals = !!(patient.pendingVitals && (patient.pendingVitals.bp || patient.pendingVitals.weight));
  const [printing, setPrinting] = useState(false);
  const [showQRUpload, setShowQRUpload] = useState(false);

  const computedFee = (() => {
    if (!feeStructure) return 0;
    if (patient.consultations.length === 0) return feeStructure.firstVisit;
    const lastDate = new Date(patient.consultations[0].date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / 86400000);
    if (diffDays <= 7) return feeStructure.within7Days;
    if (diffDays <= 30) return feeStructure.within30Days;
    return feeStructure.after30Days;
  })();
  const [payment, setPayment] = useState<{ fee: number; received: number; discount: number; status: "paid" | "unpaid" | "partial" }>({
    fee: computedFee,
    received: computedFee,
    discount: 0,
    status: "paid",
  });

  const setComplaint = (i: number, v: string) => setC({ ...c, chiefComplaint: c.chiefComplaint.map((x, idx) => idx === i ? v : x) });
  const setDiagnosis = (i: number, v: string) => setC({ ...c, diagnosis: c.diagnosis.map((x, idx) => idx === i ? v : x) });

  function resetConsultation() {
    setC({
      date: today(),
      vitals: { bp: "", pulse: "", weight: "", spo2: "", temperature: "", others: "" },
      chiefComplaint: [""], history: "", onExamination: "", diagnosis: [""],
      medicines: [{ ...emptyMed }], investigations: [], investigationDiscount: 0, advices: [], followUp: "", notes: "", attachment: "",
    });
  }

  // Draft auto-save
  const draftKey = `consultation-draft-${patient.id}`;
  const [draftBanner, setDraftBanner] = useState<"show" | "hidden">("hidden");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) setDraftBanner("show");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(c)); } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [c, draftKey]);

  function restoreDraft() {
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) setC(JSON.parse(stored));
    } catch {}
    setDraftBanner("hidden");
  }

  function discardDraft() {
    try { localStorage.removeItem(draftKey); } catch {}
    setDraftBanner("hidden");
  }

  function handleSave() {
    onSave("consultations", { ...c, chiefComplaint: c.chiefComplaint.filter(Boolean), diagnosis: c.diagnosis.filter(Boolean), advices: c.advices.filter(Boolean), payment }, async () => {
      resetConsultation();
      try { localStorage.removeItem(draftKey); } catch {}
      // Clear pending vitals if they existed
      if (hasPendingVitals) {
        try {
          await clearPendingVitalsAction(patient.id);
        } catch {}
      }
      // Visual success feedback
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
      toast("success", "Consultation saved successfully");
    });
  }

  function handlePreview() {
    const consultationData: Consultation = {
      id: "preview",
      ...c,
      chiefComplaint: c.chiefComplaint.filter(Boolean),
      diagnosis: c.diagnosis.filter(Boolean),
      advices: c.advices.filter(Boolean),
    };
    const chamberInfo = c.chamberId
      ? (() => { const ch = chambers.find((x) => x.id === c.chamberId); return ch ? { name: ch.name, address: ch.address, phone: ch.phone } : undefined; })()
      : undefined;
    const html = generateConsultationHtml(patient, consultationData, doctor, prescriptionConfig, chamberInfo);
    setPreviewHtml(html);
    setShowPreviewModal(true);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "s") {
        e.preventDefault();
        if (!pending && c.medicines.length > 0) handleSave();
      } else if (e.key === "p") {
        e.preventDefault();
        const lastConsultation = patient.consultations[0];
        if (lastConsultation) {
          setPrinting(true);
          const chamberInfo = lastConsultation.chamberId
            ? (() => { const ch = chambers.find((x) => x.id === lastConsultation.chamberId); return ch ? { name: ch.name, address: ch.address, phone: ch.phone } : undefined; })()
            : undefined;
          printConsultation(patient, lastConsultation, doctor, prescriptionConfig, chamberInfo);
          setTimeout(() => setPrinting(false), 1000);
        }
      } else if (e.key === "m") {
        e.preventDefault();
        setC((prev) => ({ ...prev, medicines: [...prev.medicines, { ...emptyMed }] }));
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, c]);

  return (
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

      {hasPendingVitals && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5">
          <span className="text-sm text-yellow-900 font-medium">
            Vitals recorded by {patient.pendingVitals!.recordedByName} at {new Date(patient.pendingVitals!.recordedAt).toLocaleTimeString()}:
          </span>
          <span className="text-sm text-yellow-800">
            {patient.pendingVitals!.bp && `BP ${patient.pendingVitals!.bp}`}
            {patient.pendingVitals!.spo2 && `, SpO₂ ${patient.pendingVitals!.spo2}`}
            {patient.pendingVitals!.weight && `, Wt ${patient.pendingVitals!.weight}`}
            {patient.pendingVitals!.temperature && `, Temp ${patient.pendingVitals!.temperature}`}
            {patient.pendingVitals!.pulse && `, Pulse ${patient.pendingVitals!.pulse}`}
          </span>
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
        <div className="grid gap-4 lg:grid-cols-[30%_1fr]">
          {/* LEFT: Examination */}
          <div className="space-y-3 rounded-lg border-l-4 border-brand bg-slate-50 p-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-brand">Chief Complaint</label>
              {c.chiefComplaint.map((v, i) => (
                <div key={i} className="mt-1 flex gap-2">
                  <span className="mt-2 text-xs text-muted">•</span>
                  <input value={v} onChange={(e) => setComplaint(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setC((prev) => ({ ...prev, chiefComplaint: [...prev.chiefComplaint, ""] })); setTimeout(() => { const inputs = document.querySelectorAll<HTMLInputElement>('[placeholder^="Complaint"]'); inputs[inputs.length - 1]?.focus(); }, 50); } }}
                    className={inputClass} placeholder={`Complaint ${i + 1}`} />
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
                  <DiagnosisAutocomplete value={v} onChange={(val) => setDiagnosis(i, val)} suggestions={prescriptionConfig.predefinedDiagnoses ?? []} placeholder={`Diagnosis ${i + 1}`}
                    onEnterAdd={() => { setC((prev) => ({ ...prev, diagnosis: [...prev.diagnosis, ""] })); setTimeout(() => { const inputs = document.querySelectorAll<HTMLInputElement>('[placeholder^="Diagnosis"]'); inputs[inputs.length - 1]?.focus(); }, 50); }}
                  />
                  {c.diagnosis.length > 1 && <button type="button" onClick={() => setC({ ...c, diagnosis: c.diagnosis.filter((_, idx) => idx !== i) })} className="text-xs text-red-600">✕</button>}
                </div>
              ))}
              <button type="button" onClick={() => setC({ ...c, diagnosis: [...c.diagnosis, ""] })} className="mt-1 text-xs font-medium text-brand">+ Add</button>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-brand">Investigation</label>
              {c.investigations.map((v, i) => (
                <div key={i} className="mt-1 flex gap-2">
                  <span className="mt-2 text-xs text-muted">{i + 1}.</span>
                  <InvestigationAutocomplete
                    value={v}
                    onChange={(val) => setC({ ...c, investigations: c.investigations.map((x, idx) => idx === i ? val : x) })}
                    placeholder="Test name (e.g. CBC, X-ray)"
                    onEnterAdd={() => { setC((prev) => ({ ...prev, investigations: [...prev.investigations, ""] })); setTimeout(() => { const inputs = document.querySelectorAll<HTMLInputElement>('[placeholder^="Test name"]'); inputs[inputs.length - 1]?.focus(); }, 50); }}
                  />
                  <button type="button" onClick={() => setC({ ...c, investigations: c.investigations.filter((_, idx) => idx !== i) })} className="text-xs text-red-600">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => setC({ ...c, investigations: [...c.investigations, ""] })} className="mt-1 text-xs font-medium text-brand">+ Add investigation</button>
              <div className="mt-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Discount %"
                  value={c.investigationDiscount || ""}
                  onChange={(e) => setC({ ...c, investigationDiscount: Number(e.target.value) || 0 })}
                  className={`${inputClass} max-w-[120px]`}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Prescription Rx */}
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
                className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-brand hover:border-brand hover:bg-brand-light/20 min-h-[44px]">
                + Add medicine
              </button>
            </div>

            {/* Investigations moved to left column */}

            <div className="border-t border-slate-100 pt-3">
              <label className="text-xs font-bold uppercase tracking-wide text-brand">Advices</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {prescriptionConfig.predefinedAdvices.map((adv) => {
                  const idx = c.advices.indexOf(adv);
                  const isSelected = idx >= 0;
                  return (
                    <button key={adv} type="button"
                      onClick={() => {
                        if (isSelected) {
                          setC({ ...c, advices: c.advices.filter((a) => a !== adv) });
                        } else {
                          setC({ ...c, advices: [...c.advices, adv] });
                        }
                      }}
                      className={`relative rounded-full px-3 py-1 text-xs font-medium transition ${isSelected ? "bg-brand text-white ring-2 ring-brand/30" : "bg-slate-100 text-ink hover:bg-brand-light"}`}>
                      {isSelected && (
                        <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-white">{idx + 1}</span>
                      )}
                      {adv.length > 25 ? adv.slice(0, 25) + "…" : adv}
                    </button>
                  );
                })}
              </div>
              {/* Show custom (non-predefined) selected advices */}
              {c.advices.filter((a) => !prescriptionConfig.predefinedAdvices.includes(a)).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.advices.filter((a) => !prescriptionConfig.predefinedAdvices.includes(a)).map((adv) => {
                    const idx = c.advices.indexOf(adv);
                    return (
                      <button key={adv} type="button"
                        onClick={() => setC({ ...c, advices: c.advices.filter((a) => a !== adv) })}
                        className="relative rounded-full bg-brand text-white ring-2 ring-brand/30 px-3 py-1 text-xs font-medium transition">
                        <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-white">{idx + 1}</span>
                        {adv.length > 25 ? adv.slice(0, 25) + "…" : adv}
                      </button>
                    );
                  })}
                </div>
              )}
              <input
                value={customAdviceInput}
                onChange={(e) => setCustomAdviceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customAdviceInput.trim()) {
                    e.preventDefault();
                    const val = customAdviceInput.trim();
                    if (!c.advices.includes(val)) {
                      setC({ ...c, advices: [...c.advices, val] });
                    }
                    setCustomAdviceInput("");
                  }
                }}
                className={`${inputClass} mt-2`}
                placeholder="Type custom advice + Enter"
              />
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
              <div className="mt-2 flex items-center gap-2">
                <AttachmentField value={c.attachment ?? ""} onChange={(url) => setC({ ...c, attachment: url })} />
                <button
                  type="button"
                  onClick={() => setShowQRUpload(true)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-slate-50"
                >
                  📱 Upload from Phone
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky save bar */}
        <div className="sticky bottom-0 inset-x-0 z-40 -mx-6 -mb-6 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
            <button type="button" disabled={pending || c.medicines.length === 0}
              onClick={handleSave}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed ${
                saveSuccess ? "bg-green-600 hover:bg-green-700" : "bg-brand hover:bg-brand-dark"
              }`}>
              {saveSuccess ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Saved!
                </>
              ) : (
                <>
                  {pending && <ButtonSpinner />}
                  {pending ? "Saving…" : "Save Consultation"}
                </>
              )}
            </button>

            <button type="button" onClick={handlePreview} disabled={c.medicines.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50 disabled:opacity-50 min-h-[44px]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Preview
            </button>

            {feeStructure && (
              <div className="hidden sm:inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted">Fee:</label>
                  <input type="number" value={payment.fee} onChange={(e) => setPayment({ ...payment, fee: Number(e.target.value) })}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-xs" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted">Received:</label>
                  <input type="number" value={payment.received} onChange={(e) => setPayment({ ...payment, received: Number(e.target.value) })}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-xs" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted">Discount:</label>
                  <input type="number" value={payment.discount} onChange={(e) => setPayment({ ...payment, discount: Number(e.target.value) })}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-xs" />
                </div>
                <select value={payment.status} onChange={(e) => setPayment({ ...payment, status: e.target.value as "paid" | "unpaid" | "partial" })}
                  className="rounded border border-slate-300 px-2 py-1 text-xs min-h-[44px] lg:min-h-0">
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
            )}

            <p className="hidden sm:block text-xs text-muted ml-auto">⌘/Ctrl+S Save | ⌘/Ctrl+P Print | ⌘/Ctrl+M Add medicine</p>
          </div>
        </div>
      </div>

      {/* Timing datalist */}
      <datalist id="timing-options">
        {prescriptionConfig.timingOptions.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      {/* Prescription Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-0 lg:p-6" onClick={() => setShowPreviewModal(false)}>
          <div className="relative flex h-full w-full flex-col overflow-hidden bg-white lg:h-[90vh] lg:max-h-[900px] lg:w-full lg:max-w-4xl lg:rounded-xl lg:shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 lg:px-6">
              <h3 className="text-base font-semibold text-ink">Prescription Preview</h3>
              <div className="flex items-center gap-2">
                <button type="button"
                  onClick={() => {
                    const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement;
                    if (iframe?.contentWindow) {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark min-h-[44px]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print
                </button>
                <button type="button" onClick={() => setShowPreviewModal(false)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-ink transition hover:bg-slate-50 min-h-[44px]">
                  Close
                </button>
              </div>
            </div>
            {/* Modal body: iframe with prescription HTML */}
            <div className="flex-1 overflow-auto bg-slate-100 p-2 lg:p-4">
              <iframe
                id="preview-iframe"
                srcDoc={previewHtml}
                className="h-full w-full rounded border border-slate-200 bg-white"
                title="Prescription Preview"
                style={{ minHeight: "600px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* QR Upload Modal */}
      {showQRUpload && (
        <QRUploadModal
          patientId={patient.id}
          targetType="attachment"
          onComplete={(files) => {
            if (files.length > 0) {
              setC({ ...c, attachment: files[0] });
            }
            setShowQRUpload(false);
          }}
          onClose={() => setShowQRUpload(false)}
        />
      )}
    </section>
  );
}
