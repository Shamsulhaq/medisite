import Link from "next/link";
import { getPatients } from "@/lib/patients";
import ReportsCharts from "@/components/admin/ReportsCharts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

export default async function ReportsPage() {
  const patients = await getPatients();

  // Aggregate data
  const totalPatients = patients.length;
  let totalConsultations = 0;
  const diagnosisCounts: Record<string, number> = {};
  const medicineCounts: Record<string, number> = {};
  const monthlyCounts: Record<string, number> = {};

  for (const p of patients) {
    totalConsultations += p.consultations.length;
    for (const con of p.consultations) {
      // Diagnoses
      for (const dx of con.diagnosis.filter(Boolean)) {
        diagnosisCounts[dx] = (diagnosisCounts[dx] || 0) + 1;
      }
      // Medicines
      for (const m of con.medicines) {
        if (m.name.trim()) {
          medicineCounts[m.name] = (medicineCounts[m.name] || 0) + 1;
        }
      }
      // Monthly counts (last 6 months)
      const monthKey = con.date.slice(0, 7); // YYYY-MM
      monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
    }
  }

  const avgConsultations = totalPatients > 0 ? (totalConsultations / totalPatients).toFixed(1) : "0";

  // Top 10 diagnoses
  const topDiagnoses = Object.entries(diagnosisCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Top 10 medicines
  const topMedicines = Object.entries(medicineCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Last 6 months
  const now = new Date();
  const last6Months: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    last6Months.push({ month: key, count: monthlyCounts[key] || 0 });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Reports & Analytics</h1>
        <Link href="/admin" className="text-sm font-medium text-brand hover:text-brand-dark">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-ink">{totalPatients}</p>
          <p className="text-sm text-muted">Total Patients</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-ink">{totalConsultations}</p>
          <p className="text-sm text-muted">Total Consultations</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-ink">{avgConsultations}</p>
          <p className="text-sm text-muted">Avg Consultations per Patient</p>
        </div>
      </div>

      {/* Charts */}
      <ReportsCharts
        topDiagnoses={topDiagnoses}
        topMedicines={topMedicines}
        monthlyData={last6Months}
      />
    </div>
  );
}
