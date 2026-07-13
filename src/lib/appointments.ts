// -----------------------------------------------------------------------------
// Appointment store — backed by PostgreSQL via Prisma.
// Maintains the same external API as the previous JSON-file-based version.
// -----------------------------------------------------------------------------

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { todayInBD } from "@/lib/utils";
import type {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
  AppointmentMode,
} from "./types";

export type { Appointment, AppointmentInput, AppointmentStatus, AppointmentMode };

// ---- Helpers ---------------------------------------------------------------

function dbRowToType(row: {
  id: string;
  name: string;
  email: string;
  phone: string;
  mode: string;
  location: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  createdAt: Date;
}): Appointment {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    mode: row.mode as AppointmentMode,
    location: row.location,
    date: row.date,
    time: row.time,
    reason: row.reason,
    status: row.status as AppointmentStatus,
    createdAt: row.createdAt.toISOString(),
  };
}

// ---- Public API ------------------------------------------------------------

export async function getAppointments(): Promise<Appointment[]> {
  const rows = await prisma.appointment.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(dbRowToType);
}

// Lightweight: just phone numbers (used to compute importable-patient counts
// without loading every appointment record).
export async function getAppointmentPhones(): Promise<string[]> {
  const rows = await prisma.appointment.findMany({ select: { phone: true } });
  return rows.map((r) => r.phone);
}

// ---- Paginated list (scalable) --------------------------------------------
// DB-level, server-side pagination + filtering so we never load every
// appointment just to render the admin table. Mirrors getPatientsPage.

export type AppointmentRange = "all" | "today" | "upcoming" | "past" | "custom";

export interface AppointmentsQuery {
  page?: number;
  perPage?: number;
  q?: string; // free-text search (name / phone)
  range?: AppointmentRange;
  from?: string; // YYYY-MM-DD (custom range start)
  to?: string; // YYYY-MM-DD (custom range end)
  type?: "all" | "online" | "offline";
  chamber?: string; // chamber name, or "all"
}

export interface AppointmentsPageResult {
  items: Appointment[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// Shared Prisma where clause used by both the paginated list and the export
// helper so both honour the exact same filters.
function buildAppointmentsWhere(
  query: AppointmentsQuery
): Prisma.AppointmentWhereInput {
  const and: Prisma.AppointmentWhereInput[] = [];

  const q = query.q?.trim();
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    });
  }

  // `date` is a lexically-sortable 'YYYY-MM-DD' string, so date-range filters
  // use string gte/lt/lte comparisons directly on it.
  const range = query.range ?? "today";
  const today = todayInBD();
  switch (range) {
    case "today":
      and.push({ date: today });
      break;
    case "upcoming":
      and.push({ date: { gte: today } });
      break;
    case "past":
      and.push({ date: { lt: today } });
      break;
    case "custom":
      if (query.from) and.push({ date: { gte: query.from } });
      if (query.to) and.push({ date: { lte: query.to } });
      break;
    case "all":
    default:
      break;
  }

  if (query.type && query.type !== "all") {
    and.push({ mode: query.type });
  }

  if (query.chamber && query.chamber !== "all") {
    // Chamber filter only applies to in-person appointments (matches location).
    and.push({ mode: "offline", location: query.chamber });
  }

  return and.length ? { AND: and } : {};
}

// Display order for the list — date ascending, then time ascending (matches
// the previous client-side sort in AppointmentsExplorer).
const APPOINTMENTS_ORDER_BY: Prisma.AppointmentOrderByWithRelationInput[] = [
  { date: "asc" },
  { time: "asc" },
];

