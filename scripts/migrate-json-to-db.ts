// -----------------------------------------------------------------------------
// Migration script: JSON files → PostgreSQL (Prisma)
// Run with: npx tsx scripts/migrate-json-to-db.ts
// Reads existing JSON data and imports it into the PostgreSQL database.
// Handles missing files gracefully.
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), "data");

async function readJsonFile<T>(filename: string): Promise<T | null> {
  const filepath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filepath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "ENOENT") {
      console.log(`  ⚠ ${filename} not found, skipping.`);
    } else {
      console.log(`  ⚠ Error reading ${filename}:`, err);
    }
    return null;
  }
}

// ---- Migrate Auth -----------------------------------------------------------

async function migrateAuth() {
  console.log("\n📦 Migrating auth...");
  const data = await readJsonFile<{ username: string; salt: string; hash: string }>("auth.json");
  if (!data) return;

  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    console.log(`  ✓ User "${data.username}" already exists, skipping.`);
    return;
  }

  await prisma.user.create({
    data: {
      username: data.username,
      salt: data.salt,
      hash: data.hash,
      role: "DOCTOR",
      displayName: data.username,
      active: true,
      permissions: {
        canCreatePatient: true,
        canAddVitals: true,
        canConfirmAppointment: true,
        canPrintPrescription: true,
        canCollectFee: true,
        canViewPatients: true,
        canViewAppointments: true,
        canWriteRx: true,
        canEditConsultation: true,
        canManageSettings: true,
        canManageBlog: true,
        canManageMedicines: true,
        canManageUsers: true,
      },
    },
  });
  console.log(`  ✓ Migrated user: ${data.username} (DOCTOR)`);
}

// ---- Migrate Settings -------------------------------------------------------

async function migrateSettings() {
  console.log("\n📦 Migrating settings...");
  const data = await readJsonFile<Record<string, unknown>>("settings.json");
  if (!data) return;

  await prisma.setting.upsert({
    where: { id: "main" },
    create: { id: "main", data: data as object },
    update: { data: data as object },
  });
  console.log("  ✓ Settings migrated.");
}

// ---- Migrate Blog Posts -----------------------------------------------------

async function migratePosts() {
  console.log("\n📦 Migrating blog posts...");
  const data = await readJsonFile<Array<Record<string, unknown>>>("posts.json");
  if (!data || !Array.isArray(data)) return;

  let count = 0;
  for (const post of data) {
    const id = String(post.id ?? "");
    if (!id) continue;

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (existing) continue;

    // Ensure slug is unique
    let slug = String(post.slug ?? "post");
    const slugExists = await prisma.blogPost.findUnique({ where: { slug } });
    if (slugExists) slug = `${slug}-${Date.now()}`;

    await prisma.blogPost.create({
      data: {
        id,
        slug,
        title: (post.title ?? { en: "", bn: "" }) as Record<string, string>,
        excerpt: (post.excerpt ?? { en: "", bn: "" }) as Record<string, string>,
        body: (post.body ?? { en: "", bn: "" }) as Record<string, string>,
        date: String(post.date ?? new Date().toISOString().split("T")[0]),
        readingMinutes: Number(post.readingMinutes) || 4,
        tags: Array.isArray(post.tags) ? post.tags as string[] : [],
        coverImage: String(post.coverImage ?? ""),
        published: Boolean(post.published),
      },
    });
    count++;
  }
  console.log(`  ✓ Migrated ${count} blog posts.`);
}

// ---- Migrate Patients -------------------------------------------------------

