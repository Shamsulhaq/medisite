import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST: Create a new upload session
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { patientId: string; targetType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.patientId) {
    return NextResponse.json({ ok: false, error: "patientId is required" }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  const uploadSession = await prisma.uploadSession.create({
    data: {
      patientId: body.patientId,
      targetType: body.targetType || "attachment",
      expiresAt,
    },
  });

  const url = `/upload/${uploadSession.token}`;

  return NextResponse.json({
    ok: true,
    token: uploadSession.token,
    url,
    expiresAt: expiresAt.toISOString(),
  }, { status: 201 });
}

// GET: Poll session status by token
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ ok: false, error: "token is required" }, { status: 400 });
  }

  const uploadSession = await prisma.uploadSession.findUnique({
    where: { token },
  });

  if (!uploadSession) {
    return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
  }

  // Check if expired
  if (new Date() > uploadSession.expiresAt && uploadSession.status === "waiting") {
    await prisma.uploadSession.update({
      where: { id: uploadSession.id },
      data: { status: "expired" },
    });
    return NextResponse.json({ ok: true, status: "expired", files: [] });
  }

  return NextResponse.json({
    ok: true,
    status: uploadSession.status,
    files: uploadSession.files,
  });
}
