"use client";

// -----------------------------------------------------------------------------
// Shared appointment slot availability. A single source of truth for which time
// slots exist and which are full, used by BOTH the public booking form and the
// admin (create + reschedule) so patients and staff always see the same slots.
//
// - useSlotAvailability: computes slots for a date + fetches booked counts and
//   derives per-slot / per-day fullness (matching the booking API's rules).
// - SlotPicker: renders the time <select> using that state, disabling full
//   slots and full days identically everywhere.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import type { Availability } from "@/lib/types";
import { generateSlotsForDate, isHoliday, dayMaxPatients } from "@/lib/availability";

export interface SlotAvailability {
  hasDate: boolean;
  slots: string[];
  bookedCounts: Record<string, number>;
  maxPerSlot: number;
  dayMax: number; // per-day patient cap (0 = no limit)
  dayTotal: number; // total booked for the day+location
  dayFull: boolean;
  dayClosed: boolean;
  holiday: boolean;
}

export function useSlotAvailability(
  availability: Availability | undefined,
  date: string,
  location: string
): SlotAvailability {
  const [bookedCounts, setBookedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!date || !location) {
      setBookedCounts({});
      return;
    }
    let active = true;
    fetch(`/api/appointments?date=${date}&location=${encodeURIComponent(location)}`)
      .then((r) => r.json())
      .then((d) => { if (active) setBookedCounts(d.counts ?? {}); })
      .catch(() => { if (active) setBookedCounts({}); });
    return () => { active = false; };
  }, [date, location]);

  const slots = useMemo(
    () => (date && availability ? generateSlotsForDate(availability, date) : []),
    [date, availability]
  );

  const maxPerSlot = availability?.maxPerSlot ?? 10;
  const dayMax = date && availability ? dayMaxPatients(availability, date) : 0;
  const dayTotal = Object.values(bookedCounts).reduce((s, n) => s + n, 0);
  const dayClosed = date !== "" && slots.length === 0;

  return {
    hasDate: date.trim() !== "",
    slots,
    bookedCounts,
    maxPerSlot,
    dayMax,
    dayTotal,
    dayFull: dayMax > 0 && dayTotal >= dayMax,
    dayClosed,
    holiday: !!(date && availability && isHoliday(availability, date)),
  };
}

/** Is a given slot full (its own capacity reached, or the whole day is full)? */
export function isSlotFull(state: SlotAvailability, slot: string): boolean {
  return state.dayFull || (state.bookedCounts[slot] ?? 0) >= state.maxPerSlot;
}

export default function SlotPicker({
  state,
  value,
  onChange,
  id,
  className,
  selectTimeLabel = "Select a time slot",
  showNotes = true,
}: {
  state: SlotAvailability;
  value: string;
  onChange: (time: string) => void;
  id?: string;
  className?: string;
  selectTimeLabel?: string;
  showNotes?: boolean;
}) {
  const { hasDate, slots, dayMax, dayTotal, dayFull, dayClosed, holiday } = state;

  const placeholder = !hasDate
    ? "Select a date first"
    : dayClosed
      ? "Not available"
      : dayFull
        ? "Fully booked for this day"
        : selectTimeLabel;

  return (
    <div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!hasDate || dayClosed || dayFull}
        className={className}
      >
        <option value="">{placeholder}</option>
        {slots.map((slot) => {
          const full = isSlotFull(state, slot);
          return (
            <option key={slot} value={slot} disabled={full}>
              {slot}{full ? " (Full)" : ""}
            </option>
          );
        })}
      </select>

      {showNotes && hasDate && !dayClosed && !dayFull && dayMax > 0 && (
        <p className="mt-1 text-xs text-muted">
          {Math.max(0, dayMax - dayTotal)} of {dayMax} slots left for this day
        </p>
      )}
      {showNotes && dayClosed && (
        <p className="mt-1 text-xs text-amber-700">
          {holiday
            ? "Closed on this date (holiday). Please choose another day."
            : "Not available on this day. Please choose another day."}
        </p>
      )}
      {showNotes && !dayClosed && dayFull && (
        <p className="mt-1 text-xs text-amber-700">
          This day is fully booked ({dayMax} patients). Please choose another day.
        </p>
      )}
    </div>
  );
}
