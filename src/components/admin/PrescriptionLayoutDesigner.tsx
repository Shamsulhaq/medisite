"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import type { PrescriptionLayout, PrescriptionLayoutRow, PrescriptionLayoutCell, PrescriptionLine } from "@/lib/prescription-layout";
import { DEFAULT_PRESCRIPTION_LAYOUT } from "@/lib/prescription-layout";
import { saveSettingsAction } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/types";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelClass = "block text-xs font-medium text-muted mb-1";

// Real page dimensions in mm
const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 216, height: 279 },
};

function genId() { return `id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

function makeCell(align: "left" | "center" | "right"): PrescriptionLayoutCell {
  return { id: genId(), type: "text", align, content: "", lines: [{ text: "", fontSize: 11 }] };
}
function makeRow(columns: 1 | 2 | 3): PrescriptionLayoutRow {
  const aligns: ("left" | "center" | "right")[] = columns === 1 ? ["center"] : columns === 2 ? ["left", "right"] : ["left", "center", "right"];
  return { id: genId(), columns, cells: aligns.map(makeCell), borderBottom: false, marginTop: 0, marginBottom: 8 };
}

export type SamplePreviewData = {
  patient: { name: string; age: string; gender: string; phone: string; patientId: string };
  consultation: {
    date: string;
    chiefComplaint: string[];
    diagnosis: string[];
    medicines: { name: string; form: string; dosage: string; frequency?: string; timing?: string; duration?: string }[];
    advices: string[];
    investigations: string[];
    followUp: string;
    vitals: { bp: string; pulse: string; weight: string; spo2: string; temp: string };
  };
} | null;

export default function PrescriptionLayoutDesigner({ initial, settings, sampleData }: { initial: PrescriptionLayout; settings: SiteSettings; sampleData?: SamplePreviewData }) {
  const [layout, setLayout] = useState<PrescriptionLayout>(initial || DEFAULT_PRESCRIPTION_LAYOUT);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [tab, setTab] = useState<"header" | "footer" | "body" | "watermark" | "page">("header");

  // Resizable
  const [editorWidth, setEditorWidth] = useState(55);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); isDragging.current = true;
    const startX = e.clientX, startW = editorWidth, cw = containerRef.current?.offsetWidth || 1000;
    const onMove = (ev: MouseEvent) => { if (!isDragging.current) return; setEditorWidth(Math.max(30, Math.min(70, startW + ((ev.clientX - startX) / cw) * 100))); };
    const onUp = () => { isDragging.current = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, [editorWidth]);

  async function handleSave() {
    setSaving(true); setMsg(null);
    const res = await saveSettingsAction({ ...settings, prescriptionLayout: layout } as SiteSettings);
    setSaving(false);
    setMsg(res.ok ? { type: "ok", text: "Saved!" } : { type: "err", text: res.error ?? "Failed." });
  }

  // Row helpers
  function updateRows(section: "header" | "footer", rows: PrescriptionLayoutRow[]) { setLayout((l) => ({ ...l, [section]: rows })); }
  function addRow(section: "header" | "footer", cols: 1 | 2 | 3) { setLayout((l) => ({ ...l, [section]: [...l[section], makeRow(cols)] })); }
  function removeRow(section: "header" | "footer", i: number) { setLayout((l) => ({ ...l, [section]: l[section].filter((_, idx) => idx !== i) })); }
  function updateRow(section: "header" | "footer", i: number, row: PrescriptionLayoutRow) { setLayout((l) => ({ ...l, [section]: l[section].map((r, idx) => idx === i ? row : r) })); }

  // Preview — generates HTML that matches real printed output at actual page size
  function previewHtml(): string {
    const l = layout;
    const page = PAGE_SIZES[l.pageSize] || PAGE_SIZES.A4;
    const margins = l.margins;

    const renderLine = (line: PrescriptionLine) =>
      `<p style="margin:0;font-size:${line.fontSize || 11}pt;line-height:1.4;${line.bold ? "font-weight:700;" : ""}${line.color ? `color:${line.color};` : ""}">${line.text || "&nbsp;"}</p>`;

    const renderCell = (cell: PrescriptionLayoutCell) => {
      if (cell.type === "qr")
        return `<div style="text-align:${cell.align}"><div style="width:50px;height:50px;border:1.5px solid #e2e8f0;display:inline-flex;align-items:center;justify-content:center;font-size:8pt;color:#94a3b8;border-radius:4px">QR</div></div>`;
      if (cell.type === "logo" && cell.content)
        return `<div style="text-align:${cell.align}"><img src="${cell.content}" style="max-height:60px;max-width:150px;object-fit:contain;display:inline-block" /></div>`;
      return `<div style="text-align:${cell.align}">${cell.lines.map(renderLine).join("")}</div>`;
    };

    const renderRow = (row: PrescriptionLayoutRow) => {
      const grid = row.columns === 1 ? "1fr" : row.columns === 2 ? "1fr 1fr" : "1fr 1fr 1fr";
      return `<div style="display:grid;grid-template-columns:${grid};gap:12px;${row.borderBottom ? "border-bottom:2px solid #0d9488;padding-bottom:8px;" : ""}margin-top:${row.marginTop || 0}px;margin-bottom:${row.marginBottom ?? 8}px">${row.cells.slice(0, row.columns).map(renderCell).join("")}</div>`;
    };

    // Watermark
    const wm = l.watermark;
    const wmHtml = wm.enabled && wm.type === "text" && wm.text
      ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(${wm.rotation ?? -30}deg);opacity:${wm.opacity};font-size:${wm.fontSize || 60}pt;font-weight:700;color:#cbd5e1;pointer-events:none;white-space:nowrap">${wm.text}</div>`
      : wm.enabled && wm.type === "image" && wm.image
        ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(${wm.rotation || 0}deg);opacity:${wm.opacity};pointer-events:none"><img src="${wm.image}" style="max-width:250px" /></div>`
        : "";

    // Body content — use real data if available, otherwise sample
    const d = sampleData;
    const complaints = (d?.consultation.chiefComplaint.filter(Boolean).length) ? d.consultation.chiefComplaint.filter(Boolean) : ["জ্বর ৩ দিন ধরে", "মাথা ব্যথা", "শরীর ব্যথা"];
    const diagnoses = (d?.consultation.diagnosis.filter(Boolean).length) ? d.consultation.diagnosis.filter(Boolean) : ["Viral Fever", "Myalgia"];
    const investigations = (d?.consultation.investigations.filter(Boolean).length) ? d.consultation.investigations.filter(Boolean) : ["CBC with ESR", "Dengue NS1 Ag", "Urine R/M/E"];
    const adviceList = (d?.consultation.advices.filter(Boolean).length) ? d.consultation.advices.filter(Boolean) : ["পর্যাপ্ত পানি ও তরল খাবার খান", "সম্পূর্ণ বিশ্রামে থাকুন", "জ্বর ১০৩°F এর বেশি হলে জরুরি বিভাগে আসুন"];
    const followUp = (d?.consultation.followUp) || "৭ দিন পর রিপোর্ট সহ";
    const vitals = d ? d.consultation.vitals : { bp: "120/80 mmHg", pulse: "92/min", weight: "68 kg", spo2: "97%", temp: "101.4°F" };
    const meds = d ? d.consultation.medicines : [
      { name: "Paracetamol 500mg", form: "Tab.", dosage: "", frequency: "1+0+1", timing: "খাবার পরে", duration: "৫ দিন" },
      { name: "Montelukast 10mg", form: "Tab.", dosage: "", frequency: "0+0+1", timing: "রাতে", duration: "৭ দিন" },
      { name: "Omeprazole 20mg", form: "Cap.", dosage: "", frequency: "1+0+1", timing: "খাবার আগে", duration: "১৪ দিন" },
      { name: "Ambroxol 15mg/5ml", form: "Syp.", dosage: "", frequency: "2 চা চামচ", timing: "দিনে ৩ বার", duration: "৫ দিন" },
    ];
    const patientName = d ? d.patient.name : "মোঃ করিম উদ্দিন";
    const patientAge = d ? d.patient.age : "35Y";
    const patientGender = d ? d.patient.gender : "Male";
    const patientPhone = d ? d.patient.phone : "01712345678";
    const patientId = d ? d.patient.patientId : "P-0042";
    const consultDate = d ? d.consultation.date : "2026-07-13";

    const bodyLeft = `
      <div style="font-size:10pt;font-weight:700;text-transform:uppercase;color:#0d9488;border-bottom:1.5px solid #e2e8f0;padding-bottom:2px;margin:6px 0 4px">Chief Complaint</div>
      <ul style="margin:4px 0;padding-left:16px;font-size:10pt">${complaints.map((c) => `<li>${c}</li>`).join("")}</ul>
      <div style="font-size:10pt;font-weight:700;text-transform:uppercase;color:#0d9488;border-bottom:1.5px solid #e2e8f0;padding-bottom:2px;margin:10px 0 4px">On Examination</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;font-size:10pt">${vitals.bp ? `<span>• BP: ${vitals.bp}</span>` : ""}${vitals.pulse ? `<span>• Pulse: ${vitals.pulse}</span>` : ""}${vitals.temp ? `<span>• Temp: ${vitals.temp}</span>` : ""}${vitals.spo2 ? `<span>• SpO2: ${vitals.spo2}</span>` : ""}${vitals.weight ? `<span>• Weight: ${vitals.weight}</span>` : ""}</div>
      <div style="font-size:10pt;font-weight:700;text-transform:uppercase;color:#0d9488;border-bottom:1.5px solid #e2e8f0;padding-bottom:2px;margin:10px 0 4px">Diagnosis</div>
      <ul style="margin:4px 0;padding-left:16px;font-size:10pt">${diagnoses.map((d) => `<li>${d}</li>`).join("")}</ul>
      ${investigations.length > 0 ? `<div style="font-size:10pt;font-weight:700;text-transform:uppercase;color:#0d9488;border-bottom:1.5px solid #e2e8f0;padding-bottom:2px;margin:10px 0 4px">Investigation</div><ol style="margin:4px 0;padding-left:16px;font-size:10pt">${investigations.map((inv) => `<li>${inv}</li>`).join("")}</ol>` : ""}
    `;

    const bodyRight = `
      <div style="font-size:20pt;font-weight:bold;color:#0d9488;margin:0 0 10px">Rx,</div>
      ${meds.map((m, i) => `<div style="font-size:10pt"><p style="margin:0 0 2px"><strong>${i + 1}. ${m.form} ${m.name} ${m.dosage || ""}</strong></p><p style="margin:0 0 8px;color:#475569;padding-left:14px">${[m.frequency, m.timing, m.duration].filter(Boolean).join(" ─── ")}</p></div>`).join("")}
      ${adviceList.length > 0 ? `<div style="font-size:10pt;font-weight:700;text-transform:uppercase;color:#0d9488;border-bottom:1.5px solid #e2e8f0;padding-bottom:2px;margin:12px 0 4px">Advices</div><div style="font-size:10pt">${adviceList.map((a, i) => `<p style="margin:0 0 3px">${i + 1}. ${a}</p>`).join("")}</div>` : ""}
      ${followUp ? `<div style="font-size:10pt;font-weight:700;text-transform:uppercase;color:#0d9488;border-bottom:1.5px solid #e2e8f0;padding-bottom:2px;margin:12px 0 4px">Follow-up</div><p style="font-size:10pt;margin:4px 0">${followUp}</p>` : ""}
    `;

    const body = l.bodyColumns === 1
      ? `<div>${bodyLeft}${bodyRight}</div>`
      : `<div style="display:flex;gap:12px;flex:1"><div style="width:${l.bodyLeftWidth}%">${bodyLeft}</div><div style="width:${100 - l.bodyLeftWidth}%;border-left:1.5px solid #e2e8f0;padding-left:12px">${bodyRight}</div></div>`;

    const sig = l.showSignature
      ? `<div style="text-align:right;margin-top:20px"><div style="border-top:1px solid #0f172a;display:inline-block;width:120px;margin-bottom:4px"></div><p style="margin:0;font-size:11pt;font-weight:600">${l.signatureName || "Doctor"}</p><p style="margin:0;font-size:10pt;color:#475569">${l.signatureTitle || "Title"}</p></div>`
      : "";

    const hasQrCell = [...l.header, ...l.footer].some((r) => r.cells.some((c) => c.type === "qr"));
    const qr = (l.showQR && !hasQrCell)
      ? `<div style="text-align:${l.qrPosition === "footer-left" ? "left" : l.qrPosition === "footer-center" ? "center" : "right"};margin-top:6px"><div style="width:50px;height:50px;border:1.5px solid #e2e8f0;display:inline-flex;align-items:center;justify-content:center;font-size:9pt;color:#94a3b8;border-radius:4px">QR</div></div>`
      : "";

    // Use real page size in mm, rendered at 1mm = 3.78px (96dpi)
    const pxPerMm = 3.78;
    const pageW = page.width * pxPerMm;
    const pageH = page.height * pxPerMm;

    return `<!DOCTYPE html><html><head><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: #f1f5f9; }
      body { display: flex; align-items: center; justify-content: center; }
      .page {
        width: ${pageW}px;
        height: ${pageH}px;
        padding: ${margins.top * pxPerMm}px ${margins.right * pxPerMm}px ${margins.bottom * pxPerMm}px ${margins.left * pxPerMm}px;
        position: absolute;
        top: 0;
        left: 50%;
        transform-origin: top center;
        background: white;
        box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        font-family: 'Noto Sans Bengali', system-ui, -apple-system, sans-serif;
        font-size: 10pt;
        color: #0f172a;
        line-height: 1.4;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .page-body { flex: 1; overflow: hidden; }
      .patient-bar { display: flex; flex-wrap: wrap; gap: 4px 14px; border: 1.5px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; margin-bottom: 12px; font-size: 10pt; }
      .patient-bar strong { color: #0f172a; }
      .footer-section { border-top: 1.5px solid #e2e8f0; padding-top: 8px; margin-top: auto; }
    </style></head><body>
    <div class="page" id="page">
      ${wmHtml}
      <!-- Header -->
      ${l.header.map(renderRow).join("")}
      <!-- Patient Info Bar -->
      <div class="patient-bar">
        <span><strong>Name:</strong> ${patientName}</span>
        <span><strong>Age:</strong> ${patientAge}</span>
        <span><strong>Gender:</strong> ${patientGender}</span>
        <span><strong>Date:</strong> ${consultDate}</span>
        <span><strong>ID:</strong> ${patientId}</span>
        <span><strong>Phone:</strong> ${patientPhone}</span>
      </div>
      <!-- Body -->
      <div class="page-body">${body}</div>
      <!-- Signature -->
      ${sig}
      <!-- Footer -->
      <div class="footer-section">
        ${l.footer.map(renderRow).join("")}
        ${qr}
      </div>
    </div>
    <script>
      function fit() {
        var p = document.getElementById('page');
        if (!p) return;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var scale = Math.min(vw / ${pageW}, vh / ${pageH}) * 0.92;
        p.style.transform = 'translateX(-50%) scale(' + scale + ')';
        p.style.marginTop = ((vh - ${pageH} * scale) / 2) + 'px';
      }
      fit();
      window.addEventListener('resize', fit);
    </script>
    </body></html>`;
  }

  const TABS = [{ id: "header" as const, label: "Header" }, { id: "footer" as const, label: "Footer" }, { id: "body" as const, label: "Body" }, { id: "watermark" as const, label: "Watermark" }, { id: "page" as const, label: "Page" }];

  return (
    <div ref={containerRef} className="flex" style={{ height: "calc(100vh - 160px)" }}>
      {/* Editor */}
      <div className="overflow-y-auto pr-3 space-y-4" style={{ width: `${editorWidth}%` }}>
        <div className="sticky top-0 z-20 flex gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
          {TABS.map((t) => (<button key={t.id} type="button" onClick={() => setTab(t.id)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${tab === t.id ? "bg-brand text-white" : "text-muted hover:bg-slate-50"}`}>{t.label}</button>))}
        </div>

        {(tab === "header" || tab === "footer") && (
          <RowsEditor section={tab} rows={layout[tab]} addRow={(cols) => addRow(tab, cols)} removeRow={(i) => removeRow(tab, i)} updateRow={(i, r) => updateRow(tab, i, r)} />
        )}

        {tab === "body" && (
          <div className="space-y-4">
            <div><label className={labelClass}>Columns</label><select value={layout.bodyColumns} onChange={(e) => setLayout((l) => ({ ...l, bodyColumns: Number(e.target.value) as 1|2 }))} className={inputClass}><option value={2}>2 Columns</option><option value={1}>1 Column</option></select></div>
            {layout.bodyColumns === 2 && <div><label className={labelClass}>Left Width: {layout.bodyLeftWidth}%</label><input type="range" min={20} max={60} value={layout.bodyLeftWidth} onChange={(e) => setLayout((l) => ({ ...l, bodyLeftWidth: Number(e.target.value) }))} className="w-full" /></div>}
            <div className="flex items-center gap-3"><input type="checkbox" id="sig" checked={layout.showSignature} onChange={(e) => setLayout((l) => ({ ...l, showSignature: e.target.checked }))} /><label htmlFor="sig" className="text-sm">Show signature</label></div>
            {layout.showSignature && <div className="grid gap-2 grid-cols-2"><div><label className={labelClass}>Name</label><input value={layout.signatureName} onChange={(e) => setLayout((l) => ({ ...l, signatureName: e.target.value }))} className={inputClass} /></div><div><label className={labelClass}>Title</label><input value={layout.signatureTitle} onChange={(e) => setLayout((l) => ({ ...l, signatureTitle: e.target.value }))} className={inputClass} /></div></div>}
          </div>
        )}

        {tab === "watermark" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><input type="checkbox" id="wm" checked={layout.watermark.enabled} onChange={(e) => setLayout((l) => ({ ...l, watermark: { ...l.watermark, enabled: e.target.checked } }))} /><label htmlFor="wm" className="text-sm">Enable watermark</label></div>
            {layout.watermark.enabled && <>
              <div><label className={labelClass}>Type</label><select value={layout.watermark.type} onChange={(e) => setLayout((l) => ({ ...l, watermark: { ...l.watermark, type: e.target.value as "text"|"image" } }))} className={inputClass}><option value="text">Text</option><option value="image">Image</option></select></div>
              {layout.watermark.type === "text" && <div><label className={labelClass}>Text</label><input value={layout.watermark.text||""} onChange={(e) => setLayout((l) => ({ ...l, watermark: { ...l.watermark, text: e.target.value } }))} className={inputClass} /></div>}
              {layout.watermark.type === "image" && <div><label className={labelClass}>Watermark Image</label><ImageUploadInline value={layout.watermark.image||""} onChange={(url) => setLayout((l) => ({ ...l, watermark: { ...l.watermark, image: url } }))} /></div>}
              <div className="grid grid-cols-3 gap-2"><div><label className={labelClass}>Opacity</label><input type="number" min={0} max={1} step={0.01} value={layout.watermark.opacity} onChange={(e) => setLayout((l) => ({ ...l, watermark: { ...l.watermark, opacity: Number(e.target.value) } }))} className={inputClass} /></div><div><label className={labelClass}>Size</label><input type="number" value={layout.watermark.fontSize||60} onChange={(e) => setLayout((l) => ({ ...l, watermark: { ...l.watermark, fontSize: Number(e.target.value) } }))} className={inputClass} /></div><div><label className={labelClass}>Angle°</label><input type="number" min={-90} max={90} value={layout.watermark.rotation||-30} onChange={(e) => setLayout((l) => ({ ...l, watermark: { ...l.watermark, rotation: Number(e.target.value) } }))} className={inputClass} /></div></div>
            </>}
          </div>
        )}

        {tab === "page" && (
          <div className="space-y-4">
            <div><label className={labelClass}>Page Size</label><select value={layout.pageSize} onChange={(e) => setLayout((l) => ({ ...l, pageSize: e.target.value as "A4"|"A5"|"Letter" }))} className={inputClass}><option value="A4">A4</option><option value="A5">A5</option><option value="Letter">Letter</option></select></div>
            <div><label className={labelClass}>Margins (mm)</label><div className="grid grid-cols-4 gap-2">{(["top","right","bottom","left"] as const).map((s) => (<div key={s}><label className="text-[10px] text-muted capitalize">{s}</label><input type="number" min={0} max={50} value={layout.margins[s]} onChange={(e) => setLayout((l) => ({ ...l, margins: { ...l.margins, [s]: Number(e.target.value) } }))} className={inputClass} /></div>))}</div></div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4">
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{saving ? "Saving..." : "Save Layout"}</button>
          <button type="button" onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(previewHtml()); w.document.close(); } }} className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand">Print Preview</button>
          {msg && <span className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{msg.text}</span>}
        </div>
      </div>

      {/* Resize Handle */}
      <div onMouseDown={handleResizeStart} className="hidden lg:flex w-2 shrink-0 cursor-col-resize items-center justify-center group"><div className="h-8 w-1 rounded-full bg-slate-300 transition group-hover:bg-brand" /></div>

      {/* Preview */}
      <div className="hidden lg:block overflow-hidden" style={{ width: `${100 - editorWidth}%` }}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Live Preview</h3>
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-ink">{layout.pageSize}</span>
            <span className="text-xs text-muted">{PAGE_SIZES[layout.pageSize]?.width}×{PAGE_SIZES[layout.pageSize]?.height}mm</span>
          </div>
        </div>
        <div className="mx-auto overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner" style={{ height: "calc(100% - 30px)" }}>
          <iframe srcDoc={previewHtml()} className="h-full w-full" title="Prescription Preview" sandbox="allow-same-origin allow-scripts" />
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          Preview shows actual {layout.pageSize} proportions ({PAGE_SIZES[layout.pageSize]?.width}×{PAGE_SIZES[layout.pageSize]?.height}mm) scaled to fit
        </p>
      </div>
    </div>
  );
}

// ─── Rows Editor ────────────────────────────────────────────────────────────

function RowsEditor({ section, rows, addRow, removeRow, updateRow }: {
  section: string; rows: PrescriptionLayoutRow[];
  addRow: (cols: 1|2|3) => void; removeRow: (i: number) => void; updateRow: (i: number, r: PrescriptionLayoutRow) => void;
}) {
  const [confirmRemoveCell, setConfirmRemoveCell] = useState<{ rowIdx: number; targetCols: number } | null>(null);

  function handleColumnChange(ri: number, row: PrescriptionLayoutRow, newCols: 1 | 2 | 3) {
    const oldCols = row.columns;
    if (newCols === oldCols) return;

    if (newCols > oldCols) {
      // Increasing: add empty cells to fill
      const newCells = [...row.cells];
      while (newCells.length < newCols) {
        const align = newCells.length === 0 ? "left" : newCells.length === 1 ? "center" : "right";
        newCells.push({ id: genId(), type: "text", align: align as "left"|"center"|"right", content: "", lines: [{ text: "", fontSize: 11 }] });
      }
      updateRow(ri, { ...row, columns: newCols, cells: newCells });
    } else {
      // Decreasing: check if extra cells have content
      const extraCells = row.cells.slice(newCols);
      const hasContent = extraCells.some((c) =>
        c.type === "logo" ? !!c.content : c.lines.some((l) => l.text.trim() !== "")
      );
      if (hasContent) {
        // Ask user which cell to remove
        setConfirmRemoveCell({ rowIdx: ri, targetCols: newCols });
      } else {
        // Safe to just reduce — no content lost
        updateRow(ri, { ...row, columns: newCols });
      }
    }
  }

  function confirmRemove(ri: number, targetCols: number, cellIndexToRemove: number) {
    const row = rows[ri];
    const newCells = row.cells.filter((_, i) => i !== cellIndexToRemove);
    updateRow(ri, { ...row, columns: targetCols as 1|2|3, cells: newCells });
    setConfirmRemoveCell(null);
  }

  function swapCells(ri: number, from: number, to: number) {
    const row = rows[ri];
    const newCells = [...row.cells];
    const temp = newCells[from];
    newCells[from] = newCells[to];
    newCells[to] = temp;
    updateRow(ri, { ...row, cells: newCells });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Add rows to your {section}. Each row can have 1–3 columns. Drag cells to reorder.</p>
      {rows.map((row, ri) => (
        <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink">Row {ri + 1}</span>
              <select
                value={row.columns}
                onChange={(e) => handleColumnChange(ri, row, Number(e.target.value) as 1|2|3)}
                className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium"
              >
                <option value={1}>1 Column</option>
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 text-muted"><input type="checkbox" checked={row.borderBottom||false} onChange={(e) => updateRow(ri, { ...row, borderBottom: e.target.checked })} className="rounded" />Border</label>
              <span className="text-muted">MT:</span><input type="number" min={0} max={40} value={row.marginTop||0} onChange={(e) => updateRow(ri, { ...row, marginTop: Number(e.target.value) })} className="w-10 rounded border border-slate-200 px-1 py-0.5 text-xs" />
              <span className="text-muted">MB:</span><input type="number" min={0} max={40} value={row.marginBottom??8} onChange={(e) => updateRow(ri, { ...row, marginBottom: Number(e.target.value) })} className="w-10 rounded border border-slate-200 px-1 py-0.5 text-xs" />
              <button type="button" onClick={() => removeRow(ri)} className="text-red-600 font-medium hover:underline">Remove</button>
            </div>
          </div>
          <div className={`grid gap-2 ${row.columns === 1 ? "grid-cols-1" : row.columns === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {row.cells.slice(0, row.columns).map((cell, ci) => (
              <div key={cell.id} className="relative">
                {/* Swap buttons */}
                {row.columns > 1 && (
                  <div className="absolute -top-1 right-0 flex gap-0.5 z-10">
                    {ci > 0 && (
                      <button type="button" onClick={() => swapCells(ri, ci, ci - 1)} className="rounded bg-slate-200 px-1 py-0.5 text-[9px] text-slate-600 hover:bg-brand hover:text-white" title="Move left">←</button>
                    )}
                    {ci < row.columns - 1 && (
                      <button type="button" onClick={() => swapCells(ri, ci, ci + 1)} className="rounded bg-slate-200 px-1 py-0.5 text-[9px] text-slate-600 hover:bg-brand hover:text-white" title="Move right">→</button>
                    )}
                  </div>
                )}
                <CellEditor cell={cell} onChange={(c) => { const newCells = [...row.cells]; newCells[ci] = c; updateRow(ri, { ...row, cells: newCells }); }} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Confirm cell removal modal */}
      {confirmRemoveCell && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-ink mb-2">Remove a column</h3>
            <p className="text-xs text-muted mb-3">
              You&apos;re reducing columns and some cells have content. Choose which cell to remove:
            </p>
            <div className="space-y-2">
              {rows[confirmRemoveCell.rowIdx].cells.slice(0, rows[confirmRemoveCell.rowIdx].columns).map((cell, ci) => {
                const preview = cell.type === "logo" ? "[Image]" : cell.lines.map((l) => l.text).filter(Boolean).join(", ") || "(empty)";
                return (
                  <button
                    key={cell.id}
                    type="button"
                    onClick={() => confirmRemove(confirmRemoveCell.rowIdx, confirmRemoveCell.targetCols, ci)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition hover:border-red-300 hover:bg-red-50"
                  >
                    <span className="text-ink font-medium">Column {ci + 1}: <span className="font-normal text-muted">{preview}</span></span>
                    <span className="text-red-500 font-medium">Remove</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setConfirmRemoveCell(null)}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-muted hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={() => addRow(1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand">+ 1 Col</button>
        <button type="button" onClick={() => addRow(2)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand">+ 2 Cols</button>
        <button type="button" onClick={() => addRow(3)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand">+ 3 Cols</button>
      </div>
    </div>
  );
}

// ─── Inline Image Upload (compact) ──────────────────────────────────────────

function ImageUploadInline({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.ok) onChange(data.url);
    } catch { /* silent */ } finally { setUploading(false); }
  }

  return (
    <div className="space-y-1.5">
      {value && (
        <div className="flex items-center gap-2">
          <img src={value} alt="" className="h-8 max-w-[80px] rounded border border-slate-200 object-contain" />
          <button type="button" onClick={() => onChange("")} className="text-[10px] text-red-500 hover:underline">Remove</button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {uploading ? "Uploading..." : value ? "Change" : "Upload Image"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>
    </div>
  );
}

// ─── Cell Editor (per-line styling) ─────────────────────────────────────────

function CellEditor({ cell, onChange }: { cell: PrescriptionLayoutCell; onChange: (c: PrescriptionLayoutCell) => void }) {
  function updateLine(i: number, line: PrescriptionLine) { onChange({ ...cell, lines: cell.lines.map((l, idx) => idx === i ? line : l) }); }
  function addLine() { onChange({ ...cell, lines: [...cell.lines, { text: "", fontSize: 11 }] }); }
  function removeLine(i: number) { onChange({ ...cell, lines: cell.lines.filter((_, idx) => idx !== i) }); }

  // Determine display mode: logo = image, qr = qr code, text with 1 line = single, text with multiple = multi
  const mode = cell.type === "logo" ? "image" : cell.type === "qr" ? "qr" : cell.lines.length <= 1 ? "single" : "multi";

  function handleModeChange(newMode: string) {
    if (newMode === "image") {
      onChange({ ...cell, type: "logo", lines: [{ text: "", fontSize: 11 }] });
    } else if (newMode === "qr") {
      onChange({ ...cell, type: "qr", lines: [{ text: "", fontSize: 11 }] });
    } else if (newMode === "single") {
      onChange({ ...cell, type: "text", lines: [cell.lines[0] || { text: "", fontSize: 11 }] });
    } else {
      // multi — ensure at least 2 lines
      const lines = cell.lines.length >= 2 ? cell.lines : [...cell.lines, { text: "", fontSize: 11 }];
      onChange({ ...cell, type: "text", lines });
    }
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 space-y-1.5">
      <div className="flex gap-2 items-center">
        <select value={mode} onChange={(e) => handleModeChange(e.target.value)} className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px]">
          <option value="single">Single Line</option>
          <option value="multi">Multiple Lines</option>
          <option value="image">Image</option>
          <option value="qr">QR Code</option>
        </select>
        <select value={cell.align} onChange={(e) => onChange({ ...cell, align: e.target.value as "left"|"center"|"right" })} className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px]">
          <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
        </select>
      </div>
      {cell.type === "qr" ? (
        <div className="flex items-center gap-2 py-1">
          <div className="h-10 w-10 rounded border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400 shrink-0">QR</div>
          <span className="text-[10px] text-muted">QR code auto-generated with prescription link</span>
        </div>
      ) : cell.type === "logo" ? (
        <ImageUploadInline value={cell.content} onChange={(url) => onChange({ ...cell, content: url })} />
      ) : mode === "single" ? (
        <div className="flex items-center gap-1">
          <input value={cell.lines[0]?.text || ""} onChange={(e) => updateLine(0, { ...cell.lines[0], text: e.target.value })} className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs" placeholder="Text..." />
          <input type="number" min={8} max={24} value={cell.lines[0]?.fontSize||11} onChange={(e) => updateLine(0, { ...cell.lines[0], fontSize: Number(e.target.value) })} className="w-10 rounded border border-slate-200 px-1 py-0.5 text-[10px]" title="Font size" />
          <input type="color" value={cell.lines[0]?.color||"#0f172a"} onChange={(e) => updateLine(0, { ...cell.lines[0], color: e.target.value })} className="h-5 w-5 rounded border cursor-pointer" title="Color" />
          <label className="text-[10px]"><input type="checkbox" checked={cell.lines[0]?.bold||false} onChange={(e) => updateLine(0, { ...cell.lines[0], bold: e.target.checked })} className="rounded" /> B</label>
        </div>
      ) : (
        <div className="space-y-1">
          {cell.lines.map((line, li) => (
            <div key={li} className="flex items-center gap-1">
              <input value={line.text} onChange={(e) => updateLine(li, { ...line, text: e.target.value })} className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs" placeholder="Line text..." />
              <input type="number" min={8} max={24} value={line.fontSize||11} onChange={(e) => updateLine(li, { ...line, fontSize: Number(e.target.value) })} className="w-10 rounded border border-slate-200 px-1 py-0.5 text-[10px]" title="Font size" />
              <input type="color" value={line.color||"#0f172a"} onChange={(e) => updateLine(li, { ...line, color: e.target.value })} className="h-5 w-5 rounded border cursor-pointer" title="Color" />
              <label className="text-[10px]"><input type="checkbox" checked={line.bold||false} onChange={(e) => updateLine(li, { ...line, bold: e.target.checked })} className="rounded" /> B</label>
              {cell.lines.length > 1 && <button type="button" onClick={() => removeLine(li)} className="text-[10px] text-red-500">✕</button>}
            </div>
          ))}
          <button type="button" onClick={addLine} className="text-[10px] text-brand font-medium hover:underline">+ Add line</button>
        </div>
      )}
    </div>
  );
}
