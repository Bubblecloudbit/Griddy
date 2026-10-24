// lib/forecast.ts — aggregate household plans into utility forecasts (owner: A)
// baselineKW = what happens without GridShift: every task runs at its earliest start.
// plannedKW  = committed intent: enrolled homes' tasks at optimized starts, everyone else's
//              at plug-in, plus away/high-load flags.
// Only aggregates leave this file; the utility view never sees a single home.
import type { Forecast, Household, LoadFlag, Neighborhood } from "@/lib/types";
import { DEFAULT_RATE, HORIZON_HOURS, isPeak } from "@/lib/rates";
import { PLAN_DAY } from "@/lib/config";
import { addTaskLoad, COORDINATED_LAMBDA, optimize } from "@/lib/optimizer";
import { householdsIn, listNeighborhoods } from "@/lib/store";

export const MIN_GROUP_SIZE = 5; // privacy rule: never show fewer homes than this

// Peak hours of the plan day (Mon Oct 26, 2–6 PM = hours 38–41). Every "peak-hour" number uses these.
export const PLAN_DAY_PEAK_HOURS = Array.from({ length: 24 }, (_, c) => PLAN_DAY * 24 + c).filter((h) => isPeak(DEFAULT_RATE, h));

function zeros(): number[] {
  return new Array(HORIZON_HOURS).fill(0);
}

function round2(arr: number[]): number[] {
  return arr.map((v) => Math.round(v * 100) / 100);
}

// kWh in the plan day's peak window. Hourly kW over 1-hour slots = kWh.
function peakKWh(curve: number[]): number {
  return Math.round(PLAN_DAY_PEAK_HOURS.reduce((sum, h) => sum + curve[h], 0) * 10) / 10;
}

function withPeakTotals(f: Omit<Forecast, "peakKWhBaseline" | "peakKWhPlanned">): Forecast {
  return { ...f, peakKWhBaseline: peakKWh(f.baselineKW), peakKWhPlanned: peakKWh(f.plannedKW) };
}

function addInto(target: number[], source: number[]): void {
  source.forEach((v, h) => (target[h] += v));
}

function applyFlags(load: number[], flags: LoadFlag[]): number[] {
  const out = [...load];
  for (const f of flags) {
    for (let h = Math.max(0, f.startHour); h < Math.min(HORIZON_HOURS, f.endHour); h++) {
      out[h] = Math.max(0, out[h] + f.deltaKW); // a home can't draw negative power
    }
  }
  return out;
}

export function neighborhoodForecast(n: Neighborhood, coordinated: boolean): Forecast {
  const homes: Household[] = householdsIn(n.id);
  const baseline = zeros();
  const fixedPlanned = zeros(); // load GridShift can't move: non-flexible load (with flags) + non-enrolled tasks

  for (const home of homes) {
    addInto(baseline, home.baselineKW);
    addInto(fixedPlanned, applyFlags(home.baselineKW, home.flags));
    for (const task of home.tasks) {
      addTaskLoad(baseline, task, task.earliestStart);
      if (!home.enrolled) addTaskLoad(fixedPlanned, task, task.earliestStart); // not in GridShift: runs at plug-in
    }
  }

  // Schedule every enrolled home's tasks together, so they spread out across the area.
  const enrolledTasks = homes.filter((h) => h.enrolled).flatMap((h) => h.tasks);
  const lambda = coordinated ? COORDINATED_LAMBDA : 0;
  const scheduled = optimize(enrolledTasks, fixedPlanned, n.transformerCapacityKW, DEFAULT_RATE, lambda);
  const planned = [...fixedPlanned];
  for (const t of scheduled) addTaskLoad(planned, t, t.start);

  return withPeakTotals({
    neighborhoodId: n.id,
    baselineKW: round2(baseline),
    plannedKW: round2(planned),
    capacityKW: n.transformerCapacityKW,
    homeCount: homes.length,
  });
}

export function regionForecast(coordinated: boolean): Forecast {
  const parts = listNeighborhoods().map((n) => neighborhoodForecast(n, coordinated));
  const baseline = zeros();
  const planned = zeros();
  for (const p of parts) {
    addInto(baseline, p.baselineKW);
    addInto(planned, p.plannedKW);
  }
  return withPeakTotals({
    neighborhoodId: "region",
    baselineKW: round2(baseline),
    plannedKW: round2(planned),
    capacityKW: parts.reduce((sum, p) => sum + p.capacityKW, 0),
    homeCount: parts.reduce((sum, p) => sum + p.homeCount, 0),
  });
}
