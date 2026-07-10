import { NextResponse } from "next/server";
import { addAppointment, validateAppointment } from "@/lib/appointments";
import { getSettings } from "@/lib/store";
import { generateSlotsForDate } from "@/lib/availability";

// File writes require the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  try {
    const appointment = await addAppointment({
      name,
      email,
      phone,
      mode,
      location,
      date,
      time,
      reason,
    });
    return NextResponse.json({ ok: true, id: appointment.id }, { status: 201 });
  } catch (err) {
    console.error("Failed to save appointment:", err);
    return NextResponse.json(
      { ok: false, errors: ["Something went wrong. Please try again later."] },
      { status: 500 }
    );
  }
}
