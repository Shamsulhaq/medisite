// -----------------------------------------------------------------------------
// File-based storage for appointment requests (data/appointments.json).
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
  AppointmentMode,
} from "./types";

export type { Appointment, AppointmentInput, AppointmentStatus, AppointmentMode };

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "appointments.json");

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

export async function getAppointments(): Promise<Appointment[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const data = JSON.parse(raw) as Appointment[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeAll(appointments: Appointment[]): Promise<void> {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(appointments, null, 2), "utf8");
}

export async function addAppointment(
  input: AppointmentInput
): Promise<Appointment> {
  const appointments = await getAppointments();
  const appointment: Appointment = {
    id: crypto.randomUUID(),
    ...input,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  appointments.push(appointment);
  await writeAll(appointments);
  return appointment;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<boolean> {
  const appointments = await getAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  appointments[idx].status = status;
  await writeAll(appointments);
  return true;
}

export async function deleteAppointment(id: string): Promise<boolean> {
  const appointments = await getAppointments();
  const next = appointments.filter((a) => a.id !== id);
  if (next.length === appointments.length) return false;
  await writeAll(next);
  return true;
}

export type AppointmentFilter = "today" | "upcoming" | "past" | "all";

function todayStr(): string {
  // Local date in YYYY-MM-DD
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
  if (!EMAIL_RE.test(email)) errors.push("Please enter a valid email address.");
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
