import type { Patient, Consultation } from "@/lib/patients";
import type { PrescriptionConfig } from "@/lib/types";
import type { PrescriptionLayout, PrescriptionLayoutRow, PrescriptionLayoutCell, PrescriptionLine } from "@/lib/prescription-layout";
import { DEFAULT_PRESCRIPTION_LAYOUT } from "@/lib/prescription-layout";
import { shortForm } from "@/lib/medicines";

export type DoctorInfo = {
  name: string;
  nameBn: string;
  title: string;
  titleBn: string;
  department: string;
  departmentBn: string;
  hospital: string;
  hospitalBn: string;
  phone: string;
  email: string;
};

function esc(v: unknown): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Layout row/cell rendering (shared with designer preview) ─────────────────

function renderLayoutLine(line: PrescriptionLine): string {
  const style = [
    `font-size:${line.fontSize || 11}px`,
    line.bold ? "font-weight:700" : "",
    line.color ? `color:${line.color}` : "",
    "margin:0",
    "line-height:1.4",
  ].filter(Boolean).join(";");
  return `<p style="${style}">${esc(line.text)}</p>`;
}

function renderLayoutCell(cell: PrescriptionLayoutCell, qrHtml?: string): string {
  if (cell.type === "qr") {
    return `<div style="text-align:${cell.align}">${qrHtml || '<div style="width:70px;height:70px;border:1px solid #e2e8f0;display:inline-flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8">QR</div>'}</div>`;
  }
  if (cell.type === "logo" && cell.content) {
    return `<div style="text-align:${cell.align}"><img src="${esc(cell.content)}" alt="Logo" style="max-height:60px;max-width:150px;object-fit:contain;display:inline-block" /></div>`;
  }
  const linesHtml = cell.lines.filter((l) => l.text).map(renderLayoutLine).join("");
  return `<div style="text-align:${cell.align}">${linesHtml || "&nbsp;"}</div>`;
}

function renderLayoutRow(row: PrescriptionLayoutRow, qrHtml?: string): string {
  const gridCols = row.columns === 1 ? "1fr" : row.columns === 2 ? "1fr 1fr" : "1fr 1fr 1fr";
  const border = row.borderBottom ? "border-bottom:2px solid #0d9488;padding-bottom:8px;" : "";
  const mt = row.marginTop ? `margin-top:${row.marginTop}px;` : "";
  const mb = `margin-bottom:${row.marginBottom ?? 8}px;`;
  return `<div style="display:grid;grid-template-columns:${gridCols};gap:12px;${border}${mt}${mb}">${row.cells.slice(0, row.columns).map((c) => renderLayoutCell(c, qrHtml)).join("")}</div>`;
}

