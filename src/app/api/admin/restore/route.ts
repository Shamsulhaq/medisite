// -----------------------------------------------------------------------------
// Restore API — accepts a ZIP file upload and imports data into database.
// POST /api/admin/restore
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
  }

  if (!file.name.endsWith(".zip")) {
    return NextResponse.json({ ok: false, error: "File must be a .zip archive" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    // Validate ZIP structure
    const entryNames = entries.map((e) => e.entryName);
    if (!entryNames.includes("metadata.json")) {
      return NextResponse.json(
        { ok: false, error: "Invalid backup file: missing metadata.json" },
        { status: 400 }
      );
    }

    // Parse JSON files from ZIP
    const parseEntry = <T>(name: string): T[] => {
      const entry = zip.getEntry(name);
      if (!entry) return [];
      const content = entry.getData().toString("utf8");
      return JSON.parse(content) as T[];
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const patientsData = parseEntry<any>("patients.json");
    const appointmentsData = parseEntry<any>("appointments.json");
    const blogPostsData = parseEntry<any>("blog_posts.json");
    const blogRevisionsData = parseEntry<any>("blog_revisions.json");
    const settingsData = parseEntry<any>("settings.json");
    const usersData = parseEntry<any>("users.json");
    const medicinesData = parseEntry<any>("medicines.json");
    const investigationsData = parseEntry<any>("investigations.json");
    const auditLogsData = parseEntry<any>("audit_logs.json");
    const uploadSessionsData = parseEntry<any>("upload_sessions.json");
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Execute restore in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete in reverse dependency order
      await tx.auditLog.deleteMany();
      await tx.uploadSession.deleteMany();
      await tx.blogRevision.deleteMany();
      await tx.testReport.deleteMany();
      await tx.consultation.deleteMany();
      await tx.appointment.deleteMany();
      await tx.patient.deleteMany();
      await tx.blogPost.deleteMany();
      await tx.setting.deleteMany();

      // Insert in dependency order
      // Settings
      if (settingsData.length > 0) {
        for (const s of settingsData) {
          await tx.setting.create({
            data: {
              id: s.id,
              data: s.data,
              updatedAt: new Date(s.updatedAt),
            },
          });
        }
      }

      // Patients (without relations - they come separately in the included data)
      if (patientsData.length > 0) {
        for (const p of patientsData) {
          await tx.patient.create({
            data: {
              id: p.id,
              patientId: p.patientId,
              name: p.name,
              age: p.age ?? "",
              gender: p.gender ?? "",
              phone: p.phone,
              email: p.email ?? "",
              address: p.address ?? "",
              notes: p.notes ?? "",
              pendingVitalsBp: p.pendingVitalsBp ?? "",
              pendingVitalsPulse: p.pendingVitalsPulse ?? "",
              pendingVitalsWeight: p.pendingVitalsWeight ?? "",
              pendingVitalsSpo2: p.pendingVitalsSpo2 ?? "",
              pendingVitalsTemp: p.pendingVitalsTemp ?? "",
              pendingVitalsComplaint: p.pendingVitalsComplaint ?? "",
              pendingVitalsBy: p.pendingVitalsBy ?? "",
              pendingVitalsByName: p.pendingVitalsByName ?? "",
              pendingVitalsAt: p.pendingVitalsAt ?? "",
              createdAt: new Date(p.createdAt),
              updatedAt: new Date(p.updatedAt),
            },
          });

          // Insert consultations from the included relation
          if (p.consultations?.length > 0) {
            for (const c of p.consultations) {
              await tx.consultation.create({
                data: {
                  id: c.id,
                  patientId: c.patientId,
                  date: c.date,
                  chamberId: c.chamberId ?? null,
                  chiefComplaint: c.chiefComplaint ?? [],
                  history: c.history ?? "",
                  onExamination: c.onExamination ?? "",
                  diagnosis: c.diagnosis ?? [],
                  vitalsBp: c.vitalsBp ?? "",
                  vitalsPulse: c.vitalsPulse ?? "",
                  vitalsWeight: c.vitalsWeight ?? "",
                  vitalsSpo2: c.vitalsSpo2 ?? "",
                  vitalsTemp: c.vitalsTemp ?? "",
                  vitalsOthers: c.vitalsOthers ?? "",
                  medicines: c.medicines ?? [],
                  advices: c.advices ?? [],
                  investigations: c.investigations ?? [],
                  investigationDiscount: c.investigationDiscount ?? 0,
                  followUp: c.followUp ?? "",
                  notes: c.notes ?? "",
                  attachment: c.attachment ?? "",
                  paymentFee: c.paymentFee ?? 0,
                  paymentReceived: c.paymentReceived ?? 0,
                  paymentDiscount: c.paymentDiscount ?? 0,
                  paymentStatus: c.paymentStatus ?? "unpaid",
                  previousVersionId: c.previousVersionId ?? null,
                  superseded: c.superseded ?? false,
                  publicToken: c.publicToken,
                  createdAt: new Date(c.createdAt),
                  updatedAt: new Date(c.updatedAt),
                },
              });
            }
          }

          // Insert test reports from the included relation
          if (p.testReports?.length > 0) {
            for (const tr of p.testReports) {
              await tx.testReport.create({
                data: {
                  id: tr.id,
                  patientId: tr.patientId,
                  date: tr.date,
                  title: tr.title,
                  result: tr.result ?? "",
                  attachment: tr.attachment ?? "",
                  createdAt: new Date(tr.createdAt),
                },
              });
            }
          }
        }
      }

      // Appointments
      if (appointmentsData.length > 0) {
        for (const a of appointmentsData) {
          await tx.appointment.create({
            data: {
              id: a.id,
              name: a.name,
              email: a.email ?? "",
              phone: a.phone,
              mode: a.mode ?? "offline",
              location: a.location ?? "",
              date: a.date,
              time: a.time,
              reason: a.reason ?? "",
              status: a.status ?? "pending",
              createdAt: new Date(a.createdAt),
            },
          });
        }
      }

      // Blog posts
      if (blogPostsData.length > 0) {
        for (const bp of blogPostsData) {
          await tx.blogPost.create({
            data: {
              id: bp.id,
              slug: bp.slug,
              title: bp.title,
              excerpt: bp.excerpt,
              body: bp.body,
              date: bp.date,
              readingMinutes: bp.readingMinutes ?? 4,
              tags: bp.tags ?? [],
              coverImage: bp.coverImage ?? "",
              published: bp.published ?? false,
              category: bp.category ?? "",
              metaTitle: bp.metaTitle ?? "",
              metaDescription: bp.metaDescription ?? "",
              ogImage: bp.ogImage ?? "",
              reviewedBy: bp.reviewedBy ?? "",
              reviewedDate: bp.reviewedDate ?? "",
              references: bp.references ?? "",
              disclaimer: bp.disclaimer ?? "",
              scheduledDate: bp.scheduledDate ?? "",
              viewCount: bp.viewCount ?? 0,
              createdAt: new Date(bp.createdAt),
              updatedAt: new Date(bp.updatedAt),
            },
          });
        }
      }

      // Blog revisions
      if (blogRevisionsData.length > 0) {
        for (const br of blogRevisionsData) {
          await tx.blogRevision.create({
            data: {
              id: br.id,
              postId: br.postId,
              data: br.data,
              createdAt: new Date(br.createdAt),
            },
          });
        }
      }

      // Users — only update existing or skip (don't replace password data)
      // We keep users as-is since backup doesn't include hashes
      if (usersData.length > 0) {
        for (const u of usersData) {
          const existing = await tx.user.findUnique({ where: { id: u.id } });
          if (!existing) {
            // Cannot create user without password hash — skip new users from backup
            continue;
          }
          // Update non-sensitive fields
          await tx.user.update({
            where: { id: u.id },
            data: {
              displayName: u.displayName ?? "",
              active: u.active ?? true,
              permissions: u.permissions ?? {},
            },
          });
        }
      }

      // Medicines — MERGE (keep existing + add new)
      if (medicinesData.length > 0) {
        for (const m of medicinesData) {
          const existing = await tx.medicine.findUnique({ where: { id: m.id } });
          if (!existing) {
            // Check by generic name too
            const byGeneric = await tx.medicine.findUnique({
              where: { generic: m.generic },
            });
            if (!byGeneric) {
              await tx.medicine.create({
                data: {
                  id: m.id,
                  generic: m.generic,
                  brands: m.brands ?? [],
                  forms: m.forms ?? [],
                  dosages: m.dosages ?? [],
                  defaultAdvice: m.defaultAdvice ?? "",
                  createdAt: new Date(m.createdAt),
                  updatedAt: new Date(m.updatedAt),
                },
              });
            }
          }
        }
      }

      // Investigations — MERGE (keep existing + add new)
      if (investigationsData.length > 0) {
        for (const inv of investigationsData) {
          const existing = await tx.investigation.findUnique({ where: { id: inv.id } });
          if (!existing) {
            const byName = await tx.investigation.findUnique({
              where: { name: inv.name },
            });
            if (!byName) {
              await tx.investigation.create({
                data: {
                  id: inv.id,
                  name: inv.name,
                  category: inv.category ?? "",
                  aliases: inv.aliases ?? [],
                  createdAt: new Date(inv.createdAt),
                  updatedAt: new Date(inv.updatedAt),
                },
              });
            }
          }
        }
      }

      // Audit logs
      if (auditLogsData.length > 0) {
        for (const log of auditLogsData) {
          await tx.auditLog.create({
            data: {
              id: log.id,
              userId: log.userId,
              userName: log.userName,
              userRole: log.userRole,
              action: log.action,
              entity: log.entity,
              entityId: log.entityId ?? null,
              details: log.details ?? null,
              createdAt: new Date(log.createdAt),
            },
          });
        }
      }

      // Upload sessions
      if (uploadSessionsData.length > 0) {
        for (const us of uploadSessionsData) {
          await tx.uploadSession.create({
            data: {
              id: us.id,
              token: us.token,
              patientId: us.patientId,
              targetType: us.targetType ?? "attachment",
              targetId: us.targetId ?? "",
              files: us.files ?? [],
              status: us.status ?? "waiting",
              createdAt: new Date(us.createdAt),
              expiresAt: new Date(us.expiresAt),
            },
          });
        }
      }
    });

    const counts = {
      patients: patientsData.length,
      appointments: appointmentsData.length,
      blogPosts: blogPostsData.length,
      blogRevisions: blogRevisionsData.length,
      settings: settingsData.length,
      medicines: medicinesData.length,
      investigations: investigationsData.length,
      auditLogs: auditLogsData.length,
      uploadSessions: uploadSessionsData.length,
    };

    // Log audit
    await logAudit(user.id, "DATA_RESTORED", "system", undefined, { counts });

    return NextResponse.json({ ok: true, counts });
  } catch (error) {
    console.error("[restore] Error restoring backup:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to restore backup. Please check the file format." },
      { status: 500 }
    );
  }
}
