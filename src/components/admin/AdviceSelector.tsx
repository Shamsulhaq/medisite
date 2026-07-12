"use client";

// -----------------------------------------------------------------------------
// Reusable advice selector: predefined advices shown as selectable chips
// (numbered when chosen) plus a writable input for custom advices. Shared by
// the consultation form AND the prescription template editor so both behave
// identically.
// -----------------------------------------------------------------------------

import { useState } from "react";

const defaultInputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function AdviceSelector({
  value,
  onChange,
  predefined,
  inputClassName,
  placeholder = "Type custom advice + Enter",
}: {
  value: string[];
  onChange: (advices: string[]) => void;
  predefined: string[];
  inputClassName?: string;
  placeholder?: string;
}) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (adv: string) => {
    if (value.includes(adv)) onChange(value.filter((a) => a !== adv));
    else onChange([...value, adv]);
  };

  const addCustom = () => {
    const val = customInput.trim();
    if (val && !value.includes(val)) onChange([...value, val]);
    setCustomInput("");
  };

  // Selected advices that aren't in the predefined list.
  const custom = value.filter((a) => !predefined.includes(a));

  return (
    <div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {predefined.map((adv) => {
          const idx = value.indexOf(adv);
          const isSelected = idx >= 0;
          return (
            <button
              key={adv}
              type="button"
              onClick={() => toggle(adv)}
              className={`relative rounded-full px-3 py-1 text-xs font-medium transition ${
                isSelected
                  ? "bg-brand text-white ring-2 ring-brand/30"
                  : "bg-slate-100 text-ink hover:bg-brand-light"
              }`}
            >
              {isSelected && (
                <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-white">
                  {idx + 1}
                </span>
              )}
              {adv.length > 25 ? adv.slice(0, 25) + "…" : adv}
            </button>
          );
        })}
      </div>

      {/* Custom (non-predefined) selected advices */}
      {custom.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {custom.map((adv) => {
            const idx = value.indexOf(adv);
            return (
              <button
                key={adv}
                type="button"
                onClick={() => onChange(value.filter((a) => a !== adv))}
                className="relative rounded-full bg-brand text-white ring-2 ring-brand/30 px-3 py-1 text-xs font-medium transition"
              >
                <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-white">
                  {idx + 1}
                </span>
                {adv.length > 25 ? adv.slice(0, 25) + "…" : adv}
              </button>
            );
          })}
        </div>
      )}

      <input
        value={customInput}
        onChange={(e) => setCustomInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addCustom();
          }
        }}
        className={`${inputClassName ?? defaultInputClass} mt-2`}
        placeholder={placeholder}
      />
    </div>
  );
}