export function generateConsultationHtml(
  patient: Patient,
  consultation: Consultation,
  doctor: DoctorInfo,
  rxConfig?: PrescriptionConfig,
  chamberInfo?: { name: string; address: string; phone: string },
  layout?: PrescriptionLayout | null,
): string {
  const l = layout || DEFAULT_PRESCRIPTION_LAYOUT;

  const meds = consultation.medicines
    .map((m, i) => {
      const line = `${i + 1}. ${esc(shortForm(m.form))} ${esc(m.name)} ${esc(m.dosage)}`;
      const details = [m.frequency, m.timing, m.duration, m.specialNote]
        .filter(Boolean)
        .map(esc)
        .join(" ─── ");
      return `<div class="med-row"><p style="margin:0 0 2px"><strong>${line}</strong></p>
              <p style="margin:0 0 10px;color:#475569;font-size:12px;padding-left:16px">${details}</p></div>`;
    })
    .join("");

  const complaints = consultation.chiefComplaint
    .filter(Boolean)
    .map((c) => `<li>${esc(c)}</li>`)
    .join("");
  const diagnoses = consultation.diagnosis
    .filter(Boolean)
    .map((d) => `<li>${esc(d)}</li>`)
    .join("");
  const advices = consultation.advices
    .filter(Boolean)
    .map((a, i) => `<p style="margin:0 0 3px">${i + 1}. ${esc(a)}</p>`)
    .join("");

  // ─── QR Code ──────────────────────────────────────────────────────────────
  const qrHtml = (l.showQR && consultation.publicToken && consultation._qrSvgBase64)
    ? `<div style="display:inline-block"><img src="data:image/svg+xml;base64,${consultation._qrSvgBase64}" alt="QR" style="width:70px;height:70px" /><p style="font-size:9px;color:#64748b;margin:2px 0 0;text-align:center">Scan for digital copy</p></div>`
    : "";

  // ─── Header: use layout rows ─────────────────────────────────────────────
  const headerHtml = l.header.map((r) => renderLayoutRow(r, qrHtml)).join("");

  // ─── Footer: use layout rows ─────────────────────────────────────────────
  const footerHtml = l.footer.map((r) => renderLayoutRow(r, qrHtml)).join("");

  // ─── Watermark ────────────────────────────────────────────────────────────
  const wm = l.watermark;
  let watermarkHtml = "";
  if (wm.enabled) {
    if (wm.type === "text" && wm.text) {
      watermarkHtml = `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(${wm.rotation || -30}deg);opacity:${wm.opacity};font-size:${wm.fontSize || 60}px;font-weight:700;color:#0f172a;white-space:nowrap;pointer-events:none;z-index:0">${esc(wm.text)}</div>`;
    } else if (wm.type === "image" && wm.image) {
      watermarkHtml = `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(${wm.rotation || 0}deg);opacity:${wm.opacity};pointer-events:none;z-index:0"><img src="${esc(wm.image)}" style="max-width:400px;max-height:400px" /></div>`;
    }
  }

  // ─── Body columns ─────────────────────────────────────────────────────────
  const leftCol = `
    ${complaints ? `<div class="section-title">Chief Complaint</div><ul>${complaints}</ul>` : ""}
    ${consultation.history ? `<div class="section-title">History</div><p style="font-size:12px">${esc(consultation.history)}</p>` : ""}
    <div class="section-title">On Examination</div>
    <div class="vitals-grid">
      ${consultation.vitals.bp ? `<span>• BP: ${esc(consultation.vitals.bp)}</span>` : ""}
      ${consultation.vitals.pulse ? `<span>• Pulse: ${esc(consultation.vitals.pulse)}</span>` : ""}
      ${consultation.vitals.weight ? `<span>• Weight: ${esc(consultation.vitals.weight)}</span>` : ""}
      ${consultation.vitals.spo2 ? `<span>• SpO2: ${esc(consultation.vitals.spo2)}</span>` : ""}
      ${consultation.vitals.temperature ? `<span>• Temp: ${esc(consultation.vitals.temperature)}</span>` : ""}
      ${consultation.vitals.others ? `<span>• ${esc(consultation.vitals.others)}</span>` : ""}
    </div>
    ${diagnoses ? `<div class="section-title">Diagnosis</div><ul>${diagnoses}</ul>` : ""}
    ${(consultation.investigations?.filter(Boolean).length ?? 0) > 0 ? `<div class="section-title">Investigation</div><ol style="margin:4px 0;padding-left:18px;font-size:13px">${consultation.investigations!.filter(Boolean).map((inv) => `<li>${esc(inv)}</li>`).join("")}</ol>${consultation.investigationDiscount > 0 ? `<p style="margin-top:4px;font-size:12px;color:#0d9488;font-weight:600">↑ ${consultation.investigationDiscount}% discount applicable</p>` : ""}` : ""}`;

  const rightCol = `
    <div class="rx-symbol">Rx,</div>
    <div class="medicines-block${consultation.medicines.length > 8 ? " allow-break" : ""}">
    ${meds}
    </div>
    ${advices ? `<div class="advices-block"><div class="section-title">Advices</div>${advices}</div>` : ""}
    ${consultation.followUp ? `<div class="section-title">Follow-up</div><p>${esc(consultation.followUp)}</p>` : ""}
    ${consultation.notes ? `<div class="section-title">Notes</div><p>${esc(consultation.notes)}</p>` : ""}`;

  const bodyHtml = l.bodyColumns === 1
    ? `<div>${leftCol}${rightCol}</div>`
    : `<div class="columns"><div class="col-left" style="width:${l.bodyLeftWidth}%">${leftCol}</div><div class="col-right" style="width:${100 - l.bodyLeftWidth}%">${rightCol}</div></div>`;

  // ─── Signature ────────────────────────────────────────────────────────────
  const sigHtml = l.showSignature
    ? `<div class="signature"><div class="line"></div><p style="margin:0;font-weight:600">${esc(l.signatureName || doctor.name)}</p><p style="margin:0;font-size:11px;color:#475569">${esc(l.signatureTitle || doctor.title)}</p></div>`
    : "";

  // ─── Page size & margins ──────────────────────────────────────────────────
  const pageCSS = l.pageSize === "A5" ? "A5" : l.pageSize === "Letter" ? "Letter" : "A4";
  const margins = `${l.margins.top}mm ${l.margins.right}mm ${l.margins.bottom}mm ${l.margins.left}mm`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Prescription — ${esc(patient.name)}</title>
<style>
  @page { size: ${pageCSS}; margin: ${margins}; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; line-height: 1.4; padding: 0; margin: 0; font-size: 13px; position: relative; }
  .page { max-width: 800px; margin: auto; padding: 24px; position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; }
  .page-body { flex: 1; }
  .patient-bar { display: flex; flex-wrap: wrap; gap: 4px 24px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 12px; }
  .patient-bar span { white-space: nowrap; }
  .patient-bar strong { color: #0f172a; }
  .columns { display: flex; gap: 24px; }
  .col-left { width: ${l.bodyLeftWidth}%; }
  .col-right { width: ${100 - l.bodyLeftWidth}%; border-left: 1px solid #e2e8f0; padding-left: 20px; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0d9488; margin: 12px 0 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; }
  ul { margin: 4px 0; padding-left: 18px; }
  li { margin-bottom: 2px; }
  .rx-symbol { font-size: 22px; font-weight: bold; color: #0d9488; margin: 0 0 8px; }
  .vitals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; font-size: 12px; }
  .footer-section { padding-top: 8px; border-top: 1px solid #e2e8f0; margin-top: auto; }
  .powered-by { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 8px; letter-spacing: 0.3px; }
  .signature { text-align: right; margin-top: 24px; }
  .signature .line { border-top: 1px solid #0f172a; display: inline-block; width: 160px; margin-bottom: 4px; }
  .med-row { page-break-inside: avoid; }
  .medicines-block { page-break-inside: avoid; }
  .medicines-block.allow-break { page-break-inside: auto; }
  .advices-block { page-break-before: auto; }
  @media print {
    @page { size: ${pageCSS}; margin: ${margins}; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 0; max-width: none; min-height: auto; }
    .footer-section { position: fixed; bottom: 0; left: 0; right: 0; padding: 8px ${l.margins.right}mm 0 ${l.margins.left}mm; border-top: 1px solid #e2e8f0; background: white; }
    .powered-by { margin-bottom: 0; }
  }
</style>
</head>
<body>
${watermarkHtml}
<div class="page">
  ${headerHtml}

  <div class="patient-bar">
    <span><strong>Name:</strong> ${esc(patient.name)}</span>
    <span><strong>Age:</strong> ${esc(patient.age)}</span>
    <span><strong>Gender:</strong> ${esc(patient.gender)}</span>
    <span><strong>Date:</strong> ${esc(consultation.date)}</span>
    <span><strong>ID:</strong> ${esc(patient.patientId)}</span>
    <span><strong>Phone:</strong> ${esc(patient.phone)}</span>
  </div>

  <div class="page-body">
    ${bodyHtml}
    ${sigHtml}
  </div>

  <div class="footer-section">
    ${footerHtml}
    ${(() => {
      const hasQrCell = [...l.header, ...l.footer].some((r) => r.cells.some((c) => c.type === "qr"));
      if (hasQrCell || !l.showQR) return "";
      const align = l.qrPosition === "footer-left" ? "left" : l.qrPosition === "footer-center" ? "center" : "right";
      return `<div style="text-align:${align};margin-top:8px">${qrHtml}</div>`;
    })()}
    <p class="powered-by">Powered by MediSite</p>
  </div>
</div>
</body>
</html>`;
}

export function printConsultation(
  patient: Patient,
  consultation: Consultation,
  doctor: DoctorInfo,
  rxConfig?: PrescriptionConfig,
  chamberInfo?: { name: string; address: string; phone: string },
  layout?: PrescriptionLayout | null,
) {
  const html = generateConsultationHtml(patient, consultation, doctor, rxConfig, chamberInfo, layout);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
