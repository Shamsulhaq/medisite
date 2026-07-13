// -----------------------------------------------------------------------------
// Patient records store — backed by PostgreSQL via Prisma.
// PRIVATE medical data — only accessed from admin (authenticated) routes.
// Maintains the same external API as the previous JSON-file-based version.
// -----------------------------------------------------------------------------

import crypto from "crypto";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export type HistoryEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  note: string;
};

export type Vitals = {
  bp: string;
  pulse: string;
  weight: string;
  spo2: string;
  temperature: string;
  others: string;
};

export type MedicineEntry = {
  name: string;
  generic: string;
  type: "generic" | "brand";
  form: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
  specialNote: string;
};

export type Consultation = {
  id: string;
  date: string;
  chamberId?: string;
  vitals: Vitals;
  chiefComplaint: string[];
  history: string;
  onExamination: string;
  diagnosis: string[];
  medicines: MedicineEntry[];
  investigations: string[]; // ordered tests/investigations
  investigationDiscount: number;
  advices: string[];
  followUp: string;
  notes: string;
  attachment?: string;
  payment?: {
    fee: number;
    received: number;
    discount: number;
    status: "paid" | "unpaid" | "partial";
  };
  previousVersionId?: string;
  superseded?: boolean;
  publicToken?: string;
  _qrSvgBase64?: string; // transient, not stored — used for print rendering
};

// Legacy types kept for backward compatibility with existing data
export type Visit = {
  id: string;
  date: string;
  time: string;
  vitals: Vitals;
  chiefComplaint: string;
  notes: string;
  prescriptionId?: string;
};

export type Prescription = {
  id: string;
  date: string;
  visitId?: string;
  diagnosis: string;
  medicines: MedicineEntry[];
  advice: string;
  followUp: string;
  notes: string;
  attachment?: string;
};

export type TestReport = {
  id: string;
  date: string;
  title: string;
  result: string;
  attachment?: string;
};

