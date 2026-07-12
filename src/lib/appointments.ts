// -----------------------------------------------------------------------------
// Appointment store — backed by PostgreSQL via Prisma.
// Maintains the same external API as the previous JSON-file-based version.
// -----------------------------------------------------------------------------

import prisma from "@/lib/db";
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

export async function addAppointment(
  input: AppointmentInput
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
      status: "pending",
    },
  });
  return dbRowToType(row);
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

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function filterAppointments(
  appointments: Appointment[],
  filter: AppointmentFilter
): Appointment[] {
  const today = todayStr();
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
