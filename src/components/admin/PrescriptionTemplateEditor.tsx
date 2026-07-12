"use client";

// -----------------------------------------------------------------------------
// Editor for a single disease-based prescription template. Reuses the SAME
// shared building blocks as the consultation form (MedicineInput,
// DiagnosisAutocomplete) so behaviour and features stay consistent.
// -----------------------------------------------------------------------------

import type { PrescriptionTemplate, PrescriptionTemplateMedicine } from "@/lib/types";
import type { MedicineEntry } from "@/lib/patients";
import MedicineInput from "@/components/admin/MedicineInput";
import DiagnosisAutocomplete from "@/components/admin/DiagnosisAutocomplete";

export const TEMPLATE_AGE_GROUPS = ["", "Infant", "Child", "Teen", "Adult", "Elderly"];

const control =
  "w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

const emptyMed: PrescriptionTemplateMedicine = {
  name: "", generic: "", type: "brand", form: "", dosage: "",
  frequency: "", timing: "", duration: "", specialNote: "",
};

export default function PrescriptionTemplateEditor({
  value,
  onChange,
  diagnosisSuggestions = [],
}: {
  value: PrescriptionTemplate;
  onChange: (t: PrescriptionTemplate) => void;
  diagnosisSuggestions?: string[];
}) {
  const setMedicine = (i: number, m: MedicineEntry) =>
    onChange({ ...value, medicines: value.medicines.map((x, idx) => (idx === i ? m : x)) });
  const addMedicine = () => onChange({ ...value, medicines: [...value.medicines, { ...emptyMed }] });
  const removeMedicine = (i: number) =>
    onChange({ ...value, medicines: value.medicines.filter((_, idx) => idx !== i) });

  // Adds an advice (used both by the "Add advice" button and by MedicineInput's
  // default-advice callback, matching the consultation form).
  const addAdviceText = (advice: string) => {
    const a = advice.trim();
    if (!a || value.advices.some((x) => x.toLowerCase() === a.toLowerCase())) return;
    onChange({ ...value, advices: [...value.advices, a] });
  };
  const setAdvice = (i: number, v: string) =>
    onChange({ ...value, advices: value.advices.map((x, idx) => (idx === i ? v : x)) });
  const addAdviceRow = () => onChange({ ...value, advices: [...value.advices, ""] });
  const removeAdvice = (i: number) =>
    onChange({ ...value, advices: value.advices.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          <span>Template name</span>
          <input
            type="text"
            value={value.name}
            placeholder="e.g. Fever (Child)"
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            className={control}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          <span>Diagnosis / disease (match key)</span>
          <DiagnosisAutocomplete
            value={value.diagnosis}
            onChange={(v) => onChange({ ...value, diagnosis: v })}
            suggestions={diagnosisSuggestions}
            placeholder="e.g. Fever"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          <span>Age group</span>
          <select
            value={value.ageGroup}
            onChange={(e) => onChange({ ...value, ageGroup: e.target.value })}
            className={control}
          >
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
            <MedicineInput
              key={i}
              index={i}
              entry={m}
              onChange={(nm) => setMedicine(i, nm)}
              onRemove={() => removeMedicine(i)}
              onAdviceAdd={addAdviceText}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addMedicine}
          className="mt-2 text-sm font-medium text-brand hover:text-brand-dark"
        >
          + Add medicine
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Advices</p>
        <div className="space-y-2">
          {value.advices.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={a}
                placeholder="Advice…"
                onChange={(e) => setAdvice(i, e.target.value)}
                className={control}
              />
              <button
                type="button"
                onClick={() => removeAdvice(i)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addAdviceRow}
          className="mt-2 text-sm font-medium text-brand hover:text-brand-dark"
        >
          + Add advice
        </button>
      </div>
    </div>
  );
}
