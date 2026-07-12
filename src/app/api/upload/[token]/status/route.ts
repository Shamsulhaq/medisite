import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: Check if an upload session is still valid (no auth required, for mobile page)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const uploadSession = await prisma.uploadSession.findUnique({
    where: { token },
  });

  if (!uploadSession) {
    return NextResponse.json({ valid: false });
  }

  // Check if expired
  if (new Date() > uploadSession.expiresAt || uploadSession.status !== "waiting") {
    return NextResponse.json({ valid: false });
  }

  // Fetch patient name
  const patient = await prisma.patient.findUnique({
    where: { id: uploadSession.patientId },
    select: { name: true },
  });

  return NextResponse.json({
    valid: true,
    patientName: patient?.name ?? "Unknown",
  });
}
