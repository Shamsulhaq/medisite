"use client";

import { useState, useRef } from "react";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

type InvResult = { name: string; category: string };

export default function InvestigationAutocomplete({
  value,
  onChange,
  placeholder,
  onEnterAdd,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onEnterAdd?: () => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [results, setResults] = useState<InvResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const deletingRef = useRef(false);

  function handleChange(v: string) {
    onChange(v);
    setHighlighted(-1);
    deletingRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (v.trim().length < 1) { setResults([]); setShowDropdown(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/investigations?q=${encodeURIComponent(v)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setShowDropdown(data.length > 0);
      } catch { setResults([]); }
    }, 100);
  }

  function handleSelect(item: string) {
    onChange(item);
    setShowDropdown(false);
    setHighlighted(-1);
    setResults([]);
  }

  function handleBlur() {
    setTimeout(() => setShowDropdown(false), 200);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Backspace" || e.key === "Delete") {
      deletingRef.current = true;
      return;
    }
    if (!showDropdown || results.length === 0) {
      if (e.key === "Enter" && value.trim() && onEnterAdd) {
        e.preventDefault();
        onEnterAdd();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? results.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      handleSelect(results[highlighted].name);
    } else if (e.key === "Enter" && highlighted < 0 && value.trim() && onEnterAdd) {
      e.preventDefault();
      onEnterAdd();
    } else if (e.key === "Tab" && highlighted >= 0) {
      handleSelect(results[highlighted].name);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (results.length) setShowDropdown(true); }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClass}
        placeholder={placeholder || "Investigation / Test"}
        autoComplete="off"
      />
      {showDropdown && results.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => handleSelect(item.name)}
              className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition ${
                i === highlighted ? "bg-brand-light text-brand-dark" : "text-ink hover:bg-slate-50"
              }`}
            >
              <span>{item.name}</span>
              {item.category && <span className="text-xs text-muted">{item.category}</span>}
            </button>
          ))}
          <div className="border-t border-slate-100 px-3 py-1 text-[10px] text-slate-400">↑↓ navigate · Enter select · Esc close</div>
        </div>
      )}
    </div>
  );
}
