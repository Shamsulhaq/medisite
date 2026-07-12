"use client";

function HorizontalBarChart({ data, title, color }: { data: [string, number][]; title: string; color: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(([, v]) => v), 1);
  const barH = 28;
  const labelW = 180;
  const chartW = 500;
  const H = data.length * barH + 20;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-ink mb-4">{title}</h3>
      <svg viewBox={`0 0 ${chartW} ${H}`} className="w-full" preserveAspectRatio="xMinYMin meet">
        {data.map(([label, value], i) => {
          const y = i * barH + 10;
          const barWidth = ((chartW - labelW - 50) * value) / max;
          return (
            <g key={label}>
              <text x={labelW - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize="11" fill="#475569">
                {label.length > 22 ? label.slice(0, 20) + "…" : label}
              </text>
              <rect x={labelW} y={y + 4} width={barWidth} height={barH - 10} rx="4" fill={color} opacity="0.8" />
              <text x={labelW + barWidth + 6} y={y + barH / 2 + 4} fontSize="11" fill="#64748b" fontWeight="600">
                {value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MonthlyLineChart({ data }: { data: { month: string; count: number }[] }) {
  if (data.length === 0) return null;
  const W = 500;
  const H = 200;
  const PAD_L = 40;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 40;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const max = Math.max(...data.map((d) => d.count), 1);

  function xPos(i: number): number {
    return PAD_L + (i / (data.length - 1 || 1)) * plotW;
  }
  function yPos(val: number): number {
    return PAD_T + plotH - (val / max) * plotH;
  }

  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPos(d.count)}`).join(" ");

  // Y-axis labels
  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round((max * i) / ySteps));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-ink mb-4">Monthly Consultations (Last 6 Months)</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid */}
        {yLabels.map((val) => (
          <g key={val}>
            <line x1={PAD_L} y1={yPos(val)} x2={W - PAD_R} y2={yPos(val)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD_L - 5} y={yPos(val) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{val}</text>
          </g>
        ))}
        {/* Line */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Area */}
        <path
          d={`${pathD} L${xPos(data.length - 1)},${PAD_T + plotH} L${PAD_L},${PAD_T + plotH} Z`}
          fill="#6366f1" opacity="0.08"
        />
        {/* Points */}
        {data.map((d, i) => (
          <circle key={i} cx={xPos(i)} cy={yPos(d.count)} r="4" fill="#6366f1" />
        ))}
        {/* X-axis labels */}
        {data.map((d, i) => (
          <text key={i} x={xPos(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="#64748b">
            {d.month.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function ReportsCharts({
  topDiagnoses,
  topMedicines,
  monthlyData,
}: {
  topDiagnoses: [string, number][];
  topMedicines: [string, number][];
  monthlyData: { month: string; count: number }[];
}) {
  return (
    <div className="space-y-6">
      <MonthlyLineChart data={monthlyData} />
      <div className="grid gap-6 lg:grid-cols-2">
        <HorizontalBarChart data={topDiagnoses} title="Top 10 Diagnoses" color="#6366f1" />
        <HorizontalBarChart data={topMedicines} title="Top 10 Prescribed Medicines" color="#10b981" />
      </div>
    </div>
  );
}
