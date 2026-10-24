// lib/heatmap.ts — heat map aggregation for the AEP view (owner: A)
// Area × hour: one row per service area, one column per hour of the plan day (Mon Oct 26).
// Every cell is an area total (40 homes); groups under MIN_GROUP_SIZE come back as null.
// Day × hour: one row per day of the demo week, region-wide.
import type { Forecast, Heatmap } from "@/lib/types";
import { OUTLOOK_DAYS, PLAN_DAY, dayLabel, hourLabel } from "@/lib/config";
import { MIN_GROUP_SIZE, neighborhoodForecast } from "@/lib/forecast";
import { weekOutlook } from "@/lib/outlook";
import { listNeighborhoods } from "@/lib/store";

const PLAN_DAY_HOURS = Array.from({ length: 24 }, (_, c) => PLAN_DAY * 24 + c); // 24..47
const HOUR_COLS = Array.from({ length: 24 }, (_, c) => hourLabel(c)); // "12a" … "11p"

// % change vs. baseline, 1 decimal. Negative = load moved away (teal on the diverging scale).
function pctChange(planned: number, baseline: number): number {
  return baseline > 0 ? Math.round(((planned - baseline) / baseline) * 1000) / 10 : 0;
}

function cell(f: Forecast, h: number, metric: Heatmap["metric"]): number | null {
  if (f.homeCount < MIN_GROUP_SIZE) return null; // privacy: hidden
  if (metric === "load") return Math.round(f.plannedKW[h] * 10) / 10;
  return pctChange(f.plannedKW[h], f.baselineKW[h]);
}

// Day × hour: Sun Oct 25 – Sat Oct 31, all areas combined (480 homes, so never hidden).
// Rows 0–1 are scheduled; rows 2–6 are projected from routines and trips (tag them PROJECTED).
export function dayHourHeatmap(metric: Heatmap["metric"]): Heatmap {
  const { baseline, planned } = weekOutlook();
  const values = Array.from({ length: OUTLOOK_DAYS }, (_, day) =>
    Array.from({ length: 24 }, (_, c) => {
      const h = day * 24 + c;
      return metric === "load" ? Math.round(planned[h]) : pctChange(planned[h], baseline[h]);
    }),
  );
  return {
    view: "day_hour",
    metric,
    rows: Array.from({ length: OUTLOOK_DAYS }, (_, day) => dayLabel(day)),
    cols: HOUR_COLS,
    values,
    unit: metric === "load" ? "kW" : "%",
    label: metric === "load"
      ? "Planned load, all areas, Oct 25–31 (kW). Tue–Sat projected from routines and trips."
      : "Change vs. baseline, all areas, Oct 25–31 (%). Tue–Sat projected from routines and trips.",
  };
}

export function areaHourHeatmap(metric: Heatmap["metric"]): Heatmap {
  const areas = listNeighborhoods();
  const forecasts = areas.map((n) => neighborhoodForecast(n, true));
  return {
    view: "area_hour",
    metric,
    rows: areas.map((n) => n.name),
    cols: HOUR_COLS,
    values: forecasts.map((f) => PLAN_DAY_HOURS.map((h) => cell(f, h, metric))),
    unit: metric === "load" ? "kW" : "%",
    label: metric === "load"
      ? `Planned load by area, ${dayLabel(PLAN_DAY)} (kW)`
      : `Change vs. baseline by area, ${dayLabel(PLAN_DAY)} (%)`,
  };
}
