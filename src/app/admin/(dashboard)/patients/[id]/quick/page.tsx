import { notFound } from "next/navigation";
import { getPatientById, getPatients } from "@/lib/patients";
import { getSettings } from "@/lib/store";
import { getAppointments, filterAppointments } from "@/lib/appointments";
import { t } from "@/lib/i18n";
import QuickConsultationForm from "@/components/admin/QuickConsultationForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quick Consultation",
  robots: { index: false, follow: false },
};

export default async function QuickConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patient, settings, appointments] = await Promise.all([
    getPatientById(id),
    getSettings(),
    getAppointments(),
  ]);

  if (!patient) {
    notFound();
  }

  const doctorInfo = {
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

  // Find today's appointments to determine 'next' patient
  const todayAppointments = filterAppointments(appointments, "today")
    .sort((a, b) => (a.time < b.time ? -1 : 1));

  // Get all patients to resolve appointment phone -> patient id
  const allPatients = await getPatients();
  const todayPatientIds: string[] = [];
  for (const apt of todayAppointments) {
    const normalizedPhone = apt.phone.replace(/[\s\-()]/g, "");
    const p = allPatients.find(
      (pat) => pat.phone.replace(/[\s\-()]/g, "") === normalizedPhone
    );
    if (p) todayPatientIds.push(p.id);
  }

  // Find next patient after current one
  const currentIndex = todayPatientIds.indexOf(id);
  const nextPatientId = currentIndex >= 0 && currentIndex < todayPatientIds.length - 1
    ? todayPatientIds[currentIndex + 1]
    : null;

  return (
    <QuickConsultationForm
      patient={patient}
      doctor={doctorInfo}
      prescriptionConfig={settings.prescription}
      chambers={settings.appointment.chambers}
      nextPatientId={nextPatientId}
    />
  );
}
