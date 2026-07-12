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
import AdviceSelector from "@/components/admin/AdviceSelector";

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
  adviceSuggestions = [],
}: {
  value: PrescriptionTemplate;
  onChange: (t: PrescriptionTemplate) => void;
  diagnosisSuggestions?: string[];
  adviceSuggestions?: string[];
}) {
  const setMedicine = (i: number, m: MedicineEntry) =>
    onChange({ ...value, medicines: value.medicines.map((x, idx) => (idx === i ? m : x)) });
  const addMedicine = () => onChange({ ...value, medicines: [...value.medicines, { ...emptyMed }] });
  const removeMedicine = (i: number) =>
    onChange({ ...value, medicines: value.medicines.filter((_, idx) => idx !== i) });

  // MedicineInput calls this when a picked medicine has a default advice.
  const addAdviceText = (advice: string) => {
    const a = advice.trim();
    if (!a || value.advices.some((x) => x.toLowerCase() === a.toLowerCase())) return;
    onChange({ ...value, advices: [...value.advices, a] });
  };

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
        <AdviceSelector
          value={value.advices}
          onChange={(advices) => onChange({ ...value, advices })}
          predefined={adviceSuggestions}
        />
      </div>
    </div>
  );
}
