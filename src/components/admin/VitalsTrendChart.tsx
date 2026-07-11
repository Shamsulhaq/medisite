"use client";

import type { Consultation } from "@/lib/patients";

type DataPoint = { date: string; systolic: number | null; weight: number | null; spo2: number | null };

function parseSystolic(bp: string): number | null {
  const m = bp.match(/(\d{2,3})\s*[\/]/);
  return m ? Number(m[1]) : null;
}

function parseNumber(val: string): number | null {
  const m = val.match(/(\d+\.?\d*)/);
  return m ? Number(m[1]) : null;
}

export default function VitalsTrendChart({ consultations }: { consultations: Consultation[] }) {
  // Sort oldest first
  const sorted = [...consultations].reverse();

  const data: DataPoint[] = sorted.map((c) => ({
    date: c.date,
    systolic: parseSystolic(c.vitals.bp),
    weight: parseNumber(c.vitals.weight),
    spo2: parseNumber(c.vitals.spo2),
  }));

  // Only show if 2+ points have any vitals data
  const hasData = data.filter(
    (d) => d.systolic !== null || d.weight !== null || d.spo2 !== null
  );
  if (hasData.length < 2) return null;

  // Chart dimensions
  const W = 600;
  const H = 250;
  const PAD_L = 40;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 50;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  // Find all values to compute scale
  const allSystolic = data.map((d) => d.systolic).filter((v): v is number => v !== null);
  const allWeight = data.map((d) => d.weight).filter((v): v is number => v !== null);
  const allSpo2 = data.map((d) => d.spo2).filter((v): v is number => v !== null);

  const allValues = [...allSystolic, ...allWeight, ...allSpo2];
  if (allValues.length === 0) return null;

  const minY = Math.min(...allValues) - 5;
  const maxY = Math.max(...allValues) + 5;
  const rangeY = maxY - minY || 1;

  function xPos(i: number): number {
    return PAD_L + (i / (data.length - 1 || 1)) * plotW;
  }

  function yPos(val: number): number {
    return PAD_T + plotH - ((val - minY) / rangeY) * plotH;
  }

  function makePath(points: (number | null)[]): string {
    let d = "";
    for (let i = 0; i < points.length; i++) {
      if (points[i] === null) continue;
      const x = xPos(i);
      const y = yPos(points[i]!);
      if (!d || points[i - 1] === null) {
        d += `M${x},${y}`;
      } else {
        d += `L${x},${y}`;
      }
    }
    return d;
  }

  const lines: { key: string; color: string; label: string; points: (number | null)[] }[] = [
    { key: "systolic", color: "#ef4444", label: "Systolic BP", points: data.map((d) => d.systolic) },
    { key: "weight", color: "#3b82f6", label: "Weight (kg)", points: data.map((d) => d.weight) },
    { key: "spo2", color: "#10b981", label: "SpO₂ (%)", points: data.map((d) => d.spo2) },
  ];

  // Y-axis labels
  const ySteps = 5;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round(minY + (rangeY * i) / ySteps));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink mb-4">Vitals Trend</h2>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-3">
        {lines.map((l) => (
          <div key={l.key} className="flex items-center gap-1.5 text-xs">
            <span className="inline-block h-2.5 w-4 rounded" style={{ backgroundColor: l.color }} />
            <span className="text-muted">{l.label}</span>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[600px]" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yLabels.map((val) => (
          <g key={val}>
            <line x1={PAD_L} y1={yPos(val)} x2={W - PAD_R} y2={yPos(val)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD_L - 5} y={yPos(val) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{val}</text>
          </g>
        ))}

        {/* Lines */}
        {lines.map((l) => {
          const path = makePath(l.points);
          if (!path) return null;
          return (
            <g key={l.key}>
              <path d={path} fill="none" stroke={l.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {l.points.map((val, i) => val !== null ? (
                <circle key={i} cx={xPos(i)} cy={yPos(val)} r="3" fill={l.color} />
              ) : null)}
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text key={i} x={xPos(i)} y={H - 10} textAnchor="middle" fontSize="9" fill="#94a3b8"
            transform={`rotate(-25, ${xPos(i)}, ${H - 10})`}>
            {d.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}
