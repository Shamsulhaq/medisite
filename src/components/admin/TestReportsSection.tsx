"use client";

import { useRef, useState } from "react";
import type { Patient } from "@/lib/patients";
import { todayInBD } from "@/lib/utils";
import QRUploadModal from "@/components/admin/QRUploadModal";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

function AttachmentField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.ok) onChange(data.url);
    } catch {} finally { setUploading(false); }
  }
  return (
    <div className="flex items-center gap-3">
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60">
        {uploading ? "Uploading…" : "Attach"}
      </button>
      {value && (
        <span className="flex items-center gap-2 text-xs text-muted">
          <a href={value} target="_blank" rel="noreferrer" className="text-brand underline">View</a>
          <button type="button" onClick={() => onChange("")} className="text-red-600 hover:underline">remove</button>
        </span>
      )}
    </div>
  );
}

const today = todayInBD;

export default function TestReportsSection({ patient, pending, onAdd, onDelete }: {
  patient: Patient;
  pending: boolean;
  onAdd: (data: { date: string; title: string; result: string; attachment: string }, reset: () => void) => void;
  onDelete: (id: string) => void;
}) {
  const [report, setReport] = useState({ date: today(), title: "", result: "", attachment: "" });
  const [showQRModal, setShowQRModal] = useState(false);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Test Report Results</h2>
      <div className="mt-4 space-y-3">
        {patient.testReports.length === 0 && <p className="text-sm text-muted">No test reports yet.</p>}
        {patient.testReports.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div>
              <p className="text-xs font-medium text-brand">{r.date}</p>
              <p className="mt-1 text-sm font-medium text-ink">{r.title}</p>
              {r.result && <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{r.result}</p>}
              {r.attachment && <a href={r.attachment} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-brand underline">View file</a>}
            </div>
            <button type="button" onClick={() => onDelete(r.id)} className="text-xs font-medium text-red-600 hover:underline">Delete</button>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-3 rounded-lg border border-dashed border-slate-300 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="text-xs font-medium text-muted">Date</label><input type="date" value={report.date} onChange={(e) => setReport({ ...report, date: e.target.value })} className={inputClass} /></div>
          <div><label className="text-xs font-medium text-muted">Test Title</label><input value={report.title} onChange={(e) => setReport({ ...report, title: e.target.value })} className={inputClass} placeholder="e.g. CBC, PFT" /></div>
        </div>
        <div><label className="text-xs font-medium text-muted">Result</label><textarea value={report.result} onChange={(e) => setReport({ ...report, result: e.target.value })} rows={2} className={inputClass} /></div>
        <AttachmentField value={report.attachment} onChange={(url) => setReport({ ...report, attachment: url })} />
        <button
          type="button"
          onClick={() => setShowQRModal(true)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-slate-50"
        >
          📱 Upload from Phone
        </button>
        <button type="button" disabled={pending || !report.title.trim()} onClick={() => onAdd(report, () => setReport({ date: today(), title: "", result: "", attachment: "" }))}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50">
          Add Test Report
        </button>
      </div>
      {showQRModal && (
        <QRUploadModal
          patientId={patient.id}
          targetType="test_report"
          onComplete={(files) => {
            if (files.length > 0) {
              setReport({ ...report, attachment: files[0] });
            }
            setShowQRModal(false);
          }}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </section>
  );
}
