import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { generateConsultationHtml, type DoctorInfo } from "@/lib/prescription-pdf";
import type { Patient, Consultation, MedicineEntry } from "@/lib/patients";
import type { PrescriptionConfig } from "@/lib/types";
import PrescriptionView from "./PrescriptionView";

export const dynamic = "force-dynamic";

export default async function PublicPrescriptionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Find consultation by publicToken
  const consultation = await prisma.consultation.findUnique({
    where: { publicToken: token },
    include: { patient: true },
  });

  if (!consultation) {
    notFound();
  }

  // Load settings for doctor info and prescription config
  const settingsRow = await prisma.setting.findUnique({ where: { id: "main" } });
  const settings = settingsRow?.data as Record<string, unknown> | undefined;

  const doctorSettings = (settings?.doctor ?? {}) as Record<string, unknown>;
  const doctor: DoctorInfo = {
    name: ((doctorSettings.name as Record<string, string>)?.en) ?? "",
    nameBn: ((doctorSettings.name as Record<string, string>)?.bn) ?? "",
    title: ((doctorSettings.title as Record<string, string>)?.en) ?? "",
    titleBn: ((doctorSettings.title as Record<string, string>)?.bn) ?? "",
    department: ((doctorSettings.department as Record<string, string>)?.en) ?? "",
    departmentBn: ((doctorSettings.department as Record<string, string>)?.bn) ?? "",
    hospital: ((doctorSettings.hospital as Record<string, string>)?.en) ?? "",
    hospitalBn: ((doctorSettings.hospital as Record<string, string>)?.bn) ?? "",
    phone: ((settings?.contact as Record<string, unknown>)?.phone as string) ?? "",
    email: ((settings?.contact as Record<string, unknown>)?.email as string) ?? "",
  };

  const rxConfig = (settings?.prescription ?? {
    header: { leftLines: [], rightLines: [], contactLines: [] },
    footer: { leftText: "", centerText: "Generated digitally", rightText: "" },
    predefinedAdvices: [],
    predefinedDiagnoses: [],
    timingOptions: [],
    followUpOptions: [],
  }) as PrescriptionConfig;

  // Build patient and consultation types for the html generator
  const patient: Patient = {
    id: consultation.patient.id,
    patientId: consultation.patient.patientId,
    name: consultation.patient.name,
    age: consultation.patient.age,
    gender: consultation.patient.gender,
    phone: consultation.patient.phone,
    email: consultation.patient.email,
    address: consultation.patient.address,
    notes: "",
    visits: [],
    consultations: [],
    history: [],
    prescriptions: [],
    testReports: [],
    createdAt: "",
    updatedAt: "",
  };

  const con: Consultation = {
    id: consultation.id,
    date: consultation.date,
    chamberId: consultation.chamberId ?? undefined,
    vitals: {
      bp: consultation.vitalsBp,
      pulse: consultation.vitalsPulse,
      weight: consultation.vitalsWeight,
      spo2: consultation.vitalsSpo2,
      temperature: consultation.vitalsTemp,
      others: consultation.vitalsOthers,
    },
    chiefComplaint: consultation.chiefComplaint,
    history: consultation.history,
    onExamination: consultation.onExamination,
    diagnosis: consultation.diagnosis,
    medicines: Array.isArray(consultation.medicines) ? consultation.medicines as MedicineEntry[] : [],
    investigations: consultation.investigations ?? [],
    investigationDiscount: consultation.investigationDiscount ?? 0,
    advices: consultation.advices,
    followUp: consultation.followUp,
    notes: consultation.notes,
    attachment: consultation.attachment || undefined,
    payment: undefined,
    previousVersionId: consultation.previousVersionId ?? undefined,
    superseded: consultation.superseded,
    publicToken: consultation.publicToken,
  };

  // Find chamber info if applicable
  const appointmentConfig = settings?.appointment as { chambers?: Array<{ id: string; name: string; address: string; phone: string }> } | undefined;
  const chambers = appointmentConfig?.chambers ?? [];
  const chamber = consultation.chamberId ? chambers.find((c) => c.id === consultation.chamberId) : undefined;
  const chamberInfo = chamber ? { name: chamber.name, address: chamber.address, phone: chamber.phone } : undefined;

  // Generate QR code for this prescription
  const { generateQRBase64 } = await import("@/lib/qr");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  con._qrSvgBase64 = await generateQRBase64(`${baseUrl}/prescription/${token}`);

  const html = generateConsultationHtml(patient, con, doctor, rxConfig, chamberInfo);

  return <PrescriptionView html={html} token={token} patientName={patient.name} />;
}
