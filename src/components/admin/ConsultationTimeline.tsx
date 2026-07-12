"use client";

import { useState } from "react";
import type { Patient, Consultation } from "@/lib/patients";
import type { PrescriptionConfig, Chamber } from "@/lib/types";
import { shortForm } from "@/lib/medicines";
import PrescriptionActions from "@/components/admin/PrescriptionActions";
import type { DoctorInfo } from "@/lib/prescription-pdf";

function TimelineItem({ consultation: con, patient, doctor, prescriptionConfig, chambers, onDelete, onEdit }: {
  consultation: Consultation; patient: Patient; doctor: DoctorInfo;
  prescriptionConfig: PrescriptionConfig; chambers: Chamber[]; onDelete?: () => void; onEdit?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="relative pb-6 last:pb-0">
      {/* Timeline dot */}
      <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-brand bg-white" />
      {/* Date */}
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-brand">{con.date}</p>
          {con.previousVersionId && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">Edited</span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-ink">
          {con.chiefComplaint.filter(Boolean).join(", ") || "Consultation"}{" "}
          <span className="text-muted">— Dx: {con.diagnosis.filter(Boolean).join(", ") || "—"}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Rx: {con.medicines.length} medicine{con.medicines.length !== 1 ? "s" : ""} · {con.advices.filter(Boolean).length} advice{con.advices.filter(Boolean).length !== 1 ? "s" : ""}
          {con.payment && (
            <span className={`ml-2 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              con.payment.status === "paid" ? "bg-green-100 text-green-700" :
              con.payment.status === "partial" ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700"
            }`}>{con.payment.status} ৳{con.payment.received}</span>
          )}
        </p>
      </button>
      {expanded && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <p className="font-medium text-ink">Vitals</p>
              <p className="text-xs text-muted">
                BP: {con.vitals.bp || "—"} | Pulse: {con.vitals.pulse || "—"} | Wt: {con.vitals.weight || "—"} | SpO₂: {con.vitals.spo2 || "—"} | Temp: {con.vitals.temperature || "—"}
              </p>
              {con.history && <p className="mt-1 text-xs text-muted"><span className="font-medium text-ink">History:</span> {con.history}</p>}
              {con.onExamination && <p className="mt-1 text-xs text-muted"><span className="font-medium text-ink">O/E:</span> {con.onExamination}</p>}
            </div>
            <div>
              <p className="font-medium text-ink">Medicines</p>
              <ul className="text-xs text-muted space-y-0.5">
                {con.medicines.map((m, i) => (
                  <li key={i}>{i + 1}. {shortForm(m.form)} {m.name} {m.dosage} — {m.frequency} {m.timing} ({m.duration})</li>
                ))}
              </ul>
            </div>
          </div>
          {con.advices.filter(Boolean).length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink">Advices</p>
              <ul className="mt-1 text-xs text-muted list-disc list-inside">
                {con.advices.filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {con.followUp && <p className="text-xs text-muted"><span className="font-medium text-ink">Follow-up:</span> {con.followUp}</p>}
          {con.notes && <p className="text-xs text-muted"><span className="font-medium text-ink">Notes:</span> {con.notes}</p>}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
            <PrescriptionActions patient={patient} consultation={con} doctor={doctor} rxConfig={prescriptionConfig} chambers={chambers} />
            {onEdit && <button type="button" onClick={onEdit} className="rounded bg-slate-200 px-2.5 py-1 text-xs font-medium text-ink hover:bg-slate-300">Edit</button>}
            {onDelete && <button type="button" onClick={onDelete} className="text-xs font-medium text-red-600 hover:underline ml-auto">Delete</button>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConsultationTimeline({ patient, doctor, prescriptionConfig, chambers, onDelete, onEdit }: {
  patient: Patient;
  doctor: DoctorInfo;
  prescriptionConfig: PrescriptionConfig;
  chambers: Chamber[];
  onDelete?: (id: string) => void;
  onEdit?: (consultation: Consultation) => void;
}) {
  // Filter out superseded (edited) consultations — only show the latest version
  const visibleConsultations = patient.consultations.filter((c) => !c.superseded);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Consultations / Prescriptions</h2>
        <span className="text-xs text-muted">{visibleConsultations.length} consultation{visibleConsultations.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="mt-4">
        {visibleConsultations.length === 0 && <p className="text-sm text-muted">No consultations yet.</p>}
        {visibleConsultations.length > 0 && (
          <div className="relative ml-4 border-l-2 border-slate-200 pl-6">
            {visibleConsultations.map((con) => (
              <TimelineItem key={con.id} consultation={con} patient={patient} doctor={doctor} prescriptionConfig={prescriptionConfig} chambers={chambers} onDelete={onDelete ? () => onDelete(con.id) : undefined} onEdit={onEdit ? () => onEdit(con) : undefined} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
