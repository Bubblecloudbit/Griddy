// components/utility/stats.ts — summary numbers for a Forecast (owner: C)
// Pure functions so any teammate can explain them to a judge.
import type { Forecast } from "@/lib/types";

export interface ForecastStats {
  baselinePeakKW: number;
  baselinePeakHour: number;
  plannedPeakKW: number;
  plannedPeakHour: number;
  peakReductionPct: number; // how much lower the planned peak is than the baseline peak
  hoursOverCapacity: number; // planned hours above the transformer limit
}

function peak(series: number[]): { value: number; hour: number } {
  let hour = 0;
  series.forEach((v, i) => {
    if (v > series[hour]) hour = i;
  });
  return { value: series[hour] ?? 0, hour };
}

export function forecastStats(f: Forecast): ForecastStats {
  const base = peak(f.baselineKW);
  const planned = peak(f.plannedKW);
  const reduction = base.value > 0 ? ((base.value - planned.value) / base.value) * 100 : 0;
  return {
    baselinePeakKW: base.value,
    baselinePeakHour: base.hour,
    plannedPeakKW: planned.value,
    plannedPeakHour: planned.hour,
    peakReductionPct: reduction,
    hoursOverCapacity: f.plannedKW.filter((v) => v > f.capacityKW).length,
  };
}
