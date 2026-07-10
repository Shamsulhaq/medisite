import Link from "next/link";
import { getAppointments } from "@/lib/appointments";
import { getPatients } from "@/lib/patients";
import PatientForm from "@/components/admin/PatientForm";
import ImportFromAppointment from "@/components/admin/ImportFromAppointment";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Add Patient",
  robots: { index: false, follow: false },
};

export default async function NewPatientPage() {
  const [patients, appointments] = await Promise.all([
    getPatients(),
    getAppointments(),
  ]);
  const patientPhones = new Set(
    patients.map((p) => p.phone.replace(/[\s\-()]/g, ""))
  );
  const importable = appointments.filter(
    (a) => !patientPhones.has(a.phone.replace(/[\s\-()]/g, ""))
  );

  return (
    <div>
      <Link
        href="/admin/patients"
        className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
      >
        ← Back to patients
      </Link>
      <PageHeader
        title="Add Patient"
        description="Create a new patient record. Phone number is the unique identity — no duplicates allowed."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* From appointment */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <h2 className="text-base font-semibold text-ink">
              From Appointment
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Import a patient from an existing appointment request.
            </p>
          </div>
          <div className="p-5">
            <ImportFromAppointment appointments={importable} />
          </div>
        </div>

        {/* New manually */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <h2 className="text-base font-semibold text-ink">
              New Patient
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Manually enter patient details.
            </p>
          </div>
          <div className="p-5">
            <PatientForm />
          </div>
        </div>
      </div>
    </div>
  );
}
