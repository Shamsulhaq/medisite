"use client";

// -----------------------------------------------------------------------------
// Reusable medicine entry row with generic/brand autocomplete, inline
// auto-complete, form/dosage/frequency/timing/duration fields and keyboard
// navigation. Shared by the consultation form AND the prescription template
// editor so both behave identically.
// -----------------------------------------------------------------------------

import { useRef, useState } from "react";
import type { MedicineEntry } from "@/lib/patients";
import type { MedicineRef } from "@/lib/medicines";
import { FREQUENCIES, DURATIONS, FORMS, shortForm } from "@/lib/medicines";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function MedicineInput({ entry, onChange, onRemove, index, onAdviceAdd }: {
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
            data-med-name
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
