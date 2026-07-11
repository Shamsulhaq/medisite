"use client";

import { useState, useRef } from "react";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function DiagnosisAutocomplete({
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const filtered = value.trim()
    ? suggestions.filter((s) =>
        s.toLowerCase().startsWith(value.toLowerCase()) ||
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
    : [];

  function handleChange(v: string) {
    onChange(v);
    setShowDropdown(v.trim().length > 0 && filtered.length > 0);
  }

  function handleSelect(item: string) {
    onChange(item);
    setShowDropdown(false);
  }

  function handleBlur() {
    timerRef.current = setTimeout(() => setShowDropdown(false), 200);
  }

  function handleFocus() {
    if (value.trim() && filtered.length > 0) setShowDropdown(true);
  }

  // Recompute filtered for display (since value might have changed)
  const displayFiltered = value.trim()
    ? suggestions.filter((s) =>
        s.toLowerCase().startsWith(value.toLowerCase()) ||
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={inputClass}
        placeholder={placeholder || "Diagnosis"}
      />
      {showDropdown && displayFiltered.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {displayFiltered.map((item) => (
            <button
              key={item}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item)}
              className="block w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-brand-light hover:text-brand-dark"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
