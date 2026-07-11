import type { Patient, Consultation } from "@/lib/patients";
import type { PrescriptionConfig } from "@/lib/types";
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

export function generateConsultationHtml(
  patient: Patient,
  consultation: Consultation,
  doctor: DoctorInfo,
  rxConfig?: PrescriptionConfig,
  chamberInfo?: { name: string; address: string; phone: string }
): string {
  const meds = consultation.medicines
    .map((m, i) => {
      const line = `${i + 1}. ${esc(shortForm(m.form))} ${esc(m.name)} ${esc(m.dosage)}`;
      const details = [m.frequency, m.timing, m.duration, m.specialNote]
        .filter(Boolean)
        .map(esc)
        .join(" ---- ");
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

  const headerLeft = rxConfig?.header.leftLines.length
    ? rxConfig.header.leftLines.map((l) => `<p style="margin:2px 0">${esc(l)}</p>`).join("")
    : `<h1>${esc(doctor.nameBn || doctor.name)}</h1><p style="margin:2px 0">${esc(doctor.titleBn || doctor.title)}, ${esc(doctor.departmentBn || doctor.department)}</p><p style="margin:2px 0">${esc(doctor.hospitalBn || doctor.hospital)}</p>`;

  const headerRight = rxConfig?.header.rightLines.length
    ? rxConfig.header.rightLines.map((l) => `<p style="margin:2px 0">${esc(l)}</p>`).join("")
    : `<h2>${esc(doctor.name)}</h2><p style="margin:2px 0">${esc(doctor.title)}, ${esc(doctor.department)}</p><p style="margin:2px 0">${esc(doctor.hospital)}</p>`;

  const contactInfo = rxConfig?.header.contactLines.length
    ? rxConfig.header.contactLines.map((l) => `<p style="margin:2px 0">${esc(l)}</p>`).join("")
    : `<p style="margin:2px 0">Phone: ${esc(doctor.phone)}</p><p style="margin:2px 0">Email: ${esc(doctor.email)}</p>`;

  const footerLeft = rxConfig?.footer.leftText || "";
  const footerCenter = rxConfig?.footer.centerText || "Generated digitally";
  const footerRight = rxConfig?.footer.rightText || "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Prescription — ${esc(patient.name)}</title>
<style>
  @page { size: A4; margin: 15mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; line-height: 1.4; padding: 0; margin: 0; font-size: 13px; }
  .page { max-width: 800px; margin: auto; padding: 24px; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 12px; }
  .header-left { font-size: 11px; color: #475569; max-width: 33%; }
  .header-left h1 { font-size: 14px; margin: 0; color: #0f172a; }
  .header-center { text-align: center; font-size: 11px; color: #475569; max-width: 34%; }
  .header-center .chamber-name { font-size: 13px; font-weight: 700; color: #0d9488; margin: 0; }
  .header-right { text-align: right; font-size: 11px; max-width: 33%; }
  .header-right h2 { font-size: 14px; margin: 0; color: #0f172a; }
  .patient-bar { display: flex; flex-wrap: wrap; gap: 4px 24px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 12px; }
  .patient-bar span { white-space: nowrap; }
  .patient-bar strong { color: #0f172a; }
  .columns { display: flex; gap: 24px; }
  .col-left { width: 38%; }
  .col-right { width: 62%; border-left: 1px solid #e2e8f0; padding-left: 20px; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0d9488; margin: 12px 0 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; }
  ul { margin: 4px 0; padding-left: 18px; }
  li { margin-bottom: 2px; }
  .rx-symbol { font-size: 22px; font-weight: bold; color: #0d9488; margin: 0 0 8px; }
  .vitals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; font-size: 12px; }
  .footer { padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
  .signature { text-align: right; margin-top: 40px; }
  .signature .line { border-top: 1px solid #0f172a; display: inline-block; width: 160px; margin-bottom: 4px; }
  @media print {
    body { margin: 0; padding: 0; }
    .page { padding: 15mm 20mm; position: relative; min-height: calc(100vh - 30mm); }
    .footer { position: fixed; bottom: 10mm; left: 20mm; right: 20mm; }
  }
  .signature { text-align: right; margin-top: 24px; }
  .signature .line { border-top: 1px solid #0f172a; display: inline-block; width: 160px; margin-bottom: 4px; }
  .med-row { page-break-inside: avoid; }
  .medicines-block { page-break-inside: avoid; }
  .medicines-block.allow-break { page-break-inside: auto; }
  .advices-block { page-break-before: auto; }
  @media print {
    @page { size: A4; margin: 15mm 20mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 0; max-width: none; }
    .med-row { page-break-inside: avoid; }
    .medicines-block { page-break-inside: avoid; }
    .medicines-block.allow-break { page-break-inside: auto; }
    .advices-block { page-break-before: auto; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      ${headerLeft}
    </div>
    <div class="header-center">
      ${chamberInfo ? `<p class="chamber-name">${esc(chamberInfo.name)}</p><p style="margin:2px 0">${esc(chamberInfo.address)}</p>${chamberInfo.phone ? `<p style="margin:2px 0">☎ ${esc(chamberInfo.phone)}</p>` : ""}` : contactInfo}
    </div>
    <div class="header-right">
      ${headerRight}
    </div>
  </div>

  <div class="patient-bar">
    <span><strong>Name:</strong> ${esc(patient.name)}</span>
    <span><strong>Age:</strong> ${esc(patient.age)}</span>
    <span><strong>Date:</strong> ${esc(consultation.date)}</span>
    <span><strong>ID:</strong> ${esc(patient.patientId)}</span>
    <span><strong>Address:</strong> ${esc(patient.address)}</span>
    <span><strong>Gender:</strong> ${esc(patient.gender)}</span>
    <span><strong>Phone:</strong> ${esc(patient.phone)}</span>
  </div>

  <div class="columns">
    <div class="col-left">
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
    </div>

    <div class="col-right">
      <div class="rx-symbol">Rx,</div>
      <div class="medicines-block${consultation.medicines.length > 8 ? " allow-break" : ""}">
      ${meds}
      </div>
      ${advices ? `<div class="advices-block"><div class="section-title">Advices</div>${advices}</div>` : ""}
      ${consultation.followUp ? `<div class="section-title">Follow-up</div><p>${esc(consultation.followUp)}</p>` : ""}
      ${consultation.notes ? `<div class="section-title">Notes</div><p>${esc(consultation.notes)}</p>` : ""}
    </div>
  </div>

  <div class="signature">
    <div class="line"></div>
    <p style="margin:0;font-weight:600">${esc(doctor.name)}</p>
    <p style="margin:0;font-size:11px;color:#475569">${esc(doctor.title)}</p>
  </div>

  <div class="footer">
    <span>${esc(footerLeft)}</span>
    <span>${esc(footerCenter)}</span>
    <span>${esc(footerRight)}</span>
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
  chamberInfo?: { name: string; address: string; phone: string }
) {
  const html = generateConsultationHtml(patient, consultation, doctor, rxConfig, chamberInfo);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
