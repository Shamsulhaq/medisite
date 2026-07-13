import { NextResponse } from "next/server";
import { getAppointments, validateAppointment, bookAppointmentWithCapacityCheck } from "@/lib/appointments";
import { getSettings } from "@/lib/store";
import { generateSlotsForDate, dayMaxPatients } from "@/lib/availability";
import { rateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

// File writes require the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Lenient limit: the booking form polls this as the user picks date/chamber.
  const rl = rateLimit(`appointments:get:${getClientIp(request)}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { counts: {}, error: "Too many requests." },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const location = searchParams.get("location");

  if (!date || !location) {
    return NextResponse.json({ counts: {} });
  }

  const existingAppointments = await getAppointments();
  const counts: Record<string, number> = {};
  for (const a of existingAppointments) {
    if (a.date === date && a.location === location && a.status !== "cancelled") {
      counts[a.time] = (counts[a.time] || 0) + 1;
    }
  }
  return NextResponse.json({ counts });
}

export async function POST(request: Request) {
  // Public self-booking limits: max 2 per minute AND 20 per day per IP.
  // Check the short window first so a burst doesn't consume the daily quota.
  const ip = getClientIp(request);
  const perMinute = rateLimit(`appointments:post:min:${ip}`, 2, 60_000);
  if (!perMinute.ok) {
    return NextResponse.json(
      { ok: false, errors: ["Too many booking attempts. Please wait a minute and try again."] },
      { status: 429, headers: rateLimitHeaders(perMinute) }
    );
  }
  const perDay = rateLimit(`appointments:post:day:${ip}`, 20, 24 * 60 * 60 * 1000);
  if (!perDay.ok) {
    return NextResponse.json(
      { ok: false, errors: ["Daily booking limit reached. Please try again tomorrow or call the chamber."] },
      { status: 429, headers: rateLimitHeaders(perDay) }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: ["Invalid request body."] },
      { status: 400 }
    );
  }

  const result = validateAppointment(body);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, errors: result.errors },
      { status: 422 }
    );
  }

  const settings = await getSettings();
  if (!settings.appointmentsEnabled) {
    return NextResponse.json(
      { ok: false, errors: ["Online booking is currently unavailable."] },
      { status: 403 }
    );
  }

  const { mode, chamberId, name, email, phone, date, time, reason } =
    result.value;
  const cfg = settings.appointment;

  // Resolve the schedule + human-readable location for the chosen mode.
  let availability;
  let location: string;
  if (mode === "online") {
    if (!cfg.online.enabled) {
      return NextResponse.json(
        { ok: false, errors: ["Online consultation is not available."] },
        { status: 403 }
      );
    }
    availability = cfg.online.availability;
    location = "Online";
  } else {
    const chamber = cfg.chambers.find((c) => c.id === chamberId);
    if (!chamber) {
      return NextResponse.json(
        { ok: false, errors: ["The selected chamber was not found."] },
        { status: 422 }
      );
    }
    availability = chamber.availability;
    location = chamber.name || "Chamber";
  }

  const slots = generateSlotsForDate(availability, date);
  if (slots.length === 0 || !slots.includes(time)) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          "The selected date and time is not available. Please pick an open slot.",
        ],
      },
      { status: 422 }
    );
  }

  const maxPerSlot = availability.maxPerSlot ?? 10;
  const dayMax = dayMaxPatients(availability, date);

  try {
    const bookingResult = await bookAppointmentWithCapacityCheck(
      { name, email, phone, mode, location, date, time, reason },
      { maxPerSlot, dayMax }
    );

    if (!bookingResult.ok) {
      const message =
        bookingResult.reason === "slot_full"
          ? "This time slot is fully booked. Please choose a different time."
          : "This day is fully booked. Please choose another day.";
      return NextResponse.json({ ok: false, errors: [message] }, { status: 422 });
    }

    return NextResponse.json({ ok: true, id: bookingResult.appointment.id }, { status: 201 });
  } catch (err) {
    console.error("Failed to save appointment:", err);
    return NextResponse.json(
      { ok: false, errors: ["Something went wrong. Please try again later."] },
      { status: 500 }
    );
  }
}
