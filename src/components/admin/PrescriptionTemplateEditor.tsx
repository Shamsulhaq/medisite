"use client";

import { useEffect, useRef, useState } from "react";
import type { PrescriptionTemplate, PrescriptionTemplateMedicine } from "@/lib/types";
import type { MedicineRef } from "@/lib/medicines";
import { FREQUENCIES, DURATIONS, FORMS } from "@/lib/medicines";

export const TEMPLATE_AGE_GROUPS = ["", "Infant", "Child", "Teen", "Adult", "Elderly"];

const control =
  "w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

const emptyMed: PrescriptionTemplateMedicine = {
  name: "", generic: "", type: "brand", form: "", dosage: "",
  frequency: "", timing: "", duration: "", specialNote: "",
};

// ---- One medicine row with name autocomplete -------------------------------
function MedicineRow({
  value,
  onChange,
  onRemove,
}: {
  value: PrescriptionTemplateMedicine;
  onChange: (m: PrescriptionTemplateMedicine) => void;
  onRemove: () => void;
}) {
  const [q, setQ] = useState(value.name);
  const [suggestions, setSuggestions] = useState<MedicineRef[]>([]);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setQ(value.name), [value.name]);

  const search = (val: string) => {
    setQ(val);
    onChange({ ...value, name: val });
    if (timer.current) clearTimeout(timer.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/medicines?q=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          setSuggestions(await res.json());
          setShow(true);
        }
      } catch {
        /* ignore */
      }
    }, 250);
  };

  const pick = (m: MedicineRef) => {
    onChange({
      ...value,
      name: m.generic,
      generic: m.generic,
      type: "generic",
      form: value.form || m.forms[0] || "Tablet",
      dosage: value.dosage || m.dosages[0] || "",
    });
    setQ(m.generic);
    setShow(false);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={q}
            placeholder="Medicine name…"
            onChange={(e) => search(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShow(true)}
            onBlur={() => setTimeout(() => setShow(false), 200)}
            className={control}
          />
          {show && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {suggestions.map((m) => (
                <li key={m.generic}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(m)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="font-medium text-ink">{m.generic}</span>
                    {m.brands[0] && <span className="text-xs text-muted">{m.brands[0]}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 text-xs font-medium text-red-600 hover:underline"
        >
          Remove
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <select value={value.form} onChange={(e) => onChange({ ...value, form: e.target.value })} className={control}>
          <option value="">Form</option>
          {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <input type="text" value={value.dosage} placeholder="Dosage (e.g. 500mg)"
          onChange={(e) => onChange({ ...value, dosage: e.target.value })} className={control} />
        <select value={value.frequency} onChange={(e) => onChange({ ...value, frequency: e.target.value })} className={control}>
          <option value="">Frequency</option>
          {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <input type="text" value={value.timing} placeholder="Timing (e.g. After meal)"
          onChange={(e) => onChange({ ...value, timing: e.target.value })} className={control} />
        <select value={value.duration} onChange={(e) => onChange({ ...value, duration: e.target.value })} className={control}>
          <option value="">Duration</option>
          {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="text" value={value.specialNote} placeholder="Note (optional)"
          onChange={(e) => onChange({ ...value, specialNote: e.target.value })} className={control} />
      </div>
    </div>
  );
}

// ---- Full template editor --------------------------------------------------
export default function PrescriptionTemplateEditor({
  value,
  onChange,
}: {
  value: PrescriptionTemplate;
  onChange: (t: PrescriptionTemplate) => void;
}) {
  const setMedicine = (i: number, m: PrescriptionTemplateMedicine) =>
    onChange({ ...value, medicines: value.medicines.map((x, idx) => (idx === i ? m : x)) });
  const addMedicine = () => onChange({ ...value, medicines: [...value.medicines, { ...emptyMed }] });
  const removeMedicine = (i: number) =>
    onChange({ ...value, medicines: value.medicines.filter((_, idx) => idx !== i) });

  const setAdvice = (i: number, v: string) =>
    onChange({ ...value, advices: value.advices.map((x, idx) => (idx === i ? v : x)) });
  const addAdvice = () => onChange({ ...value, advices: [...value.advices, ""] });
  const removeAdvice = (i: number) =>
    onChange({ ...value, advices: value.advices.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          <span>Template name</span>
          <input type="text" value={value.name} placeholder="e.g. Fever (Child)"
            onChange={(e) => onChange({ ...value, name: e.target.value })} className={control} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          <span>Diagnosis / disease (match key)</span>
          <input type="text" value={value.diagnosis} placeholder="e.g. Fever"
            onChange={(e) => onChange({ ...value, diagnosis: e.target.value })} className={control} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          <span>Age group</span>
          <select value={value.ageGroup} onChange={(e) => onChange({ ...value, ageGroup: e.target.value })} className={control}>
            {TEMPLATE_AGE_GROUPS.map((g) => (
              <option key={g || "any"} value={g}>{g || "Any age"}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Medicines</p>
        <div className="space-y-2">
          {value.medicines.map((m, i) => (
            <MedicineRow key={i} value={m} onChange={(nm) => setMedicine(i, nm)} onRemove={() => removeMedicine(i)} />
          ))}
        </div>
        <button type="button" onClick={addMedicine}
          className="mt-2 text-sm font-medium text-brand hover:text-brand-dark">+ Add medicine</button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Advices</p>
        <div className="space-y-2">
          {value.advices.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="text" value={a} placeholder="Advice…"
                onChange={(e) => setAdvice(i, e.target.value)} className={control} />
              <button type="button" onClick={() => removeAdvice(i)}
                className="text-xs font-medium text-red-600 hover:underline">Remove</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addAdvice}
          className="mt-2 text-sm font-medium text-brand hover:text-brand-dark">+ Add advice</button>
      </div>
    </div>
  );
}
