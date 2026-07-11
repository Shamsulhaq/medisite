"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Patient, RecordKind, Consultation } from "@/lib/patients";
import type { PrescriptionConfig, Chamber, Appointment, PrescriptionTemplate } from "@/lib/types";
import { addRecordAction, deleteRecordAction, learnFromConsultationAction } from "@/app/admin/patient-actions";
import type { DoctorInfo } from "@/lib/prescription-pdf";
import ConsultationTimeline from "@/components/admin/ConsultationTimeline";
import ConsultationForm from "@/components/admin/ConsultationForm";
import TestReportsSection from "@/components/admin/TestReportsSection";

export default function PatientRecords({ patient, doctor, prescriptionConfig, prescriptionTemplates, chambers, appointments, feeStructure }: {
  patient: Patient;
  doctor: DoctorInfo;
  prescriptionConfig: PrescriptionConfig;
  prescriptionTemplates: PrescriptionTemplate[];
  chambers: Chamber[];
  appointments: Appointment[];
  feeStructure?: { firstVisit: number; within7Days: number; within30Days: number; after30Days: number };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);

  function add(kind: RecordKind, data: object, reset: () => void) {
    startTransition(async () => {
      // If editing, mark the old one as superseded
      if (kind === "consultations" && editingConsultation) {
        const conData = data as Record<string, unknown>;
        conData.previousVersionId = editingConsultation.id;
        // Mark old as superseded
        await addRecordAction(patient.id, "consultations", { ...conData, previousVersionId: editingConsultation.id });
        // We need to supersede the old one — use deleteRecord to mark it
        // Actually, let's use a dedicated action
        const { markConsultationSupersededAction } = await import("@/app/admin/patient-actions");
        await markConsultationSupersededAction(patient.id, editingConsultation.id);
        setEditingConsultation(null);
      } else {
        await addRecordAction(patient.id, kind, data);
      }

      if (kind === "consultations") {
        const con = data as Omit<Consultation, "id">;
        await learnFromConsultationAction({
          advices: con.advices?.filter(Boolean) ?? [],
          diagnoses: con.diagnosis?.filter(Boolean) ?? [],
          medicines: (con.medicines ?? [])
            .filter((m) => m.name.trim())
            .map((m) => ({ name: m.name, generic: m.generic, form: m.form, dosage: m.dosage })),
        });
      }
      reset();
      router.refresh();
    });
  }

  function remove(kind: RecordKind, id: string) {
    if (!confirm("Delete this record?")) return;
    startTransition(async () => {
      await deleteRecordAction(patient.id, kind, id);
      router.refresh();
    });
  }

  function handleEdit(consultation: Consultation) {
    setEditingConsultation(consultation);
    // Scroll to the form
    setTimeout(() => {
      document.getElementById("consultation-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <div className={`space-y-6 ${pending ? "opacity-70" : ""}`}>
      <ConsultationTimeline
        patient={patient}
        doctor={doctor}
        prescriptionConfig={prescriptionConfig}
        chambers={chambers}
        onDelete={(id) => remove("consultations", id)}
        onEdit={handleEdit}
      />

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

      <TestReportsSection
        patient={patient}
        pending={pending}
        onAdd={(data, reset) => add("testReports", data, reset)}
        onDelete={(id) => remove("testReports", id)}
      />
    </div>
  );
}
