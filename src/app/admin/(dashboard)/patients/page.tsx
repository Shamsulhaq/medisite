import Link from "next/link";
import { getPatientsPage, getPatientPhones, type PatientSort } from "@/lib/patients";
import { getAppointmentPhones } from "@/lib/appointments";
import AdminIcon from "@/components/admin/AdminIcon";
import PatientsExplorer from "@/components/admin/PatientsExplorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Patients",
  robots: { index: false, follow: false },
};

const normalizePhone = (p: string) => p.replace(/[\s\-()]/g, "");

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) ?? "";

  const query = {
    page: Number(str(sp.page)) || 1,
    q: str(sp.q),
    gender: str(sp.gender) || "all",
    from: str(sp.from),
    to: str(sp.to),
    sort: (str(sp.sort) || "lastVisit") as PatientSort,
  };

  const [result, patientPhones, appointmentPhones] = await Promise.all([
    getPatientsPage(query),
    getPatientPhones(),
    getAppointmentPhones(),
  ]);

  const known = new Set(patientPhones.map(normalizePhone));
  const importableCount = new Set(
    appointmentPhones
      .map(normalizePhone)
      .filter((p) => p && !known.has(p))
  ).size;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {result.total} patient{result.total === 1 ? "" : "s"} on file
        </p>
        <Link
          href="/admin/patients/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <AdminIcon name="plus" className="h-4 w-4" /> Add Patient
        </Link>
      </div>
      <PatientsExplorer
        items={result.items}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        totalPages={result.totalPages}
        importableCount={importableCount}
        filters={{
          q: query.q,
          gender: query.gender,
          from: query.from,
          to: query.to,
          sort: query.sort,
        }}
      />
    </div>
  );
}
