// components/utility/ForecastStatsRow.tsx — headline numbers above the chart (owner: C)
import type { Forecast } from "@/lib/types";
import { forecastStats } from "./stats";
import { fullHourLabel } from "./hours";

function Tile({ label, value, sub, tone = "slate" }: { label: string; value: string; sub?: string; tone?: "slate" | "green" | "red" }) {
  const color = { slate: "text-slate-900", green: "text-green-700", red: "text-red-600" }[tone];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function ForecastStatsRow({ forecast }: { forecast: Forecast }) {
  const s = forecastStats(forecast);
  const over = s.hoursOverCapacity;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile label="Baseline peak" value={`${s.baselinePeakKW.toFixed(0)} kW`} sub={fullHourLabel(s.baselinePeakHour)} />
      <Tile label="Planned peak" value={`${s.plannedPeakKW.toFixed(0)} kW`} sub={fullHourLabel(s.plannedPeakHour)} />
      <Tile
        label="Peak reduction"
        value={`${s.peakReductionPct.toFixed(1)}%`}
        sub="simulated"
        tone={s.peakReductionPct > 0 ? "green" : "slate"}
      />
      <Tile
        label="Hours over transformer limit"
        value={String(over)}
        sub={`limit ${forecast.capacityKW} kW`}
        tone={over > 0 ? "red" : "green"}
      />
    </div>
  );
}
