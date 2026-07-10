import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/store";
import { getPatientById } from "@/lib/patients";
import { generateConsultationHtml, type DoctorInfo } from "@/lib/prescription-pdf";
import { t } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { patientId: string; consultationId: string; recipientEmail?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body." }, { status: 400 });
  }

  const { patientId, consultationId, recipientEmail } = body;
  if (!patientId || !consultationId) {
    return NextResponse.json(
      { ok: false, error: "patientId and consultationId are required." },
      { status: 400 }
    );
  }

  const [patient, settings] = await Promise.all([
    getPatientById(patientId),
    getSettings(),
  ]);

  if (!patient) {
    return NextResponse.json({ ok: false, error: "Patient not found." }, { status: 404 });
  }

  const consultation = patient.consultations.find((c) => c.id === consultationId);
  if (!consultation) {
    return NextResponse.json({ ok: false, error: "Consultation not found." }, { status: 404 });
  }

  const emailCfg = settings.email;
  if (!emailCfg.enabled || !emailCfg.host || !emailCfg.user) {
    return NextResponse.json(
      { ok: false, error: "Email not configured. Go to Settings → Email." },
      { status: 400 }
    );
  }

  const to = recipientEmail || patient.email;
  if (!to) {
    return NextResponse.json(
      { ok: false, error: "No recipient email address." },
      { status: 400 }
    );
  }

  const doctorInfo: DoctorInfo = {
    name: t(settings.doctor.name, "en"),
    nameBn: t(settings.doctor.name, "bn"),
    title: t(settings.doctor.title, "en"),
    titleBn: t(settings.doctor.title, "bn"),
    department: t(settings.doctor.department, "en"),
    departmentBn: t(settings.doctor.department, "bn"),
    hospital: t(settings.doctor.hospital, "en"),
    hospitalBn: t(settings.doctor.hospital, "bn"),
    phone: settings.contact.phone,
    email: settings.contact.email,
  };

  const html = generateConsultationHtml(patient, consultation, doctorInfo, settings.prescription,
    consultation.chamberId
      ? (() => {
          const ch = settings.appointment.chambers.find((c) => c.id === consultation.chamberId);
          return ch ? { name: ch.name, address: ch.address, phone: ch.phone } : undefined;
        })()
      : undefined
  );

  try {
    const transporter = nodemailer.createTransport({
      host: emailCfg.host,
      port: emailCfg.port,
      secure: emailCfg.secure,
      auth: { user: emailCfg.user, pass: emailCfg.pass },
    });

    await transporter.sendMail({
      from: emailCfg.from || `"${doctorInfo.name}" <${emailCfg.user}>`,
      to,
      subject: `Prescription — ${patient.name} (${consultation.date})`,
      html,
    });

    return NextResponse.json({ ok: true, message: `Sent to ${to}` });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to send. Check SMTP settings." },
      { status: 500 }
    );
  }
}
