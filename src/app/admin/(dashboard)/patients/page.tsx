import Link from "next/link";
import { getPatients } from "@/lib/patients";
import { getAppointments } from "@/lib/appointments";
import AdminIcon from "@/components/admin/AdminIcon";
import PatientsExplorer from "@/components/admin/PatientsExplorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Patients",
  robots: { index: false, follow: false },
};

export default async function PatientsPage() {
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
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{patients.length} patient{patients.length === 1 ? "" : "s"} on file</p>
        <Link href="/admin/patients/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark">
          <AdminIcon name="plus" className="h-4 w-4" /> Add Patient
        </Link>
      </div>
      <PatientsExplorer patients={patients} importable={importable} />
    </div>
  );
}
