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
import { searchMedicines } from "@/lib/medicines";
import { requirePermission, checkPermission, getCurrentUser } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { addInvestigation, getInvestigations } from "@/lib/investigations";
import prisma from "@/lib/db";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function createPatientAction(
  input: PatientInfoInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    await requireSession();
    await requirePermission("canCreatePatient");

    if (!input.name?.trim()) {
      return { ok: false, error: "Patient name is required." };
    }
    if (!input.phone?.trim()) {
      return { ok: false, error: "Phone number is required (used as identity)." };
    }
    const { patient, error } = await createPatient(input);
    if (error) return { ok: false, error };
    revalidatePath("/admin/patients");

    const current = await getCurrentUser();
    if (current && patient) {
      await logAudit(current.id, "CREATE_PATIENT", "patient", patient.id, {
        name: patient.name,
        patientId: patient.patientId,
      });
    }

    return { ok: true, id: patient!.id };
  } catch (err) {
    return { ok: false, error: "Failed to create patient. Please try again." };
  }
}

export async function createPatientFromAppointmentAction(
  appointmentId: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    await requireSession();
    await requirePermission("canCreatePatient");

    const appointments = await getAppointments();
    const apt = appointments.find((a) => a.id === appointmentId);
    if (!apt) return { ok: false, error: "Appointment not found." };

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

    const current = await getCurrentUser();
    if (current && patient) {
      await logAudit(current.id, "CREATE_PATIENT", "patient", patient.id, {
        name: patient.name,
        fromAppointment: appointmentId,
      });
    }

    return { ok: true, id: patient!.id };
  } catch (err) {
    return { ok: false, error: "Failed to create patient from appointment. Please try again." };
  }
}

export async function updatePatientAction(
  id: string,
  input: PatientInfoInput
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireSession();
    await requirePermission("canCreatePatient");

    if (!input.name?.trim()) {
      return { ok: false, error: "Patient name is required." };
    }
    const updated = await updatePatientInfo(id, input);
    revalidatePath("/admin/patients");
    revalidatePath(`/admin/patients/${id}`);

    if (updated) {
      const current = await getCurrentUser();
      if (current) {
        await logAudit(current.id, "UPDATE_PATIENT", "patient", id, { name: input.name });
      }
    }

    return { ok: Boolean(updated) };
  } catch (err) {
    return { ok: false, error: "Failed to update patient. Please try again." };
  }
}

export async function deletePatientAction(id: string): Promise<void> {
  await requireSession();
  await requirePermission("canCreatePatient");

  const current = await getCurrentUser();
  await deletePatient(id);
  revalidatePath("/admin/patients");

  if (current) {
    await logAudit(current.id, "DELETE_PATIENT", "patient", id);
  }

  redirect("/admin/patients");
}

export async function addRecordAction(
  patientId: string,
  kind: RecordKind,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireSession();

    // Check appropriate permission based on what's being written
    if (kind === "consultations") {
      // If writing vitals only (no medicines, no diagnosis), canAddVitals suffices
      const hasRxContent = data.medicines?.length > 0 || data.diagnosis?.length > 0;
      if (hasRxContent) {
        const canWriteRx = await checkPermission("canWriteRx");
        if (!canWriteRx) {
          await requirePermission("canWriteRx");
        }
      } else {
        const canAddVitals = await checkPermission("canAddVitals");
        if (!canAddVitals) {
          await requirePermission("canAddVitals");
        }
      }
    }

    if (kind === "testReports") {
      const canTest = await checkPermission("canAddTestReport");
      if (!canTest) {
        return { ok: false, error: "You don't have permission to add test reports." };
      }
    }

    const ok = await addRecord(patientId, kind, data);
    revalidatePath(`/admin/patients/${patientId}`);

    if (ok) {
      const current = await getCurrentUser();
      if (current) {
        const action = kind === "consultations" ? "CREATE_CONSULTATION" : `CREATE_${kind.toUpperCase()}`;
        await logAudit(current.id, action, kind, patientId, { kind });
      }
      // Auto-complete the appointment when a consultation is saved
      if (kind === "consultations") {
        const { completeAppointmentForPatient } = await import("@/lib/appointments");
        const { getPatientById } = await import("@/lib/patients");
        const patient = await getPatientById(patientId);
        if (patient) {
          const todayStr = new Date().toISOString().split("T")[0];
          await completeAppointmentForPatient(patient.phone, todayStr);
        }
      }
    }

    return { ok };
  } catch (err) {
    return { ok: false, error: "Failed to save record. Please try again." };
  }
}