export async function getAppointmentsPage(
  query: AppointmentsQuery = {}
): Promise<AppointmentsPageResult> {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const perPage = Math.min(100, Math.max(5, Math.floor(query.perPage ?? 20)));
  const where = buildAppointmentsWhere(query);

  const [rows, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: APPOINTMENTS_ORDER_BY,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    items: rows.map(dbRowToType),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

// All appointments matching a filter (no pagination) — used for CSV/Excel/PDF
// exports so they contain every matching row, not just the visible page.
export async function getAppointmentsForExport(
  query: AppointmentsQuery = {}
): Promise<Appointment[]> {
  const where = buildAppointmentsWhere(query);
  const rows = await prisma.appointment.findMany({
    where,
    orderBy: APPOINTMENTS_ORDER_BY,
  });
  return rows.map(dbRowToType);
}

export async function addAppointment(
  input: AppointmentInput,
  status: AppointmentStatus = "pending"
): Promise<Appointment> {
  const row = await prisma.appointment.create({
    data: {
      name: input.name,
      email: input.email || "",
      phone: input.phone,
      mode: input.mode || "offline",
      location: input.location || "",
      date: input.date,
      time: input.time,
      reason: input.reason || "",
      status,
    },
  });
  return dbRowToType(row);
}

export type CapacityLimits = {
  maxPerSlot: number; // 0/undefined = no per-slot limit
  dayMax: number; // 0 = no per-day limit
};

export type BookAppointmentResult =
  | { ok: true; appointment: Appointment }
  | { ok: false; reason: "slot_full" | "day_full" };

/**
 * Atomically re-checks slot/day capacity and inserts the appointment inside a
 * single Serializable transaction. This closes the check-then-insert race
 * where two concurrent bookings could both pass the capacity check (read
 * outside any transaction) and then both insert, overbooking the last slot.
 *
 * Serializable isolation makes Postgres detect the read/write conflict when
 * two transactions race for the same slot: one commits, the other fails with
 * a serialization error, which we catch and retry (re-checking capacity on
 * each attempt) so the caller always gets an authoritative ok/slot_full result.
 */
export async function bookAppointmentWithCapacityCheck(
  input: AppointmentInput,
  limits: CapacityLimits,
  status: AppointmentStatus = "pending"
): Promise<BookAppointmentResult> {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          if (limits.maxPerSlot > 0) {
            const bookedCount = await tx.appointment.count({
              where: {
                date: input.date,
                time: input.time,
                location: input.location || "",
                status: { not: "cancelled" },
              },
            });
            if (bookedCount >= limits.maxPerSlot) {
              return { ok: false, reason: "slot_full" } as const;
            }
          }

          if (limits.dayMax > 0) {
            const dayCount = await tx.appointment.count({
              where: {
                date: input.date,
                location: input.location || "",
                status: { not: "cancelled" },
              },
            });
            if (dayCount >= limits.dayMax) {
              return { ok: false, reason: "day_full" } as const;
            }
          }

          const row = await tx.appointment.create({
            data: {
              name: input.name,
              email: input.email || "",
              phone: input.phone,
              mode: input.mode || "offline",
              location: input.location || "",
              date: input.date,
              time: input.time,
              reason: input.reason || "",
              status,
            },
          });
          return { ok: true, appointment: dbRowToType(row) } as const;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err) {
      // Postgres serialization failure under Serializable isolation — retry.
      const code = (err as { code?: string })?.code;
      const isSerializationFailure = code === "40001";
      if (isSerializationFailure && attempt < MAX_ATTEMPTS) {
        continue;
      }
      throw err;
    }
  }

  // Unreachable in practice (loop always returns or throws), but keeps TS happy.
  throw new Error("Failed to book appointment after retries.");
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<boolean> {
  try {
    await prisma.appointment.update({
      where: { id },
      data: { status },
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteAppointment(id: string): Promise<boolean> {
  try {
    await prisma.appointment.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export type AppointmentFilter = "today" | "upcoming" | "past" | "all";

export function filterAppointments(
  appointments: Appointment[],
  filter: AppointmentFilter
): Appointment[] {
  const today = todayInBD();
  switch (filter) {
    case "today":
      return appointments.filter((a) => a.date === today);
    case "upcoming":
      return appointments.filter((a) => a.date >= today);
    case "past":
      return appointments.filter((a) => a.date < today);
    case "all":
    default:
      return appointments;
  }
}

// ---- Validation ------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;

export type ParsedBooking = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  reason: string;
  mode: AppointmentMode;
  chamberId: string;
};

export function validateAppointment(
  body: unknown
): { ok: true; value: ParsedBooking } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const b = (body ?? {}) as Record<string, unknown>;

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = str(b.name);
  const email = str(b.email);
  const phone = str(b.phone);
  const date = str(b.date);
  const time = str(b.time);
  const reason = str(b.reason);
  const modeRaw = str(b.mode);
  const mode: AppointmentMode = modeRaw === "online" ? "online" : "offline";
  const chamberId = str(b.chamberId);

  if (name.length < 2) errors.push("Please enter your full name.");
  if (email && !EMAIL_RE.test(email)) errors.push("Please enter a valid email address.");
  if (!PHONE_RE.test(phone)) errors.push("Please enter a valid phone number.");
  if (modeRaw !== "online" && modeRaw !== "offline")
    errors.push("Please choose an appointment type.");
  if (mode === "offline" && !chamberId)
    errors.push("Please choose a chamber.");
  if (!date) errors.push("Please choose a preferred date.");
  else if (Number.isNaN(Date.parse(date)))
    errors.push("The preferred date is invalid.");
  if (!time) errors.push("Please choose a preferred time.");
  if (reason.length > 1000)
    errors.push("Reason for visit is too long (max 1000 characters).");

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { name, email, phone, date, time, reason, mode, chamberId },
  };
}

// ---- Dashboard-optimised queries -------------------------------------------

/**
 * Returns appointment counts for the dashboard stats without loading full rows.
 * Uses COUNT queries at the database level for efficiency.
 */
export async function getAppointmentCounts(): Promise<{
  today: number;
  upcoming: number;
  pending: number;
}> {
  const today = todayInBD();
  const [todayCount, upcomingCount, pendingCount] = await Promise.all([
    prisma.appointment.count({ where: { date: today } }),
    prisma.appointment.count({ where: { date: { gte: today } } }),
    prisma.appointment.count({ where: { status: "pending" } }),
  ]);
  return { today: todayCount, upcoming: upcomingCount, pending: pendingCount };
}

/**
 * Returns only today's appointments, sorted by time.
 * Used by the dashboard workflow queue.
 */
export async function getTodayAppointments(): Promise<Appointment[]> {
  const today = todayInBD();
  const rows = await prisma.appointment.findMany({
    where: { date: today },
    orderBy: { time: "asc" },
  });
  return rows.map(dbRowToType);
}

export async function completeAppointmentForPatient(
  phone: string,
  date: string
): Promise<void> {
  try {
    const normalizedPhone = phone.replace(/[\s\-()]/g, "");
    // Find today's appointments for this phone that are not already completed/cancelled
    const appointments = await prisma.appointment.findMany({
      where: {
        date,
        status: { in: ["pending", "confirmed"] },
      },
    });
    for (const apt of appointments) {
      if (apt.phone.replace(/[\s\-()]/g, "") === normalizedPhone) {
        await prisma.appointment.update({
          where: { id: apt.id },
          data: { status: "completed" },
        });
      }
    }
  } catch {
    // Non-critical — don't throw if this fails
  }
}
