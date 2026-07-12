// -----------------------------------------------------------------------------
// Backup API — generates and downloads a ZIP containing all database tables.
// GET /api/admin/backup
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all data
    const [
      patients,
      appointments,
      blogPosts,
      settings,
      users,
      medicines,
      investigations,
      auditLogs,
      uploadSessions,
      consultations,
      testReports,
      blogRevisions,
    ] = await Promise.all([
      prisma.patient.findMany({
        include: { consultations: true, testReports: true },
      }),
      prisma.appointment.findMany(),
      prisma.blogPost.findMany(),
      prisma.setting.findMany(),
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          displayName: true,
          active: true,
          permissions: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          // Exclude salt and hash for security
        },
      }),
      prisma.medicine.findMany(),
      prisma.investigation.findMany(),
      prisma.auditLog.findMany(),
      prisma.uploadSession.findMany(),
      prisma.consultation.findMany(),
      prisma.testReport.findMany(),
      prisma.blogRevision.findMany(),
    ]);

    // Build metadata
    const metadata = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      recordCounts: {
        patients: patients.length,
        consultations: consultations.length,
        testReports: testReports.length,
        appointments: appointments.length,
        blogPosts: blogPosts.length,
        blogRevisions: blogRevisions.length,
        settings: settings.length,
        users: users.length,
        medicines: medicines.length,
        investigations: investigations.length,
        auditLogs: auditLogs.length,
        uploadSessions: uploadSessions.length,
      },
    };

    // Create ZIP archive in memory
    const archive = new ZipArchive({ zlib: { level: 9 } });

    // Add JSON files
    archive.append(JSON.stringify(patients, null, 2), { name: "patients.json" });
    archive.append(JSON.stringify(appointments, null, 2), { name: "appointments.json" });
    archive.append(JSON.stringify(blogPosts, null, 2), { name: "blog_posts.json" });
    archive.append(JSON.stringify(blogRevisions, null, 2), { name: "blog_revisions.json" });
    archive.append(JSON.stringify(settings, null, 2), { name: "settings.json" });
    archive.append(JSON.stringify(users, null, 2), { name: "users.json" });
    archive.append(JSON.stringify(medicines, null, 2), { name: "medicines.json" });
    archive.append(JSON.stringify(investigations, null, 2), { name: "investigations.json" });
    archive.append(JSON.stringify(auditLogs, null, 2), { name: "audit_logs.json" });
    archive.append(JSON.stringify(uploadSessions, null, 2), { name: "upload_sessions.json" });
    archive.append(JSON.stringify(metadata, null, 2), { name: "metadata.json" });

    // Collect data and wait for stream to finish
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      archive.on("data", (chunk: Buffer) => chunks.push(chunk));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", reject);
      archive.finalize();
    });

    // Generate filename with date
    const date = new Date().toISOString().slice(0, 10);
    const filename = `medisite-backup-${date}.zip`;

    // Log audit
    await logAudit(user.id, "BACKUP_CREATED", "system", undefined, {
      recordCounts: metadata.recordCounts,
    });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${filename}`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("[backup] Error creating backup:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create backup" },
      { status: 500 }
    );
  }
}