export async function deleteRecordAction(
  patientId: string,
  kind: RecordKind,
  recordId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireSession();
    await requirePermission("canEditConsultation");

    const ok = await deleteRecord(patientId, kind, recordId);
    revalidatePath(`/admin/patients/${patientId}`);

    if (ok) {
      const current = await getCurrentUser();
      if (current) {
        await logAudit(current.id, `DELETE_${kind.toUpperCase()}`, kind, recordId, { patientId });
      }
    }

    return { ok };
  } catch (err) {
    return { ok: false, error: "Failed to delete record. Please try again." };
  }
}

export async function learnFromConsultationAction(data: {
  advices: string[];
  diagnoses?: string[];
  investigations?: string[];
  medicines: { name: string; generic: string; form: string; dosage: string }[];
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireSession();

    const settings = await getSettings();
    const existingAdvices = new Set(
      settings.prescription.predefinedAdvices.map((a) => a.toLowerCase())
    );
    const newAdvices = data.advices.filter(
      (a) => a.trim() && !existingAdvices.has(a.toLowerCase())
    );

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

    for (const med of data.medicines) {
      if (!med.name.trim()) continue;
      const found = searchMedicines(med.name, 1);
      if (found.length > 0) continue;
      await addCustomMedicine(med);
    }

    // Learn new investigations
    if (data.investigations && data.investigations.length > 0) {
      const existingInvestigations = await getInvestigations();
      const existingNames = new Set(
        existingInvestigations.map((inv) => inv.name.toLowerCase())
      );
      for (const inv of data.investigations) {
        if (!inv.trim()) continue;
        if (existingNames.has(inv.toLowerCase())) continue;
        await addInvestigation({ name: inv, category: "", aliases: [] });
      }
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Failed to learn from consultation. Please try again." };
  }
}

export async function markConsultationSupersededAction(
  patientId: string,
  consultationId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireSession();
    await requirePermission("canEditConsultation");

    const ok = await markConsultationSuperseded(patientId, consultationId);
    revalidatePath(`/admin/patients/${patientId}`);
    return { ok };
  } catch (err) {
    return { ok: false, error: "Failed to mark consultation as superseded. Please try again." };
  }
}

export async function findPatientByPhoneAction(
  phone: string
): Promise<{ id?: string; name?: string; error?: string }> {
  try {
    await requireSession();
    const patient = await findByPhone(phone);
    if (patient) {
      return { id: patient.id, name: patient.name };
    }
    return {};
  } catch (err) {
    return { error: "Failed to search patient. Please try again." };
  }
}

// ---- Pending Vitals Actions ----

export async function savePendingVitalsAction(
  patientId: string,
  vitals: {
    bp: string;
    spo2: string;
    weight: string;
    temperature: string;
    pulse: string;
    complaint: string;
  },
  userId: string,
  userName: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireSession();
    await requirePermission("canAddVitals");

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        pendingVitalsBp: vitals.bp ?? "",
        pendingVitalsPulse: vitals.pulse ?? "",
        pendingVitalsWeight: vitals.weight ?? "",
        pendingVitalsSpo2: vitals.spo2 ?? "",
        pendingVitalsTemp: vitals.temperature ?? "",
        pendingVitalsComplaint: vitals.complaint ?? "",
        pendingVitalsBy: userId,
        pendingVitalsByName: userName,
        pendingVitalsAt: new Date().toISOString(),
      },
    });

    revalidatePath(`/admin/patients/${patientId}`);

    await logAudit(userId, "SAVE_PENDING_VITALS", "patient", patientId, {
      vitals,
      userName,
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Failed to save vitals. Please try again." };
  }
}

export async function clearPendingVitalsAction(
  patientId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireSession();

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        pendingVitalsBp: "",
        pendingVitalsPulse: "",
        pendingVitalsWeight: "",
        pendingVitalsSpo2: "",
        pendingVitalsTemp: "",
        pendingVitalsComplaint: "",
        pendingVitalsBy: "",
        pendingVitalsByName: "",
        pendingVitalsAt: "",
      },
    });

    revalidatePath(`/admin/patients/${patientId}`);

    const current = await getCurrentUser();
    if (current) {
      await logAudit(current.id, "CLEAR_PENDING_VITALS", "patient", patientId);
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Failed to clear vitals. Please try again." };
  }
}

// ---- Reschedule Appointment Action ----

export async function rescheduleAppointmentAction(
  appointmentId: string,
  newDate: string,
  newTime: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireSession();
    await requirePermission("canConfirmAppointment");

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        date: newDate,
        time: newTime,
      },
    });

    revalidatePath("/admin/appointments");

    const current = await getCurrentUser();
    if (current) {
      await logAudit(current.id, "RESCHEDULE_APPOINTMENT", "appointment", appointmentId, {
        newDate,
        newTime,
      });
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Failed to reschedule appointment. Please try again." };
  }
}