async function migratePatients() {
  console.log("\n📦 Migrating patients...");
  const data = await readJsonFile<Array<Record<string, unknown>>>("patients.json");
  if (!data || !Array.isArray(data)) return;

  let patientCount = 0;
  let consultCount = 0;
  let reportCount = 0;

  for (const p of data) {
    const id = String(p.id ?? "");
    if (!id) continue;

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (existing) continue;

    // Ensure phone uniqueness
    const phone = String(p.phone ?? "").replace(/[\s\-()]/g, "");
    if (!phone) continue;

    const phoneExists = await prisma.patient.findFirst({ where: { phone } });
    if (phoneExists) {
      console.log(`  ⚠ Skipping patient "${p.name}" — phone ${phone} already exists.`);
      continue;
    }

    // Ensure patientId uniqueness
    let patientId = String(p.patientId ?? "");
    if (!patientId) patientId = `P-${String(patientCount + 1).padStart(4, "0")}`;
    const pidExists = await prisma.patient.findFirst({ where: { patientId } });
    if (pidExists) patientId = `P-${Date.now()}`;

    await prisma.patient.create({
      data: {
        id,
        patientId,
        name: String(p.name ?? ""),
        age: String(p.age ?? ""),
        gender: String(p.gender ?? ""),
        phone,
        email: String(p.email ?? ""),
        address: String(p.address ?? ""),
        notes: String(p.notes ?? ""),
        createdAt: p.createdAt ? new Date(String(p.createdAt)) : new Date(),
        updatedAt: p.updatedAt ? new Date(String(p.updatedAt)) : new Date(),
      },
    });
    patientCount++;

    // Migrate consultations
    const consultations = Array.isArray(p.consultations) ? p.consultations : [];
    for (const c of consultations as Array<Record<string, unknown>>) {
      const vitals = (c.vitals ?? {}) as Record<string, string>;
      const payment = (c.payment ?? {}) as Record<string, unknown>;
      const medicines = Array.isArray(c.medicines) ? c.medicines : [];

      await prisma.consultation.create({
        data: {
          id: String(c.id ?? crypto.randomUUID()),
          patientId: id,
          date: String(c.date ?? ""),
          chamberId: c.chamberId ? String(c.chamberId) : null,
          chiefComplaint: Array.isArray(c.chiefComplaint) ? c.chiefComplaint as string[] : [],
          history: String(c.history ?? ""),
          onExamination: String(c.onExamination ?? ""),
          diagnosis: Array.isArray(c.diagnosis) ? c.diagnosis as string[] : [],
          vitalsBp: String(vitals.bp ?? ""),
          vitalsPulse: String(vitals.pulse ?? ""),
          vitalsWeight: String(vitals.weight ?? ""),
          vitalsSpo2: String(vitals.spo2 ?? ""),
          vitalsTemp: String(vitals.temperature ?? ""),
          vitalsOthers: String(vitals.others ?? ""),
          medicines: medicines as unknown as object,
          advices: Array.isArray(c.advices) ? c.advices as string[] : [],
          followUp: String(c.followUp ?? ""),
          notes: String(c.notes ?? ""),
          attachment: String(c.attachment ?? ""),
          paymentFee: Number(payment.fee) || 0,
          paymentReceived: Number(payment.received) || 0,
          paymentDiscount: Number(payment.discount) || 0,
          paymentStatus: String(payment.status ?? "unpaid"),
          previousVersionId: c.previousVersionId ? String(c.previousVersionId) : null,
          superseded: Boolean(c.superseded),
          createdAt: c.date ? new Date(String(c.date)) : new Date(),
        },
      });
      consultCount++;
    }

    // Migrate test reports
    const testReports = Array.isArray(p.testReports) ? p.testReports : [];
    for (const t of testReports as Array<Record<string, unknown>>) {
      await prisma.testReport.create({
        data: {
          id: String(t.id ?? crypto.randomUUID()),
          patientId: id,
          date: String(t.date ?? ""),
          title: String(t.title ?? ""),
          result: String(t.result ?? ""),
          attachment: String(t.attachment ?? ""),
        },
      });
      reportCount++;
    }
  }
  console.log(`  ✓ Migrated ${patientCount} patients, ${consultCount} consultations, ${reportCount} test reports.`);
}

// ---- Migrate Appointments ---------------------------------------------------

async function migrateAppointments() {
  console.log("\n📦 Migrating appointments...");
  const data = await readJsonFile<Array<Record<string, unknown>>>("appointments.json");
  if (!data || !Array.isArray(data)) return;

  let count = 0;
  for (const a of data) {
    const id = String(a.id ?? "");
    if (!id) continue;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (existing) continue;

    await prisma.appointment.create({
      data: {
        id,
        name: String(a.name ?? ""),
        email: String(a.email ?? ""),
        phone: String(a.phone ?? ""),
        mode: String(a.mode ?? "offline"),
        location: String(a.location ?? ""),
        date: String(a.date ?? ""),
        time: String(a.time ?? ""),
        reason: String(a.reason ?? ""),
        status: String(a.status ?? "pending"),
        createdAt: a.createdAt ? new Date(String(a.createdAt)) : new Date(),
      },
    });
    count++;
  }
  console.log(`  ✓ Migrated ${count} appointments.`);
}

// ---- Migrate Medicines ------------------------------------------------------

async function migrateMedicines() {
  console.log("\n📦 Migrating medicines...");
  const data = await readJsonFile<Array<Record<string, unknown>>>("medicines.json");
  if (!data || !Array.isArray(data)) return;

  // Clear existing and insert all
  const existingCount = await prisma.medicine.count();
  if (existingCount > 0) {
    console.log(`  ⚠ Medicine table already has ${existingCount} entries. Skipping.`);
    return;
  }

  let count = 0;
  for (const m of data) {
    const generic = String(m.generic ?? "");
    if (!generic) continue;

    try {
      await prisma.medicine.create({
        data: {
          generic,
          brands: Array.isArray(m.brands) ? m.brands as string[] : [],
          forms: Array.isArray(m.forms) ? m.forms as string[] : [],
          dosages: Array.isArray(m.dosages) ? m.dosages as string[] : [],
          defaultAdvice: String(m.defaultAdvice ?? ""),
        },
      });
      count++;
    } catch (err: unknown) {
      // Skip duplicates
      const code = (err as { code?: string }).code;
      if (code === "P2002") continue; // unique constraint violation
      throw err;
    }
  }
  console.log(`  ✓ Migrated ${count} medicines.`);
}

// ---- Main -------------------------------------------------------------------

async function main() {
  console.log("🚀 Starting JSON → PostgreSQL migration...");
  console.log(`   Data directory: ${DATA_DIR}`);

  await migrateAuth();
  await migrateSettings();
  await migratePosts();
  await migratePatients();
  await migrateAppointments();
  await migrateMedicines();

  console.log("\n✅ Migration complete!");
}

main()
  .catch((err) => {
    console.error("\n❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