export type Patient = {
  id: string;
  patientId: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  visits: Visit[];
  consultations: Consultation[];
  history: HistoryEntry[];
  prescriptions: Prescription[];
  testReports: TestReport[];
  pendingVitals?: {
    bp: string;
    spo2: string;
    weight: string;
    temperature: string;
    pulse: string;
    complaint: string;
    recordedBy: string;
    recordedByName: string;
    recordedAt: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type PatientInfoInput = {
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export type RecordKind = "consultations" | "visits" | "history" | "prescriptions" | "testReports";

// ---- Helpers ---------------------------------------------------------------

function dbConsultationToType(row: {
  id: string;
  date: string;
  chamberId: string | null;
  chiefComplaint: string[];
  history: string;
  onExamination: string;
  diagnosis: string[];
  vitalsBp: string;
  vitalsPulse: string;
  vitalsWeight: string;
  vitalsSpo2: string;
  vitalsTemp: string;
  vitalsOthers: string;
  medicines: unknown;
  investigations: string[];
  investigationDiscount: number;
  advices: string[];
  followUp: string;
  notes: string;
  attachment: string;
  paymentFee: number;
  paymentReceived: number;
  paymentDiscount: number;
  paymentStatus: string;
  previousVersionId: string | null;
  superseded: boolean;
  publicToken: string;
}): Consultation {
  return {
    id: row.id,
    date: row.date,
    chamberId: row.chamberId ?? undefined,
    vitals: {
      bp: row.vitalsBp,
      pulse: row.vitalsPulse,
      weight: row.vitalsWeight,
      spo2: row.vitalsSpo2,
      temperature: row.vitalsTemp,
      others: row.vitalsOthers,
    },
    chiefComplaint: row.chiefComplaint,
    history: row.history,
    onExamination: row.onExamination,
    diagnosis: row.diagnosis,
    medicines: Array.isArray(row.medicines) ? row.medicines as MedicineEntry[] : [],
    investigations: row.investigations ?? [],
    investigationDiscount: row.investigationDiscount ?? 0,
    advices: row.advices,
    followUp: row.followUp,
    notes: row.notes,
    attachment: row.attachment || undefined,
    payment: {
      fee: row.paymentFee,
      received: row.paymentReceived,
      discount: row.paymentDiscount,
      status: row.paymentStatus as "paid" | "unpaid" | "partial",
    },
    previousVersionId: row.previousVersionId ?? undefined,
    superseded: row.superseded,
    publicToken: row.publicToken,
  };
}

function dbTestReportToType(row: {
  id: string;
  date: string;
  title: string;
  result: string;
  attachment: string;
}): TestReport {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    result: row.result,
    attachment: row.attachment || undefined,
  };
}

function dbPatientToType(row: {
  id: string;
  patientId: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  pendingVitalsBp?: string;
  pendingVitalsPulse?: string;
  pendingVitalsWeight?: string;
  pendingVitalsSpo2?: string;
  pendingVitalsTemp?: string;
  pendingVitalsComplaint?: string;
  pendingVitalsBy?: string;
  pendingVitalsByName?: string;
  pendingVitalsAt?: string;
  consultations?: Array<{
    id: string;
    date: string;
    chamberId: string | null;
    chiefComplaint: string[];
    history: string;
    onExamination: string;
    diagnosis: string[];
    vitalsBp: string;
    vitalsPulse: string;
    vitalsWeight: string;
    vitalsSpo2: string;
    vitalsTemp: string;
    vitalsOthers: string;
    medicines: unknown;
    advices: string[];
    investigations: string[];
    investigationDiscount: number;
    followUp: string;
    notes: string;
    attachment: string;
    paymentFee: number;
    paymentReceived: number;
    paymentDiscount: number;
    paymentStatus: string;
    previousVersionId: string | null;
    superseded: boolean;
    publicToken: string;
  }>;
  testReports?: Array<{
    id: string;
    date: string;
    title: string;
    result: string;
    attachment: string;
  }>;
}): Patient {
  return {
    id: row.id,
    patientId: row.patientId,
    name: row.name,
    age: row.age,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    visits: [], // legacy — not stored in new DB
    consultations: (row.consultations ?? []).map((r: any) => dbConsultationToType(r)),
    history: [], // legacy — not stored in new DB
    prescriptions: [], // legacy — not stored in new DB
    testReports: (row.testReports ?? []).map(dbTestReportToType),
    pendingVitals: row.pendingVitalsAt ? {
      bp: row.pendingVitalsBp ?? "",
      spo2: row.pendingVitalsSpo2 ?? "",
      weight: row.pendingVitalsWeight ?? "",
      temperature: row.pendingVitalsTemp ?? "",
      pulse: row.pendingVitalsPulse ?? "",
      complaint: row.pendingVitalsComplaint ?? "",
      recordedBy: row.pendingVitalsBy ?? "",
      recordedByName: row.pendingVitalsByName ?? "",
      recordedAt: row.pendingVitalsAt ?? "",
    } : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function nextPatientId(): Promise<string> {
  // Get the max patientId sequence number from DB
  const patients = await prisma.patient.findMany({
    select: { patientId: true },
    orderBy: { patientId: "desc" },
    take: 1,
  });
  let max = 0;
  for (const p of patients) {
    const m = /^P-(\d+)$/.exec(p.patientId);
    if (m) {
      const n = Number(m[1]);
      if (n > max) max = n;
    }
  }
  return `P-${String(max + 1).padStart(4, "0")}`;
}

// ---- Public API ------------------------------------------------------------

export async function findByPhone(phone: string): Promise<Patient | undefined> {
  const normalized = phone.replace(/[\s\-()]/g, "");
  // Try exact match first
  const row = await prisma.patient.findFirst({
    where: { phone: normalized },
    include: { consultations: { orderBy: { date: "desc" } }, testReports: { orderBy: { date: "desc" } } },
  });
  if (row) return dbPatientToType(row);

  // Fallback: search all patients with loose match
  const all = await prisma.patient.findMany({
    include: { consultations: { orderBy: { date: "desc" } }, testReports: { orderBy: { date: "desc" } } },
  });
  const found = all.find(
    (p) => p.phone.replace(/[\s\-()]/g, "") === normalized
  );
  if (found) return dbPatientToType(found);
  return undefined;
}

export async function getPatients(): Promise<Patient[]> {
  const rows = await prisma.patient.findMany({
    include: { consultations: { orderBy: { date: "desc" } }, testReports: { orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(dbPatientToType);
}

// ---- Paginated list (scalable) --------------------------------------------
// A lightweight list row: no nested consultation/test-report records, just
// their counts (via Prisma _count). Used by the paginated patients list so we
// never load every patient's full clinical history just to render a table.

export type PatientListItem = {
  id: string;
  patientId: string;
  name: string;
  phone: string;
  email: string;
  age: string;
  gender: string;
  createdAt: string;
  updatedAt: string;
  consultationCount: number;
  testReportCount: number;
};

export type PatientSort = "lastVisit" | "name" | "patientId" | "created";

export interface PatientsQuery {
  page?: number;
  perPage?: number;
  q?: string;
  gender?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  sort?: PatientSort;
}

export interface PatientsPageResult {
  items: PatientListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function getPatientsPage(
  query: PatientsQuery = {}
): Promise<PatientsPageResult> {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const perPage = Math.min(100, Math.max(5, Math.floor(query.perPage ?? 20)));

  const and: Prisma.PatientWhereInput[] = [];
  const q = query.q?.trim();
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { patientId: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (query.gender && query.gender !== "all") {
    and.push({ gender: query.gender });
  }
  if (query.from) {
    and.push({ createdAt: { gte: new Date(`${query.from}T00:00:00.000`) } });
  }
  if (query.to) {
    and.push({ createdAt: { lte: new Date(`${query.to}T23:59:59.999`) } });
  }
  const where: Prisma.PatientWhereInput = and.length ? { AND: and } : {};

  const orderBy: Prisma.PatientOrderByWithRelationInput =
    query.sort === "name"
      ? { name: "asc" }
      : query.sort === "patientId"
        ? { patientId: "asc" }
        : query.sort === "created"
          ? { createdAt: "desc" }
          : { updatedAt: "desc" }; // "lastVisit" (default)

  const [rows, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        patientId: true,
        name: true,
        phone: true,
        email: true,
        age: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { consultations: true, testReports: true } },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  const items: PatientListItem[] = rows.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    name: r.name,
    phone: r.phone,
    email: r.email,
    age: r.age,
    gender: r.gender,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    consultationCount: r._count.consultations,
    testReportCount: r._count.testReports,
  }));

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

// Lightweight: just the phone column for every patient (used to compute which
// appointments can be imported as new patients, without loading full records).
export async function getPatientPhones(): Promise<string[]> {
  const rows = await prisma.patient.findMany({ select: { phone: true } });
  return rows.map((r) => r.phone);
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  const row = await prisma.patient.findUnique({
    where: { id },
    include: { consultations: { orderBy: { date: "desc" } }, testReports: { orderBy: { date: "desc" } } },
  });
  if (!row) return undefined;
  return dbPatientToType(row);
}

export async function createPatient(
  input: PatientInfoInput
): Promise<{ patient?: Patient; error?: string }> {
  // Duplicate phone check
  const normalizedPhone = input.phone.replace(/[\s\-()]/g, "");
  const existing = await prisma.patient.findFirst({
    where: { phone: normalizedPhone },
  });
  if (existing) {
    return {
      error: `A patient with this phone already exists (${existing.patientId}: ${existing.name}).`,
    };
  }

  const patientId = await nextPatientId();
  const row = await prisma.patient.create({
    data: {
      patientId,
      name: input.name,
      age: input.age || "",
      gender: input.gender || "",
      phone: normalizedPhone,
      email: input.email || "",
      address: input.address || "",
      notes: input.notes || "",
    },
    include: { consultations: true, testReports: true },
  });
  return { patient: dbPatientToType(row) };
}

export async function updatePatientInfo(
  id: string,
  input: PatientInfoInput
): Promise<Patient | undefined> {
  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) return undefined;

  const row = await prisma.patient.update({
    where: { id },
    data: {
      name: input.name,
      age: input.age || "",
      gender: input.gender || "",
      phone: input.phone.replace(/[\s\-()]/g, ""),
      email: input.email || "",
      address: input.address || "",
      notes: input.notes || "",
    },
    include: { consultations: { orderBy: { date: "desc" } }, testReports: { orderBy: { date: "desc" } } },
  });
  return dbPatientToType(row);
}

export async function deletePatient(id: string): Promise<boolean> {
  try {
    await prisma.patient.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

type RecordData =
  | Omit<HistoryEntry, "id">
  | Omit<Prescription, "id">
  | Omit<TestReport, "id">
  | Omit<Consultation, "id">;

export async function addRecord(
  patientId: string,
  kind: RecordKind,
  data: RecordData
): Promise<boolean> {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return false;

  if (kind === "consultations") {
    const c = data as Omit<Consultation, "id">;
    await prisma.consultation.create({
      data: {
        patientId,
        date: c.date,
        chamberId: c.chamberId ?? null,
        chiefComplaint: c.chiefComplaint ?? [],
        history: c.history ?? "",
        onExamination: c.onExamination ?? "",
        diagnosis: c.diagnosis ?? [],
        vitalsBp: c.vitals?.bp ?? "",
        vitalsPulse: c.vitals?.pulse ?? "",
        vitalsWeight: c.vitals?.weight ?? "",
        vitalsSpo2: c.vitals?.spo2 ?? "",
        vitalsTemp: c.vitals?.temperature ?? "",
        vitalsOthers: c.vitals?.others ?? "",
        medicines: (c.medicines ?? []) as unknown as object,
        investigations: c.investigations ?? [],
        investigationDiscount: c.investigationDiscount ?? 0,
        advices: c.advices ?? [],
        followUp: c.followUp ?? "",
        notes: c.notes ?? "",
        attachment: c.attachment ?? "",
        paymentFee: c.payment?.fee ?? 0,
        paymentReceived: c.payment?.received ?? 0,
        paymentDiscount: c.payment?.discount ?? 0,
        paymentStatus: c.payment?.status ?? "unpaid",
        previousVersionId: c.previousVersionId ?? null,
        superseded: c.superseded ?? false,
      },
    });
    return true;
  }

  if (kind === "testReports") {
    const t = data as Omit<TestReport, "id">;
    await prisma.testReport.create({
      data: {
        patientId,
        date: t.date,
        title: t.title,
        result: t.result ?? "",
        attachment: t.attachment ?? "",
      },
    });
    return true;
  }

  // Legacy kinds (visits, history, prescriptions) — no DB table, ignore gracefully
  return true;
}

export async function deleteRecord(
  patientId: string,
  kind: RecordKind,
  recordId: string
): Promise<boolean> {
  if (kind === "consultations") {
    try {
      await prisma.consultation.delete({ where: { id: recordId } });
      return true;
    } catch {
      return false;
    }
  }
  if (kind === "testReports") {
    try {
      await prisma.testReport.delete({ where: { id: recordId } });
      return true;
    } catch {
      return false;
    }
  }
  // Legacy kinds — no-op
  return true;
}

export async function markConsultationSuperseded(
  patientId: string,
  consultationId: string
): Promise<boolean> {
  try {
    await prisma.consultation.update({
      where: { id: consultationId },
      data: { superseded: true },
    });
    return true;
  } catch {
    return false;
  }
}

// ---- Dashboard-optimised queries -------------------------------------------

/**
 * Returns total patient count using a DB-level COUNT query.
 */
export async function getPatientCount(): Promise<number> {
  return prisma.patient.count();
}

/**
 * Returns today's revenue — sum of paymentReceived for non-superseded
 * consultations dated today.
 */
export async function getTodayRevenue(todayStr: string): Promise<number> {
  const result = await prisma.consultation.aggregate({
    where: { date: todayStr, superseded: false },
    _sum: { paymentReceived: true },
  });
  return result._sum.paymentReceived ?? 0;
}

/**
 * Returns the most recently updated patients (lightweight — no nested records).
 * Used by the dashboard "Recent Patients" section.
 */
export async function getRecentPatients(limit = 5): Promise<
  { id: string; patientId: string; name: string; phone: string; updatedAt: string }[]
> {
  const rows = await prisma.patient.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      patientId: true,
      name: true,
      phone: true,
      updatedAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    name: r.name,
    phone: r.phone,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/**
 * Returns count of patients who had a non-superseded consultation today.
 * Used by the dashboard "Doctor Visited Today" stat.
 */
export async function getDoctorVisitedTodayCount(todayStr: string): Promise<number> {
  // Count distinct patients with consultations dated today (non-superseded)
  const result = await prisma.consultation.findMany({
    where: { date: todayStr, superseded: false },
    select: { patientId: true },
    distinct: ["patientId"],
  });
  return result.length;
}

/**
 * Returns count of patients with pending vitals recorded (non-empty pendingVitalsAt).
 */
export async function getPatientsWithPendingVitalsCount(): Promise<number> {
  return prisma.patient.count({
    where: {
      NOT: { pendingVitalsBp: "" },
      pendingVitalsAt: { not: "" },
    },
  });
}

/**
 * Returns a phone → {id, name} map for patients whose phones match the given
 * list. Used by the dashboard to link appointments to patient records without
 * loading every patient.
 */
export async function getPatientsByPhones(
  phones: string[]
): Promise<Map<string, { id: string; name: string }>> {
  if (phones.length === 0) return new Map();
  // Normalize phones
  const normalized = phones.map((p) => p.replace(/[\s\-()]/g, ""));
  const rows = await prisma.patient.findMany({
    where: { phone: { in: normalized } },
    select: { id: true, name: true, phone: true },
  });
  const map = new Map<string, { id: string; name: string }>();
  for (const r of rows) {
    map.set(r.phone.replace(/[\s\-()]/g, ""), { id: r.id, name: r.name });
  }
  return map;
}

export type FollowUpItem = {
  id: string;
  name: string;
  patientId: string;
  lastVisitDate: string;
  followUp: string;
  daysOverdue: number;
};

/**
 * Returns patients with overdue follow-ups, computed from their latest
 * non-superseded consultation. Only fetches necessary fields.
 */
export async function getRecentFollowUps(limit = 8): Promise<FollowUpItem[]> {
  // Get latest non-superseded consultation per patient that has a followUp value
  // We fetch consultations with followUp and then group by patient
  const consultations = await prisma.consultation.findMany({
    where: {
      superseded: false,
      followUp: { not: "" },
    },
    orderBy: { date: "desc" },
    select: {
      patientId: true,
      date: true,
      followUp: true,
      patient: {
        select: { id: true, patientId: true, name: true },
      },
    },
  });

  // Group by patient — keep only the latest consultation per patient
  const latestPerPatient = new Map<string, typeof consultations[0]>();
  for (const c of consultations) {
    if (!latestPerPatient.has(c.patientId)) {
      latestPerPatient.set(c.patientId, c);
    }
  }

  const now = new Date();
  const results: FollowUpItem[] = [];

  for (const [, c] of latestPerPatient) {
    // Try to extract a follow-up date
    let followUpDate: Date | null = null;
    const dateMatch = c.followUp.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      followUpDate = new Date(dateMatch[1]);
    } else {
      // Try relative durations like "৭ দিন পর", "After 7 days", "1 month পর"
      const daysMatch = c.followUp.match(/(\d+)\s*(দিন|days?)/i);
      const weeksMatch = c.followUp.match(/(\d+)\s*(সপ্তাহ|weeks?)/i);
      const monthsMatch = c.followUp.match(/(\d+)\s*(মাস|months?)/i);
      const visitDate = new Date(c.date);
      if (daysMatch) {
        followUpDate = new Date(visitDate.getTime() + Number(daysMatch[1]) * 86400000);
      } else if (weeksMatch) {
        followUpDate = new Date(visitDate.getTime() + Number(weeksMatch[1]) * 7 * 86400000);
      } else if (monthsMatch) {
        followUpDate = new Date(visitDate);
        followUpDate.setMonth(followUpDate.getMonth() + Number(monthsMatch[1]));
      }
    }

    if (followUpDate && followUpDate < now) {
      const daysOverdue = Math.floor((now.getTime() - followUpDate.getTime()) / 86400000);
      results.push({
        id: c.patient.id,
        name: c.patient.name,
        patientId: c.patient.patientId,
        lastVisitDate: c.date,
        followUp: c.followUp,
        daysOverdue,
      });
    }
  }

  // Sort by most overdue first and limit
  results.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return results.slice(0, limit);
}
