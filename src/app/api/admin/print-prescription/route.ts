import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSettings } from "@/lib/store";
import { findByPhone } from "@/lib/patients";
import { generateConsultationHtml, type DoctorInfo } from "@/lib/prescription-pdf";
import { generateQRBase64 } from "@/lib/qr";
import { t } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone") ?? "";

  if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

  const patient = await findByPhone(phone);
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  // Get latest non-superseded consultation
  const consultation = patient.consultations.find((c) => !c.superseded);
  if (!consultation) return NextResponse.json({ error: "No prescription found" }, { status: 404 });

  const settings = await getSettings();
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

  const chamber = consultation.chamberId
    ? settings.appointment.chambers.find((c) => c.id === consultation.chamberId)
    : undefined;
  const chamberInfo = chamber ? { name: chamber.name, address: chamber.address, phone: chamber.phone } : undefined;

  // Generate QR code for public prescription URL
  if (consultation.publicToken) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const qrData = `${baseUrl}/prescription/${consultation.publicToken}`;
    (consultation as any)._qrSvgBase64 = await generateQRBase64(qrData);
  }

  const html = generateConsultationHtml(patient, consultation, doctorInfo, settings.prescription, chamberInfo, settings.prescriptionLayout);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
