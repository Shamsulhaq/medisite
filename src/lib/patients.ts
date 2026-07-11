// -----------------------------------------------------------------------------
// Patient records store (data/patients.json). PRIVATE medical data — only ever
// accessed from admin (authenticated) routes. Never exposed on the public site.
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type HistoryEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  note: string;
};

export type Vitals = {
  bp: string; // e.g. "125/85 mmHg"
  pulse: string; // e.g. "74 PM"
  weight: string; // e.g. "71 kg"
  spo2: string; // e.g. "99%"
  temperature: string; // e.g. "98.6°F"
  others: string; // e.g. "Lungs: Clear"
};

export type MedicineEntry = {
  name: string; // brand or generic name e.g. "Symbion 6/200"
  generic: string; // generic/salt name
  type: "generic" | "brand";
  form: string; // e.g. "Cap.", "Tab.", "Spray"
  dosage: string; // e.g. "6/200", "10 mg", "27.5 mcg"
  frequency: string; // e.g. "1+0+1"
  timing: string; // e.g. "খাওয়ার আগে", "After meal"
  duration: string; // e.g. "2 মাস", "7 days"
  specialNote: string; // e.g. "ও প্রয়োজনে, ব্যবহারের পর কুলি করবেন"
};

export type Consultation = {
  id: string;
  date: string; // YYYY-MM-DD
  chamberId?: string; // which chamber this consultation happened at
  // Patient vitals & examination
  vitals: Vitals;
  chiefComplaint: string[]; // bullet list
  history: string; // vaccination, allergy notes
  onExamination: string; // additional exam findings
  diagnosis: string[]; // bullet list
  // Prescription (Rx)
  medicines: MedicineEntry[];
  advices: string[]; // numbered advice list
  followUp: string; // e.g. "৪ সপ্তাহ পর"
  notes: string;
  attachment?: string;
  // Payment
  payment?: {
    fee: number;
    received: number;
    discount: number;
    status: "paid" | "unpaid" | "partial";
  };
  // Audit trail
  previousVersionId?: string; // points to the consultation this one supersedes
  superseded?: boolean; // true if a newer version exists
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
  patientId: string; // sequential e.g. "P-0001"
  name: string;
  age: string;
  gender: string;
  phone: string; // unique identifier — no duplicates allowed
  email: string;
  address: string;
  notes: string;
  visits: Visit[]; // legacy
  consultations: Consultation[];
  history: HistoryEntry[];
  prescriptions: Prescription[];
  testReports: TestReport[];
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

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "patients.json");

async function readAll(): Promise<Patient[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
    return [];
  }
}

async function writeAll(patients: Patient[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(patients, null, 2), "utf8");
}

function normalize(p: Partial<Patient>): Patient {
  const now = new Date().toISOString();
  return {
    id: p.id ?? crypto.randomUUID(),
    patientId: p.patientId ?? "",
    name: p.name ?? "",
    age: p.age ?? "",
    gender: p.gender ?? "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    address: p.address ?? "",
    notes: p.notes ?? "",
    visits: Array.isArray(p.visits) ? p.visits : [],
    consultations: Array.isArray(p.consultations) ? p.consultations : [],
    history: Array.isArray(p.history) ? p.history : [],
    prescriptions: Array.isArray(p.prescriptions) ? p.prescriptions : [],
    testReports: Array.isArray(p.testReports) ? p.testReports : [],
    createdAt: p.createdAt ?? now,
    updatedAt: p.updatedAt ?? now,
  };
}

function nextPatientId(patients: Patient[]): string {
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

export async function findByPhone(phone: string): Promise<Patient | undefined> {
  const normalized = phone.replace(/[\s\-()]/g, "");
  return (await getPatients()).find(
    (p) => p.phone.replace(/[\s\-()]/g, "") === normalized
  );
}

export async function getPatients(): Promise<Patient[]> {
  const patients = (await readAll()).map(normalize);
  return patients.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  return (await getPatients()).find((p) => p.id === id);
}

export async function createPatient(
  input: PatientInfoInput
): Promise<{ patient?: Patient; error?: string }> {
  const patients = await readAll();
  // Duplicate phone check
  const normalizedPhone = input.phone.replace(/[\s\-()]/g, "");
  const dup = patients.find(
    (p) => p.phone.replace(/[\s\-()]/g, "") === normalizedPhone
  );
  if (dup) {
    return { error: `A patient with this phone already exists (${dup.patientId}: ${dup.name}).` };
  }
  const patient = normalize({
    ...input,
    patientId: nextPatientId(patients),
  });
  patients.push(patient);
  await writeAll(patients);
  return { patient };
}

export async function updatePatientInfo(
  id: string,
  input: PatientInfoInput
): Promise<Patient | undefined> {
  const patients = await readAll();
  const idx = patients.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  patients[idx] = normalize({
    ...patients[idx],
    ...input,
    updatedAt: new Date().toISOString(),
  });
  await writeAll(patients);
  return patients[idx];
}

export async function deletePatient(id: string): Promise<boolean> {
  const patients = await readAll();
  const next = patients.filter((p) => p.id !== id);
  if (next.length === patients.length) return false;
  await writeAll(next);
  return true;
}

type RecordData =
  | Omit<HistoryEntry, "id">
  | Omit<Prescription, "id">
  | Omit<TestReport, "id">;

export async function addRecord(
  patientId: string,
  kind: RecordKind,
  data: RecordData
): Promise<boolean> {
  const patients = await readAll();
  const idx = patients.findIndex((p) => p.id === patientId);
  if (idx === -1) return false;
  const patient = normalize(patients[idx]);
  const entry = { id: crypto.randomUUID(), ...data };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (patient[kind] as any[]).unshift(entry);
  patient.updatedAt = new Date().toISOString();
  patients[idx] = patient;
  await writeAll(patients);
  return true;
}

export async function deleteRecord(
  patientId: string,
  kind: RecordKind,
  recordId: string
): Promise<boolean> {
  const patients = await readAll();
  const idx = patients.findIndex((p) => p.id === patientId);
  if (idx === -1) return false;
  const patient = normalize(patients[idx]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patient[kind] = (patient[kind] as any[]).filter(
    (r) => r.id !== recordId
  ) as never;
  patient.updatedAt = new Date().toISOString();
  patients[idx] = patient;
  await writeAll(patients);
  return true;
}

export async function markConsultationSuperseded(
  patientId: string,
  consultationId: string
): Promise<boolean> {
  const patients = await readAll();
  const idx = patients.findIndex((p) => p.id === patientId);
  if (idx === -1) return false;
  const patient = normalize(patients[idx]);
  const con = patient.consultations.find((c) => c.id === consultationId);
  if (!con) return false;
  con.superseded = true;
  patient.updatedAt = new Date().toISOString();
  patients[idx] = patient;
  await writeAll(patients);
  return true;
}
