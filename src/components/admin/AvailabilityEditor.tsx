"use client";

import { useState } from "react";
import type { Availability } from "@/lib/types";
import { WEEKDAYS } from "@/lib/availability";

const timeInput =
  "rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function AvailabilityEditor({
  value,
  onChange,
}: {
  value: Availability;
  onChange: (a: Availability) => void;
}) {
  const [newHoliday, setNewHoliday] = useState("");

  const setDay = (i: number, patch: Partial<Availability["week"][number]>) =>
    onChange({
      ...value,
      week: value.week.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    });

  const toggleDay = (i: number, enabled: boolean) =>
    setDay(i, {
      enabled,
      ranges:
        enabled && value.week[i].ranges.length === 0
          ? [{ start: "18:00", end: "21:00" }]
          : value.week[i].ranges,
    });

  const setRange = (
    dayI: number,
    rIdx: number,
    patch: Partial<{ start: string; end: string }>
  ) =>
    setDay(dayI, {
      ranges: value.week[dayI].ranges.map((r, idx) =>
        idx === rIdx ? { ...r, ...patch } : r
      ),
    });

  const addRange = (dayI: number) =>
    setDay(dayI, {
      ranges: [...value.week[dayI].ranges, { start: "09:00", end: "12:00" }],
    });

  const removeRange = (dayI: number, rIdx: number) =>
    setDay(dayI, {
      ranges: value.week[dayI].ranges.filter((_, idx) => idx !== rIdx),
    });

  const addHoliday = () => {
    if (!newHoliday || value.holidays.includes(newHoliday)) return;
    onChange({ ...value, holidays: [...value.holidays, newHoliday].sort() });
    setNewHoliday("");
  };

  const removeHoliday = (date: string) =>
    onChange({ ...value, holidays: value.holidays.filter((h) => h !== date) });

  return (
    <div className="space-y-6">
      {/* Slot duration */}
      <label className="block max-w-xs">
        <span className="text-sm font-medium text-ink">
          Slot duration (minutes)
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          Each booking occupies this many minutes within the open hours.
        </span>
        <input
          type="number"
          min={5}
          step={5}
          value={value.slotMinutes}
          onChange={(e) =>
            onChange({ ...value, slotMinutes: Number(e.target.value) || 30 })
          }
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </label>

      {/* Weekly schedule */}
      <div>
        <p className="text-sm font-medium text-ink">Weekly Schedule</p>
        <p className="mt-0.5 text-xs text-muted">
          Turn each day on or off and set one or more time windows.
        </p>
        <div className="mt-3 space-y-2">
          {WEEKDAYS.map((name, i) => {
            const day = value.week[i];
            return (
              <div
                key={name}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(e) => toggleDay(i, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <span className="w-24 text-sm font-medium text-ink">
                      {name}
                    </span>
                  </label>
                  {day.enabled ? (
                    <button
                      type="button"
                      onClick={() => addRange(i)}
                      className="text-xs font-medium text-brand hover:text-brand-dark"
                    >
                      + Add hours
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">
                      Closed / Off
                    </span>
                  )}
                </div>

                {day.enabled && (
                  <div className="mt-2 space-y-2 pl-6">
                    {day.ranges.length === 0 && (
                      <p className="text-xs text-muted">
                        No hours set — add a time window.
                      </p>
                    )}
                    {day.ranges.map((r, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={r.start}
                          onChange={(e) =>
                            setRange(i, rIdx, { start: e.target.value })
                          }
                          className={timeInput}
                        />
                        <span className="text-sm text-muted">to</span>
                        <input
                          type="time"
                          value={r.end}
                          onChange={(e) =>
                            setRange(i, rIdx, { end: e.target.value })
                          }
                          className={timeInput}
                        />
                        <button
                          type="button"
                          onClick={() => removeRange(i, rIdx)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Holidays */}
      <div>
        <p className="text-sm font-medium text-ink">Holidays / Off-days</p>
        <p className="mt-0.5 text-xs text-muted">
          Specific dates the chamber is closed, regardless of the weekly schedule.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={newHoliday}
            onChange={(e) => setNewHoliday(e.target.value)}
            className={timeInput}
          />
          <button
            type="button"
            onClick={addHoliday}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Add holiday
          </button>
        </div>
        {value.holidays.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {value.holidays.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-ink"
              >
                {h}
                <button
                  type="button"
                  onClick={() => removeHoliday(h)}
                  aria-label={`Remove ${h}`}
                  className="text-slate-400 hover:text-red-600"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
