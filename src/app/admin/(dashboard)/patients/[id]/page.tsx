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
import PatientPageTabs from "@/components/admin/PatientPageTabs";
import { Suspense } from "react";

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
    <div className="space-y-4">
      {/* Back link + actions */}
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

      {/* Compact patient header — always visible */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-bold text-ink">{patient.name}</h1>
        <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand-dark">
          {patient.patientId}
        </span>
        {(patient.age || patient.gender) && (
          <span className="text-sm text-muted">
            {patient.age && `${patient.age}`}
            {patient.age && patient.gender && " / "}
            {patient.gender && patient.gender}
          </span>
        )}
        <span className="text-sm text-muted">{patient.phone}</span>
      </div>

      {/* Tabs */}
      <Suspense fallback={null}>
        <PatientPageTabs
          consultationsContent={
            <PatientRecords
              patient={patient}
              doctor={doctorInfo}
              prescriptionConfig={settings.prescription}
              prescriptionLayout={settings.prescriptionLayout}
              prescriptionTemplates={settings.prescriptionTemplates}
              chambers={settings.appointment.chambers}
              appointments={appointments}
              feeStructure={settings.feeStructure}
              permissions={currentUser?.permissions}
            />
          }
          testReportsContent={
            <TestReportsTab
              patient={patient}
              permissions={currentUser?.permissions}
            />
          }
          vitalsContent={
            <div className="space-y-6">
              {patient.consultations.length >= 2 ? (
                <>
                  <VitalsTrendChart consultations={patient.consultations} />
                  <CompareConsultations consultations={patient.consultations} />
                </>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <p className="text-sm text-muted">Need at least 2 consultations with vitals to show trends.</p>
                </div>
              )}
            </div>
          }
          detailsContent={
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ink">Patient Details</h2>
              <div className="mt-4">
                <PatientForm patient={patient} />
              </div>
            </div>
          }
        />
      </Suspense>
    </div>
  );
}

// Extracted test reports tab that reuses PatientRecords' TestReportsSection
function TestReportsTab({ patient, permissions }: { patient: Parameters<typeof PatientRecords>[0]["patient"]; permissions?: Record<string, boolean> }) {
  return (
    <PatientRecords
      patient={patient}
      doctor={{ name: "", nameBn: "", title: "", titleBn: "", department: "", departmentBn: "", hospital: "", hospitalBn: "", phone: "", email: "" }}
      prescriptionConfig={{ predefinedAdvices: [], followUpOptions: [], timingOptions: [], predefinedDiagnoses: [] } as never}
      prescriptionTemplates={[]}
      chambers={[]}
      appointments={[]}
      permissions={permissions}
      testReportsOnly
    />
  );
}
