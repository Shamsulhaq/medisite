"use client";

import type { LocalizedString } from "@/lib/i18n";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

function LangTag({ children }: { children: string }) {
  return (
    <span className="mb-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </span>
  );
}

export function LocalizedField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: LocalizedString;
  onChange: (v: LocalizedString) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        <div>
          <LangTag>EN</LangTag>
          <input
            value={value.en}
            placeholder={placeholder}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <LangTag>বাংলা</LangTag>
          <input
            value={value.bn}
            placeholder={placeholder}
            onChange={(e) => onChange({ ...value, bn: e.target.value })}
            className={inputClass}
            dir="auto"
          />
        </div>
      </div>
    </div>
  );
}

export function LocalizedArea({
  label,
  value,
  onChange,
  rows = 3,
  hint,
  placeholder,
}: {
  label: string;
  value: LocalizedString;
  onChange: (v: LocalizedString) => void;
  rows?: number;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        <div>
          <LangTag>EN</LangTag>
          <textarea
            value={value.en}
            rows={rows}
            placeholder={placeholder}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <LangTag>বাংলা</LangTag>
          <textarea
            value={value.bn}
            rows={rows}
            placeholder={placeholder}
            onChange={(e) => onChange({ ...value, bn: e.target.value })}
            className={inputClass}
            dir="auto"
          />
        </div>
      </div>
    </div>
  );
}
