"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Patient, RecordKind, Consultation } from "@/lib/patients";
import type { PrescriptionConfig, Chamber, Appointment, PrescriptionTemplate } from "@/lib/types";
import { addRecordAction, deleteRecordAction, learnFromConsultationAction } from "@/app/admin/patient-actions";
import { printConsultation, type DoctorInfo } from "@/lib/prescription-pdf";
import { useToast } from "@/components/admin/ToastProvider";
import ConsultationTimeline from "@/components/admin/ConsultationTimeline";
import ConsultationForm from "@/components/admin/ConsultationForm";
import TestReportsSection from "@/components/admin/TestReportsSection";

export default function PatientRecords({ patient, doctor, prescriptionConfig, prescriptionTemplates, chambers, appointments, feeStructure, permissions, testReportsOnly }: {
  patient: Patient;
  doctor: DoctorInfo;
  prescriptionConfig: PrescriptionConfig;
  prescriptionTemplates: PrescriptionTemplate[];
  chambers: Chamber[];
  appointments: Appointment[];
  feeStructure?: { firstVisit: number; within7Days: number; within30Days: number; after30Days: number };
  permissions?: { canWriteRx?: boolean; canAddTestReport?: boolean; canEditConsultation?: boolean; canPrintPrescription?: boolean; canAddVitals?: boolean; canCollectFee?: boolean };
  testReportsOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const { toast } = useToast();

  function add(kind: RecordKind, data: object, reset: () => void) {
    startTransition(async () => {
      try {
        // If editing, mark the old one as superseded
        if (kind === "consultations" && editingConsultation) {
          const conData = data as Record<string, unknown>;
          conData.previousVersionId = editingConsultation.id;
          const res = await addRecordAction(patient.id, "consultations", { ...conData, previousVersionId: editingConsultation.id });
          if (!res.ok) {
            toast("error", res.error || "Something went wrong");
            return;
          }
          const { markConsultationSupersededAction } = await import("@/app/admin/patient-actions");
          await markConsultationSupersededAction(patient.id, editingConsultation.id);
          setEditingConsultation(null);
        } else {
          const res = await addRecordAction(patient.id, kind, data);
          if (!res.ok) {
            toast("error", res.error || "Something went wrong");
            return;
          }
        }

        if (kind === "consultations") {
          const con = data as Omit<Consultation, "id">;
          await learnFromConsultationAction({
            advices: con.advices?.filter(Boolean) ?? [],
            diagnoses: con.diagnosis?.filter(Boolean) ?? [],
            investigations: con.investigations?.filter(Boolean) ?? [],
            medicines: (con.medicines ?? [])
              .filter((m) => m.name.trim())
              .map((m) => ({ name: m.name, generic: m.generic, form: m.form, dosage: m.dosage })),
          });
        }
        reset();
        router.refresh();
      } catch {
        toast("error", "Something went wrong");
      }
    });
  }

  function remove(kind: RecordKind, id: string) {
    if (!confirm("Delete this record?")) return;
    startTransition(async () => {
      try {
        const res = await deleteRecordAction(patient.id, kind, id);
        if (!res.ok) {
          toast("error", res.error || "Failed to delete");
          return;
        }
        toast("success", "Record deleted");
        router.refresh();
      } catch {
        toast("error", "Something went wrong");
      }
    });
  }

  function handleEdit(consultation: Consultation) {
    setEditingConsultation(consultation);
    // Scroll to the form
    setTimeout(() => {
      document.getElementById("consultation-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  const canWrite = permissions?.canWriteRx !== false;
  const canTest = permissions?.canAddTestReport !== false;
  const canEdit = permissions?.canEditConsultation !== false;

  if (testReportsOnly) {
    return (
      <div className={`space-y-6 ${pending ? "opacity-70" : ""}`}>
        {canTest && (
          <TestReportsSection
            patient={patient}
            pending={pending}
            onAdd={(data, reset) => add("testReports", data, reset)}
            onDelete={(id) => remove("testReports", id)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${pending ? "opacity-70" : ""}`}>
      <ConsultationTimeline
        patient={patient}
        doctor={doctor}
        prescriptionConfig={prescriptionConfig}
        chambers={chambers}
        onDelete={canWrite ? (id) => remove("consultations", id) : undefined}
        onEdit={canEdit ? handleEdit : undefined}
      />

      {canWrite && (
        <div id="consultation-form">
          {editingConsultation && (
            <div className="mb-2 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
              <p className="flex-1 text-sm text-blue-800">
                ✏️ Editing consultation from <strong>{editingConsultation.date}</strong>. A new version will be created (original preserved in audit trail).
              </p>
              <button type="button" onClick={() => setEditingConsultation(null)} className="text-xs font-medium text-blue-700 hover:underline">Cancel Edit</button>
            </div>
          )}
          <ConsultationForm
            patient={patient}
            doctor={doctor}
            prescriptionConfig={prescriptionConfig}
            chambers={chambers}
            appointments={appointments}
            pending={pending}
            feeStructure={feeStructure}
            onSave={add}
            editingConsultation={editingConsultation}
          />
        </div>
      )}

      {!canWrite && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          {(() => {
            const latestConsultation = patient.consultations.find((con) => !con.superseded);
            if (!latestConsultation) {
              return (
                <button
                  type="button"
                  disabled
                  title="No prescription available"
                  className="w-full rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
                >
                  🖨️ Print Latest Prescription
                </button>
              );
            }
            return (
              <button
                type="button"
                onClick={() => {
                  const chamberInfo = latestConsultation.chamberId
                    ? (() => { const ch = chambers.find((x) => x.id === latestConsultation.chamberId); return ch ? { name: ch.name, address: ch.address, phone: ch.phone } : undefined; })()
                    : undefined;
                  printConsultation(patient, latestConsultation, doctor, prescriptionConfig, chamberInfo);
                }}
                className="w-full rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🖨️ Print Latest Prescription
              </button>
            );
          })()}
        </div>
      )}

      {canTest && (
        <TestReportsSection
          patient={patient}
          pending={pending}
          onAdd={(data, reset) => add("testReports", data, reset)}
          onDelete={(id) => remove("testReports", id)}
        />
      )}
    </div>
  );
}
