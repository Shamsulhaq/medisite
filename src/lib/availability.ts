// -----------------------------------------------------------------------------
// Appointment availability: a per-weekday schedule plus a holidays list, and a
// pure slot generator used by both the public form (client) and the API (server).
// -----------------------------------------------------------------------------

import type {
  AppointmentConfig,
  Availability,
  Chamber,
  DayAvailability,
  OnlineConfig,
  TimeRange,
} from "./types";

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Default: chamber open Sat–Thu evening, closed Friday.
export const defaultAvailability: Availability = {
  slotMinutes: 30,
  maxPerSlot: 10,
  holidays: [],
  week: [
    { enabled: true, ranges: [{ start: "18:00", end: "21:00" }] }, // Sun
    { enabled: true, ranges: [{ start: "18:00", end: "21:00" }] }, // Mon
    { enabled: true, ranges: [{ start: "18:00", end: "21:00" }] }, // Tue
    { enabled: true, ranges: [{ start: "18:00", end: "21:00" }] }, // Wed
    { enabled: true, ranges: [{ start: "18:00", end: "21:00" }] }, // Thu
    { enabled: false, ranges: [] }, // Fri (off)
    { enabled: true, ranges: [{ start: "18:00", end: "21:00" }] }, // Sat
  ],
};

function toRange(v: unknown): TimeRange {
  const r = (v ?? {}) as Record<string, unknown>;
  return {
    start: typeof r.start === "string" ? r.start : "",
    end: typeof r.end === "string" ? r.end : "",
  };
}

export function normalizeAvailability(raw: unknown): Availability {
  const a = (raw ?? {}) as Record<string, unknown>;
  const week: DayAvailability[] = Array.isArray(a.week)
    ? Array.from({ length: 7 }, (_, i) => {
        const d = (a.week as unknown[])[i] as Record<string, unknown> | undefined;
        return {
          enabled: Boolean(d?.enabled),
          ranges: Array.isArray(d?.ranges)
            ? (d!.ranges as unknown[]).map(toRange)
            : [],
          maxPerDay:
            typeof d?.maxPerDay === "number" && d.maxPerDay > 0
              ? d.maxPerDay
              : 0,
        };
      })
    : defaultAvailability.week;

  const slotMinutes =
    typeof a.slotMinutes === "number" && a.slotMinutes > 0
      ? a.slotMinutes
      : defaultAvailability.slotMinutes;

  const maxPerSlot =
    typeof a.maxPerSlot === "number" && a.maxPerSlot > 0
      ? a.maxPerSlot
      : defaultAvailability.maxPerSlot;

  const holidays = Array.isArray(a.holidays)
    ? (a.holidays as unknown[]).filter((h): h is string => typeof h === "string")
    : [];

  return { slotMinutes, maxPerSlot, week, holidays };
}

// Parse a "YYYY-MM-DD" string into a local Date (avoids UTC offset surprises).
function parseLocalDate(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const min = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${period}`;
}

export function isHoliday(availability: Availability, dateStr: string): boolean {
  return availability.holidays.includes(dateStr);
}

/** Weekday name for a date string, or "" if invalid. */
export function weekdayName(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d ? WEEKDAYS[d.getDay()] : "";
}

/**
 * Maximum total patients allowed for the weekday of `dateStr`.
 * Returns 0 when there is no limit configured.
 */
export function dayMaxPatients(
  availability: Availability,
  dateStr: string
): number {
  const d = parseLocalDate(dateStr);
  if (!d) return 0;
  const day = availability.week[d.getDay()];
  return day?.maxPerDay && day.maxPerDay > 0 ? day.maxPerDay : 0;
}

/**
 * Resolve the schedule that applies to a stored appointment `location`
 * ("Online" or a chamber name). Used so reschedule/edit show the SAME slots as
 * that appointment's chamber, not a default.
 */
export function availabilityForLocation(
  config: AppointmentConfig,
  location: string
): Availability | undefined {
  if (!location) return undefined;
  if (location.trim().toLowerCase() === "online") return config.online.availability;
  return config.chambers.find((c) => c.name === location)?.availability;
}

/**
 * Generate bookable slot labels (e.g. "02:00 PM") for a given date, based on the
 * weekday schedule and holidays. Returns [] when the day is closed.
 */
export function generateSlotsForDate(
  availability: Availability,
  dateStr: string
): string[] {
  const d = parseLocalDate(dateStr);
  if (!d) return [];
  if (isHoliday(availability, dateStr)) return [];

  const day = availability.week[d.getDay()];
  if (!day || !day.enabled) return [];

  const step = availability.slotMinutes > 0 ? availability.slotMinutes : 30;
  const slots: string[] = [];

  for (const range of day.ranges) {
    const start = toMinutes(range.start);
    const end = toMinutes(range.end);
    if (start === null || end === null || end <= start) continue;
    for (let t = start; t + step <= end; t += step) {
      slots.push(formatTime(t));
    }
  }
  // De-duplicate while preserving order.
  return Array.from(new Set(slots));
}


// ---- Appointment config (chambers + online) -------------------------------

function genId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  return g.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2)}`;
}

export const defaultAppointmentConfig: AppointmentConfig = {
  chambers: [
    {
      id: "main-chamber",
      name: "Main Chamber",
      address: "Faridpur",
      phone: "",
      mapUrl: "",
      description: "",
      photo: "",
      availability: defaultAvailability,
    },
  ],
  online: {
    enabled: false,
    platform: "Google Meet / Zoom",
    instructions:
      "A meeting link will be shared by SMS/email after your appointment is confirmed.",
    availability: defaultAvailability,
  },
};

function normalizeChamber(raw: unknown): Chamber {
  const c = (raw ?? {}) as Record<string, unknown>;
  return {
    id: typeof c.id === "string" && c.id ? c.id : genId(),
    name: typeof c.name === "string" ? c.name : "",
    address: typeof c.address === "string" ? c.address : "",
    phone: typeof c.phone === "string" ? c.phone : "",
    mapUrl: typeof c.mapUrl === "string" ? c.mapUrl : "",
    description: typeof c.description === "string" ? c.description : "",
    photo: typeof c.photo === "string" ? c.photo : "",
    availability: normalizeAvailability(c.availability),
  };
}

function normalizeOnline(raw: unknown): OnlineConfig {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    enabled: Boolean(o.enabled),
    platform:
      typeof o.platform === "string"
        ? o.platform
        : defaultAppointmentConfig.online.platform,
    instructions:
      typeof o.instructions === "string"
        ? o.instructions
        : defaultAppointmentConfig.online.instructions,
    availability: normalizeAvailability(o.availability),
  };
}

/**
 * Normalize the appointment config. If no chambers are stored yet, seed one
 * from the legacy single `availability` so existing schedules carry over.
 */
export function normalizeAppointmentConfig(
  raw: unknown,
  legacy?: Availability
): AppointmentConfig {
  const a = (raw ?? {}) as Record<string, unknown>;

  const chambers =
    Array.isArray(a.chambers) && a.chambers.length > 0
      ? a.chambers.map(normalizeChamber)
      : [
          {
            id: "main-chamber",
            name: "Main Chamber",
            address: "",
            phone: "",
            mapUrl: "",
            description: "",
            photo: "",
            availability: legacy
              ? normalizeAvailability(legacy)
              : defaultAvailability,
          },
        ];

  const online = a.online
    ? normalizeOnline(a.online)
    : {
        ...defaultAppointmentConfig.online,
        availability: legacy
          ? normalizeAvailability(legacy)
          : defaultAvailability,
      };

  return { chambers, online };
}
