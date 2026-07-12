// -----------------------------------------------------------------------------
// Clear API — selectively clears data while preserving medicines, investigations, users.
// POST /api/admin/clear
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { defaultSettings } from "@/lib/defaults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { confirm?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.confirm !== true) {
    return NextResponse.json(
      { ok: false, error: "Confirmation required. Send { confirm: true } to proceed." },
      { status: 400 }
    );
  }

  try {
    // Before clearing settings, extract prescription config values to preserve
    let preservedPrescriptionData: {
      predefinedDiagnoses: string[];
      predefinedAdvices: string[];
      timingOptions: string[];
      followUpOptions: string[];
    } | null = null;

    const currentSettings = await prisma.setting.findUnique({ where: { id: "main" } });
    if (currentSettings) {
      const data = currentSettings.data as Record<string, unknown>;
      const prescription = data?.prescription as Record<string, unknown> | undefined;
      if (prescription) {
        preservedPrescriptionData = {
          predefinedDiagnoses: Array.isArray(prescription.predefinedDiagnoses)
            ? prescription.predefinedDiagnoses as string[]
            : defaultSettings.prescription.predefinedDiagnoses,
          predefinedAdvices: Array.isArray(prescription.predefinedAdvices)
            ? prescription.predefinedAdvices as string[]
            : defaultSettings.prescription.predefinedAdvices,
          timingOptions: Array.isArray(prescription.timingOptions)
            ? prescription.timingOptions as string[]
            : defaultSettings.prescription.timingOptions,
          followUpOptions: Array.isArray(prescription.followUpOptions)
            ? prescription.followUpOptions as string[]
            : defaultSettings.prescription.followUpOptions,
        };
      }
    }

    // Execute clear in a transaction
    const counts = await prisma.$transaction(async (tx) => {
      // Delete in reverse dependency order
      const auditCount = await tx.auditLog.deleteMany();
      const uploadCount = await tx.uploadSession.deleteMany();
      const revisionCount = await tx.blogRevision.deleteMany();
      const testReportCount = await tx.testReport.deleteMany();
      const consultationCount = await tx.consultation.deleteMany();
      const appointmentCount = await tx.appointment.deleteMany();
      const patientCount = await tx.patient.deleteMany();
      const blogPostCount = await tx.blogPost.deleteMany();

      // Reset settings to defaults with preserved prescription data
      await tx.setting.deleteMany();

      // Restore settings with preserved prescription config
      const restoredSettings = {
        ...defaultSettings,
        prescription: {
          ...defaultSettings.prescription,
          ...(preservedPrescriptionData ?? {}),
        },
      };

      await tx.setting.create({
        data: {
          id: "main",
          data: restoredSettings as object,
        },
      });

      return {
        patients: patientCount.count,
        consultations: consultationCount.count,
        testReports: testReportCount.count,
        appointments: appointmentCount.count,
        blogPosts: blogPostCount.count,
        blogRevisions: revisionCount.count,
        auditLogs: auditCount.count,
        uploadSessions: uploadCount.count,
      };
    });

    // Log audit (after transaction so the audit log is fresh)
    await logAudit(user.id, "DATA_CLEARED", "system", undefined, { counts });

    return NextResponse.json({
      ok: true,
      message: "Data cleared successfully. Medicines, investigations, and users were preserved.",
      counts,
    });
  } catch (error) {
    console.error("[clear] Error clearing data:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to clear data" },
      { status: 500 }
    );
  }
}
