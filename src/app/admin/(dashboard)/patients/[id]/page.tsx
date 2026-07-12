import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatientById } from "@/lib/patients";
import { getSettings } from "@/lib/store";
import { getAppointments } from "@/lib/appointments";
import { getCurrentUser } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import PatientForm from "@/components/admin/PatientForm";
import PatientRecords from "@/components/admin/PatientRecords";
import DeletePatientButton from "@/components/admin/DeletePatientButton";
import VitalsTrendChart from "@/components/admin/VitalsTrendChart";
import CompareConsultations from "@/components/admin/CompareConsultations";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Patient",
  robots: { index: false, follow: false },
};

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patient, settings, appointments, currentUser] = await Promise.all([
    getPatientById(id),
    getSettings(),
    getAppointments(),
    getCurrentUser(),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/patients"
          className="text-sm font-medium text-brand hover:text-brand-dark"
        >
          ← Back to patients
        </Link>
        <div className="flex items-center gap-3">
          {currentUser?.role === "DOCTOR" && <DeletePatientButton id={patient.id} name={patient.name} />}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-ink">{patient.name}</h1>
          <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
            {patient.patientId}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {patient.phone} · Added{" "}
          {new Date(patient.createdAt).toLocaleDateString()} · Updated{" "}
          {new Date(patient.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Patient Details</h2>
        <div className="mt-4">
          <PatientForm patient={patient} />
        </div>
      </div>

      <PatientRecords
        patient={patient}
        doctor={doctorInfo}
        prescriptionConfig={settings.prescription}
        prescriptionTemplates={settings.prescriptionTemplates}
        chambers={settings.appointment.chambers}
        appointments={appointments}
        feeStructure={settings.feeStructure}
        permissions={currentUser?.permissions}
      />

      {/* Vitals Trend Chart - only shows if 2+ consultations have vitals */}
      {patient.consultations.length >= 2 && (
        <VitalsTrendChart consultations={patient.consultations} />
      )}

      {/* Consultation Comparison */}
      {patient.consultations.length >= 2 && (
        <CompareConsultations consultations={patient.consultations} />
      )}
    </div>
  );
}
