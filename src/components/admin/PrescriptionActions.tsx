"use client";

import { useState } from "react";
import type { Patient, Consultation } from "@/lib/patients";
import type { PrescriptionConfig, Chamber } from "@/lib/types";
import { printConsultation, type DoctorInfo } from "@/lib/prescription-pdf";

export default function PrescriptionActions({
  patient,
  consultation,
  doctor,
  rxConfig,
  chambers,
}: {
  patient: Patient;
  consultation: Consultation;
  doctor: DoctorInfo;
  rxConfig?: PrescriptionConfig;
  chambers?: Chamber[];
}) {
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  // Resolve chamber for this consultation
  const chamber = chambers?.find((c) => c.id === consultation.chamberId);
  const chamberInfo = chamber
    ? { name: chamber.name, address: chamber.address, phone: chamber.phone }
    : undefined;

  function handlePrint() {
    printConsultation(patient, consultation, doctor, rxConfig, chamberInfo);
  }

  async function handleEmail() {
    const email = patient.email || prompt("Enter patient email address:", "");
    if (!email) return;
    setSending(true); setMsg("");
    try {
      const res = await fetch("/api/admin/send-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          consultationId: consultation.id,
          recipientEmail: email,
        }),
      });
      const data = await res.json();
      setMsg(data.ok ? `✓ Sent to ${email}` : data.error ?? "Failed");
    } catch { setMsg("Network error"); }
    finally { setSending(false); }
  }

  function handleWhatsApp() {
    const phone = patient.phone.replace(/[\s\-()]/g, "").replace(/^\+/, "");
    const date = consultation.date;
    const meds = consultation.medicines
      .map((m, i) => `${i + 1}. ${m.form} ${m.name} ${m.dosage} - ${m.frequency} ${m.timing} (${m.duration})`)
      .join("\n");
    const advices = consultation.advices
      .filter(Boolean)
      .map((a, i) => `${i + 1}. ${a}`)
      .join("\n");
    const followUp = consultation.followUp ? `\nFollow-up: ${consultation.followUp}` : "";

    const text = [
      `Prescription - ${doctor.name}`,
      `Patient: ${patient.name} (${patient.patientId})`,
      `Date: ${date}`,
      ``,
      `Medicines:`,
      meds,
      advices ? `\nAdvices:\n${advices}` : "",
      followUp,
    ].filter(Boolean).join("\n");

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <button type="button" onClick={handlePrint}
        className="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-slate-200">
        Print / PDF
      </button>
      <button type="button" onClick={handleEmail} disabled={sending}
        className="rounded bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-dark transition hover:bg-brand/20 disabled:opacity-50">
        {sending ? "Sending…" : "Email"}
      </button>
      <button type="button" onClick={handleWhatsApp}
        className="rounded bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 transition hover:bg-green-200">
        WhatsApp
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
      {chamber && <span className="text-xs text-muted">@ {chamber.name}</span>}
    </div>
  );
}
