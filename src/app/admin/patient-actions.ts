"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createPatient,
  updatePatientInfo,
  deletePatient,
  addRecord,
  deleteRecord,
  findByPhone,
  markConsultationSuperseded,
  type PatientInfoInput,
  type RecordKind,
} from "@/lib/patients";
import { getAppointments } from "@/lib/appointments";
import { getSettings, saveSettings } from "@/lib/store";
import { addCustomMedicine } from "@/lib/custom-medicines";
import { MEDICINES, searchMedicines } from "@/lib/medicines";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function createPatientAction(
  input: PatientInfoInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  await requireSession();
  if (!input.name?.trim()) {
    return { ok: false, error: "Patient name is required." };
  }
  if (!input.phone?.trim()) {
    return { ok: false, error: "Phone number is required (used as identity)." };
  }
  const { patient, error } = await createPatient(input);
  if (error) return { ok: false, error };
  revalidatePath("/admin/patients");
  return { ok: true, id: patient!.id };
}

export async function createPatientFromAppointmentAction(
  appointmentId: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  await requireSession();
  const appointments = await getAppointments();
  const apt = appointments.find((a) => a.id === appointmentId);
  if (!apt) return { ok: false, error: "Appointment not found." };

  // Check if patient already exists (by phone)
  const existing = await findByPhone(apt.phone);
  if (existing) {
    return { ok: true, id: existing.id, error: `Patient already exists (${existing.patientId}: ${existing.name}). Opening their record.` };
  }

  const { patient, error } = await createPatient({
    name: apt.name,
    age: "",
    gender: "",
    phone: apt.phone,
    email: apt.email,
    address: "",
    notes: `Created from appointment on ${apt.date} (${apt.time}).`,
  });
  if (error) return { ok: false, error };
  revalidatePath("/admin/patients");
  return { ok: true, id: patient!.id };
}

export async function updatePatientAction(
  id: string,
  input: PatientInfoInput
): Promise<{ ok: boolean; error?: string }> {
  await requireSession();
  if (!input.name?.trim()) {
    return { ok: false, error: "Patient name is required." };
  }
  const updated = await updatePatientInfo(id, input);
  revalidatePath("/admin/patients");
  revalidatePath(`/admin/patients/${id}`);
  return { ok: Boolean(updated) };
}

export async function deletePatientAction(id: string): Promise<void> {
  await requireSession();
  await deletePatient(id);
  revalidatePath("/admin/patients");
  redirect("/admin/patients");
}

export async function addRecordAction(
  patientId: string,
  kind: RecordKind,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Promise<{ ok: boolean }> {
  await requireSession();
  const ok = await addRecord(patientId, kind, data);
  revalidatePath(`/admin/patients/${patientId}`);
  return { ok };
}

export async function deleteRecordAction(
  patientId: string,
  kind: RecordKind,
  recordId: string
): Promise<{ ok: boolean }> {
  await requireSession();
  const ok = await deleteRecord(patientId, kind, recordId);
  revalidatePath(`/admin/patients/${patientId}`);
  return { ok };
}

export async function learnFromConsultationAction(data: {
  advices: string[];
  diagnoses?: string[];
  medicines: { name: string; generic: string; form: string; dosage: string }[];
}): Promise<void> {
  await requireSession();

  // Learn new advices → add to predefined list if not already there
  const settings = await getSettings();
  const existingAdvices = new Set(
    settings.prescription.predefinedAdvices.map((a) => a.toLowerCase())
  );
  const newAdvices = data.advices.filter(
    (a) => a.trim() && !existingAdvices.has(a.toLowerCase())
  );

  // Learn new diagnoses → add to predefined list if not already there
  const existingDiagnoses = new Set(
    (settings.prescription.predefinedDiagnoses ?? []).map((d) => d.toLowerCase())
  );
  const newDiagnoses = (data.diagnoses ?? []).filter(
    (d) => d.trim() && !existingDiagnoses.has(d.toLowerCase())
  );

  if (newAdvices.length > 0 || newDiagnoses.length > 0) {
    await saveSettings({
      ...settings,
      prescription: {
        ...settings.prescription,
        predefinedAdvices: [
          ...settings.prescription.predefinedAdvices,
          ...newAdvices,
        ],
        predefinedDiagnoses: [
          ...(settings.prescription.predefinedDiagnoses ?? []),
          ...newDiagnoses,
        ],
      },
    });
  }

  // Learn new medicines → add to custom medicines store
  for (const med of data.medicines) {
    if (!med.name.trim()) continue;
    // Check if it's in the built-in DB
    const found = searchMedicines(med.name, 1);
    if (found.length > 0) continue; // already known
    await addCustomMedicine(med);
  }
}

export async function markConsultationSupersededAction(
  patientId: string,
  consultationId: string
): Promise<{ ok: boolean }> {
  await requireSession();
  const ok = await markConsultationSuperseded(patientId, consultationId);
  revalidatePath(`/admin/patients/${patientId}`);
  return { ok };
}

export async function findPatientByPhoneAction(
  phone: string
): Promise<{ id?: string; name?: string }> {
  await requireSession();
  const patient = await findByPhone(phone);
  if (patient) {
    return { id: patient.id, name: patient.name };
  }
  return {};
}
