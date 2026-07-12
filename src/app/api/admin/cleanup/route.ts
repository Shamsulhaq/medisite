import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE: Clean up expired upload sessions.
 * Requires authentication as a DOCTOR.
 * Deletes UploadSession records where expiresAt < now AND status = 'waiting'.
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "DOCTOR") {
    return NextResponse.json({ ok: false, error: "Forbidden: Doctor access required" }, { status: 403 });
  }

  const result = await prisma.uploadSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
      status: "waiting",
    },
  });

  return NextResponse.json({
    ok: true,
    deleted: result.count,
  });
}
