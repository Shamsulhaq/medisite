"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Patient, Consultation, MedicineEntry } from "@/lib/patients";
import type { PrescriptionConfig, Chamber } from "@/lib/types";
import { addRecordAction, learnFromConsultationAction } from "@/app/admin/patient-actions";
import { printConsultation, type DoctorInfo } from "@/lib/prescription-pdf";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const today = () => new Date().toISOString().split("T")[0];

export default function QuickConsultationForm({
  patient,
  doctor,
  prescriptionConfig,
  chambers,
  nextPatientId,
}: {
  patient: Patient;
  doctor: DoctorInfo;
  prescriptionConfig: PrescriptionConfig;
  chambers: Chamber[];
  nextPatientId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const emptyMed: MedicineEntry = { name: "", generic: "", type: "brand", form: "", dosage: "", frequency: "", timing: "", duration: "", specialNote: "" };

  const lastC = patient.consultations[0];
  const [c, setC] = useState<Omit<Consultation, "id">>({
    date: today(),
    chamberId: chambers[0]?.id || "",
    vitals: lastC ? { ...lastC.vitals } : { bp: "", pulse: "", weight: "", spo2: "", temperature: "", others: "" },
    chiefComplaint: [""],
    history: lastC?.history || "",
    onExamination: "",
    diagnosis: [""],
    medicines: lastC ? lastC.medicines.map((m) => ({ ...m })) : [{ ...emptyMed }],
    advices: [],
    followUp: "",
    notes: "",
    attachment: "",
  });

  const setComplaint = (i: number, v: string) => setC({ ...c, chiefComplaint: c.chiefComplaint.map((x, idx) => idx === i ? v : x) });
  const setDiagnosis = (i: number, v: string) => setC({ ...c, diagnosis: c.diagnosis.map((x, idx) => idx === i ? v : x) });
  const setAdvice = (i: number, v: string) => setC({ ...c, advices: c.advices.map((x, idx) => idx === i ? v : x) });

  function save(andPrint: boolean, andNext: boolean) {
    startTransition(async () => {
      const data = {
        ...c,
        chiefComplaint: c.chiefComplaint.filter(Boolean),
        diagnosis: c.diagnosis.filter(Boolean),
        advices: c.advices.filter(Boolean),
      };
      await addRecordAction(patient.id, "consultations", data);
      await learnFromConsultationAction({
        advices: data.advices,
        medicines: data.medicines
          .filter((m) => m.name.trim())
          .map((m) => ({ name: m.name, generic: m.generic, form: m.form, dosage: m.dosage })),
      });

      if (andPrint) {
        const chamber = chambers.find((ch) => ch.id === c.chamberId);
        const chamberInfo = chamber ? { name: chamber.name, address: chamber.address, phone: chamber.phone } : undefined;
        printConsultation(patient, { id: "temp", ...data } as Consultation, doctor, prescriptionConfig, chamberInfo);
      }

      if (andNext && nextPatientId) {
        router.push(`/admin/patients/${nextPatientId}/quick`);
      } else {
        router.push("/admin");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Patient Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-ink">{patient.name}</h1>
          <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
            {patient.patientId}
          </span>
          <span className="text-sm text-muted">{patient.age} · {patient.gender}</span>
        </div>
        <button type="button" onClick={() => router.push(`/admin/patients/${patient.id}`)}
          className="text-sm font-medium text-brand hover:underline">← Full View</button>
      </div>

      {/* Two-column form */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* LEFT: Complaint / Vitals / Diagnosis */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-brand">Chief Complaint</label>
            {c.chiefComplaint.map((v, i) => (
              <div key={i} className="mt-1 flex gap-2">
                <input value={v} onChange={(e) => setComplaint(i, e.target.value)} className={inputClass} placeholder={`Complaint ${i + 1}`} />
                {c.chiefComplaint.length > 1 && <button type="button" onClick={() => setC({ ...c, chiefComplaint: c.chiefComplaint.filter((_, idx) => idx !== i) })} className="text-xs text-red-600">✕</button>}
              </div>
            ))}
            <button type="button" onClick={() => setC({ ...c, chiefComplaint: [...c.chiefComplaint, ""] })} className="mt-1 text-xs font-medium text-brand">+ Add</button>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-brand">Vitals</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input value={c.vitals.bp} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, bp: e.target.value } })} className={inputClass} placeholder="BP: 120/80" />
              <input value={c.vitals.pulse} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, pulse: e.target.value } })} className={inputClass} placeholder="Pulse: 72" />
              <input value={c.vitals.weight} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, weight: e.target.value } })} className={inputClass} placeholder="Wt: 71 kg" />
              <input value={c.vitals.spo2} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, spo2: e.target.value } })} className={inputClass} placeholder="SpO2: 99%" />
              <input value={c.vitals.temperature} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, temperature: e.target.value } })} className={inputClass} placeholder="Temp: 98.6°F" />
              <input value={c.vitals.others} onChange={(e) => setC({ ...c, vitals: { ...c.vitals, others: e.target.value } })} className={inputClass} placeholder="Others" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-brand">Diagnosis</label>
            {c.diagnosis.map((v, i) => (
              <div key={i} className="mt-1 flex gap-2">
                <input value={v} onChange={(e) => setDiagnosis(i, e.target.value)} className={inputClass} placeholder={`Diagnosis ${i + 1}`} />
                {c.diagnosis.length > 1 && <button type="button" onClick={() => setC({ ...c, diagnosis: c.diagnosis.filter((_, idx) => idx !== i) })} className="text-xs text-red-600">✕</button>}
              </div>
            ))}
            <button type="button" onClick={() => setC({ ...c, diagnosis: [...c.diagnosis, ""] })} className="mt-1 text-xs font-medium text-brand">+ Add</button>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-brand">History</label>
            <textarea value={c.history} onChange={(e) => setC({ ...c, history: e.target.value })} rows={2} className={`${inputClass} mt-1`} placeholder="Relevant history..." />
          </div>
        </div>

        {/* RIGHT: Rx / Advices / Follow-up */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-brand">Rx</label>
            <div className="mt-1 space-y-2">
              {c.medicines.map((med, i) => (
                <div key={i} className="flex items-center gap-1 text-sm">
                  <span className="w-5 text-xs text-muted">{i + 1}.</span>
                  <input value={med.name} onChange={(e) => setC({ ...c, medicines: c.medicines.map((m, idx) => idx === i ? { ...m, name: e.target.value } : m) })}
                    className={`${inputClass} flex-1`} placeholder="Medicine" />
                  <input value={med.dosage} onChange={(e) => setC({ ...c, medicines: c.medicines.map((m, idx) => idx === i ? { ...m, dosage: e.target.value } : m) })}
                    className={`${inputClass} w-20`} placeholder="Dose" />
                  <input value={med.frequency} onChange={(e) => setC({ ...c, medicines: c.medicines.map((m, idx) => idx === i ? { ...m, frequency: e.target.value } : m) })}
                    className={`${inputClass} w-20`} placeholder="Freq" />
                  <input value={med.duration} onChange={(e) => setC({ ...c, medicines: c.medicines.map((m, idx) => idx === i ? { ...m, duration: e.target.value } : m) })}
                    className={`${inputClass} w-24`} placeholder="Duration" />
                  <button type="button" onClick={() => setC({ ...c, medicines: c.medicines.filter((_, idx) => idx !== i) })} className="text-xs text-red-600">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => setC({ ...c, medicines: [...c.medicines, { ...emptyMed }] })}
                className="text-xs font-medium text-brand">+ Add medicine</button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-brand">Advices</label>
            <div className="mt-1 flex flex-wrap gap-1 mb-2">
              {prescriptionConfig.predefinedAdvices.slice(0, 6).map((adv) => {
                const added = c.advices.includes(adv);
                return (
                  <button key={adv} type="button"
                    onClick={() => { if (!added) setC({ ...c, advices: [...c.advices.filter(Boolean), adv] }); }}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${added ? "bg-brand text-white" : "bg-slate-100 text-ink hover:bg-brand-light"}`}>
                    {added ? "✓" : "+"} {adv.slice(0, 18)}{adv.length > 18 ? "…" : ""}
                  </button>
                );
              })}
            </div>
            {c.advices.map((v, i) => (
              <div key={i} className="mt-1 flex gap-2">
                <input value={v} onChange={(e) => setAdvice(i, e.target.value)} className={inputClass} placeholder="Advice" />
                <button type="button" onClick={() => setC({ ...c, advices: c.advices.filter((_, idx) => idx !== i) })} className="text-xs text-red-600">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => setC({ ...c, advices: [...c.advices, ""] })} className="mt-1 text-xs font-medium text-brand">+ Custom</button>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-brand">Follow-up</label>
            <div className="mt-1 flex flex-wrap gap-1 mb-2">
              {prescriptionConfig.followUpOptions.slice(0, 6).map((opt) => (
                <button key={opt} type="button" onClick={() => setC({ ...c, followUp: opt })}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${c.followUp === opt ? "bg-brand text-white" : "bg-slate-100 text-ink hover:bg-brand-light"}`}>
                  {opt}
                </button>
              ))}
            </div>
            <input value={c.followUp} onChange={(e) => setC({ ...c, followUp: e.target.value })} className={inputClass} placeholder="Follow-up..." />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-brand">Notes</label>
            <textarea value={c.notes} onChange={(e) => setC({ ...c, notes: e.target.value })} rows={2} className={`${inputClass} mt-1`} placeholder="Additional notes..." />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <button type="button" disabled={pending} onClick={() => save(false, false)}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50">
          {pending ? "Saving..." : "Save"}
        </button>
        <button type="button" disabled={pending} onClick={() => save(true, false)}
          className="rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
          Save + Print
        </button>
        <button type="button" disabled={pending} onClick={() => save(true, true)}
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50">
          Save + Print + Next {nextPatientId ? "" : "(→ Dashboard)"}
        </button>
      </div>
    </div>
  );
}
