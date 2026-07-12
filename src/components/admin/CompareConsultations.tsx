"use client";

import { useState } from "react";
import type { Consultation } from "@/lib/patients";

function DiffList({ older, newer, label }: { older: string[]; newer: string[]; label: string }) {
  const olderSet = new Set(older.filter(Boolean).map((s) => s.toLowerCase()));
  const newerSet = new Set(newer.filter(Boolean).map((s) => s.toLowerCase()));

  const added = newer.filter(Boolean).filter((s) => !olderSet.has(s.toLowerCase()));
  const removed = older.filter(Boolean).filter((s) => !newerSet.has(s.toLowerCase()));
  const same = newer.filter(Boolean).filter((s) => olderSet.has(s.toLowerCase()));

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-ink mb-1">{label}</p>
      <ul className="space-y-0.5 text-xs">
        {same.map((s, i) => (
          <li key={`same-${i}`} className="text-slate-500">• {s}</li>
        ))}
        {added.map((s, i) => (
          <li key={`add-${i}`} className="text-green-600 font-medium">+ {s}</li>
        ))}
        {removed.map((s, i) => (
          <li key={`rem-${i}`} className="text-red-600 font-medium">− {s}</li>
        ))}
      </ul>
    </div>
  );
}

function MedicineDiff({ older, newer }: { older: Consultation; newer: Consultation }) {
  const olderNames = older.medicines.map((m) => m.name.toLowerCase());
  const newerNames = newer.medicines.map((m) => m.name.toLowerCase());

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-ink mb-1">Medicines</p>
      <ul className="space-y-0.5 text-xs">
        {newer.medicines.map((m, i) => {
          const isNew = !olderNames.includes(m.name.toLowerCase());
          return (
            <li key={i} className={isNew ? "text-green-600 font-medium" : "text-slate-500"}>
              {isNew ? "+" : "•"} {m.form} {m.name} {m.dosage} — {m.frequency} ({m.duration})
            </li>
          );
        })}
        {older.medicines
          .filter((m) => !newerNames.includes(m.name.toLowerCase()))
          .map((m, i) => (
            <li key={`rem-${i}`} className="text-red-600 font-medium">
              − {m.form} {m.name} {m.dosage} — {m.frequency} ({m.duration})
            </li>
          ))}
      </ul>
    </div>
  );
}

function VitalsCompare({ older, newer }: { older: Consultation; newer: Consultation }) {
  const fields: { key: keyof Consultation["vitals"]; label: string }[] = [
    { key: "bp", label: "BP" },
    { key: "pulse", label: "Pulse" },
    { key: "weight", label: "Weight" },
    { key: "spo2", label: "SpO₂" },
    { key: "temperature", label: "Temp" },
  ];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-ink mb-1">Vitals</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="font-medium text-muted">Field</span>
        <span className="font-medium text-muted">Change</span>
        {fields.map((f) => {
          const oldVal = older.vitals[f.key] || "—";
          const newVal = newer.vitals[f.key] || "—";
          const changed = oldVal !== newVal;
          return (
            <div key={f.key} className="contents">
              <span className="text-ink">{f.label}</span>
              <span className={changed ? "text-amber-600 font-medium" : "text-slate-500"}>
                {oldVal} → {newVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CompareConsultations({ consultations }: { consultations: Consultation[] }) {
  const [open, setOpen] = useState(false);

  if (consultations.length < 2) return null;

  const newer = consultations[0]; // most recent
  const older = consultations[1]; // previous

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand-light hover:border-brand"
      >
        Compare Last 2 Consultations
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink">Consultation Comparison</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted hover:text-ink">Close</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Older */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-sm font-bold text-muted">Previous — {older.date}</p>
          <div>
            <p className="text-xs font-bold text-ink">Complaints</p>
            <p className="text-xs text-muted">{older.chiefComplaint.filter(Boolean).join(", ") || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Diagnosis</p>
            <p className="text-xs text-muted">{older.diagnosis.filter(Boolean).join(", ") || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Medicines</p>
            <ul className="text-xs text-muted space-y-0.5">
              {older.medicines.map((m, i) => (
                <li key={i}>{m.form} {m.name} {m.dosage} — {m.frequency} ({m.duration})</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Advices</p>
            <p className="text-xs text-muted">{older.advices.filter(Boolean).join(", ") || "—"}</p>
          </div>
        </div>

        {/* Newer */}
        <div className="rounded-lg border border-brand/30 bg-brand-light/20 p-4 space-y-3">
          <p className="text-sm font-bold text-brand-dark">Latest — {newer.date}</p>
          <div>
            <p className="text-xs font-bold text-ink">Complaints</p>
            <p className="text-xs text-muted">{newer.chiefComplaint.filter(Boolean).join(", ") || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Diagnosis</p>
            <p className="text-xs text-muted">{newer.diagnosis.filter(Boolean).join(", ") || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Medicines</p>
            <ul className="text-xs text-muted space-y-0.5">
              {newer.medicines.map((m, i) => (
                <li key={i}>{m.form} {m.name} {m.dosage} — {m.frequency} ({m.duration})</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Advices</p>
            <p className="text-xs text-muted">{newer.advices.filter(Boolean).join(", ") || "—"}</p>
          </div>
        </div>
      </div>

      {/* Diff summary */}
      <div className="mt-4 rounded-lg border border-slate-200 p-4 space-y-4">
        <h3 className="text-sm font-bold text-ink">Changes</h3>
        <VitalsCompare older={older} newer={newer} />
        <MedicineDiff older={older} newer={newer} />
        <DiffList older={older.advices} newer={newer.advices} label="Advices" />
        <DiffList older={older.diagnosis} newer={newer.diagnosis} label="Diagnosis" />
      </div>
    </div>
  );
}
