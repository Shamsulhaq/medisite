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
  type PatientInfoInput,
  type RecordKind,
} from "@/lib/patients";

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
  const patient = await createPatient(input);
  revalidatePath("/admin/patients");
  return { ok: true, id: patient.id };
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
