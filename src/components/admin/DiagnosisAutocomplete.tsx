"use client";

import { useState, useRef } from "react";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function DiagnosisAutocomplete({
  value,
  onChange,
  suggestions,
  placeholder,
  onEnterAdd,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  onEnterAdd?: () => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const filtered = value.trim()
    ? suggestions.filter((s) =>
        s.toLowerCase().startsWith(value.toLowerCase()) ||
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10)
    : [];

  function handleChange(v: string) {
    onChange(v);
    setHighlighted(-1);
    setShowDropdown(v.trim().length > 0);
  }

  function handleSelect(item: string) {
    onChange(item);
    setShowDropdown(false);
    setHighlighted(-1);
  }

  function handleBlur() {
    timerRef.current = setTimeout(() => setShowDropdown(false), 200);
  }

  function handleFocus() {
    if (value.trim() && filtered.length > 0) setShowDropdown(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || filtered.length === 0) {
      if (e.key === "Enter" && value.trim() && onEnterAdd) {
        e.preventDefault();
        onEnterAdd();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? filtered.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlighted]);
    } else if (e.key === "Enter" && highlighted < 0 && value.trim() && onEnterAdd) {
      e.preventDefault();
      onEnterAdd();
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    } else if (e.key === "Tab" && highlighted >= 0) {
      handleSelect(filtered[highlighted]);
    }
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClass}
        placeholder={placeholder || "Diagnosis"}
        autoComplete="off"
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.map((item, i) => (
            <button
              key={item}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => handleSelect(item)}
              className={`block w-full px-3 py-1.5 text-left text-sm transition ${
                i === highlighted ? "bg-brand-light text-brand-dark" : "text-ink hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ))}
          <div className="border-t border-slate-100 px-3 py-1 text-[10px] text-slate-400">↑↓ navigate · Enter select · Esc close</div>
        </div>
      )}
    </div>
  );
}
