// lib/forecast.ts — aggregate household plans into utility forecasts (owner: A)
// baselineKW = what happens without Griddy: every task runs at its earliest start.
// plannedKW  = committed intent: enrolled homes' tasks at optimized starts, everyone else's
//              at plug-in, plus away/high-load flags.
// expectedKW = what AEP should plan on: each home's change weighted by confidence (Phase 4).
// verifiedOnlyKW = conservative edge: only homes AEP can measure.
// Only aggregates leave this file; the utility view never sees a single home.
import type { FlexTask, Forecast, Hour, Household, LoadFlag, Neighborhood } from "@/lib/types";
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

export function applyFlags(load: number[], flags: LoadFlag[]): number[] {
  const out = [...load];
  for (const f of flags) {
    for (let h = Math.max(0, f.startHour); h < Math.min(HORIZON_HOURS, f.endHour); h++) {
      out[h] = Math.max(0, out[h] + f.deltaKW); // a home can't draw negative power
    }
  }
  return out;
}

export interface AreaPlan {
  homes: Household[];
  baseline: number[]; // 72 h, kW
  planned: number[]; // 72 h, kW
  expected: number[]; // 72 h, kW: baseline + Σ confidence × (planned − baseline) per home (PHASE4.md §3.3)
  verifiedOnly: number[]; // 72 h, kW: baseline + only measurable homes' change, weighted by reliability
  startOf: Map<FlexTask, Hour>; // where each task runs in the plan (enrolled: optimized; others: plug-in)
}

// How much AEP can count on a home's plan. Measurable homes: their track record (reliability).
// Self-reported homes: a stated assumption, listed on /methodology.
export const SELF_REPORT_CONFIDENCE = 0.5;

function confidence(home: Household): { c: number; verified: boolean } {
  const v = home.setup?.verification;
  if (v === "smart_meter" || v === "device") return { c: home.reliability ?? 0.8, verified: true };
  return { c: SELF_REPORT_CONFIDENCE, verified: false };
}

// One home's planned-minus-baseline change, hour by hour.
function homeDelta(home: Household, startOf: Map<FlexTask, Hour>): number[] {
  const base = [...home.baselineKW];
  const plan = applyFlags(home.baselineKW, home.flags);
  for (const t of home.tasks) {
    addTaskLoad(base, t, t.earliestStart);
    addTaskLoad(plan, t, startOf.get(t) ?? t.earliestStart);
  }
  return plan.map((v, h) => v - base[h]);
}

// Runs the area's schedule once. Both the 72 h forecast and the 7-day outlook build on it.
export function planArea(n: Neighborhood, coordinated: boolean): AreaPlan {
  const homes: Household[] = householdsIn(n.id);
  const baseline = zeros();
  const fixedPlanned = zeros(); // load Griddy can't move: non-flexible load (with flags) + non-enrolled tasks
  const startOf = new Map<FlexTask, Hour>();

  for (const home of homes) {
    addInto(baseline, home.baselineKW);
    addInto(fixedPlanned, applyFlags(home.baselineKW, home.flags));
    for (const task of home.tasks) {
      addTaskLoad(baseline, task, task.earliestStart);
      if (!home.enrolled) {
        addTaskLoad(fixedPlanned, task, task.earliestStart); // not in Griddy: runs at plug-in
        startOf.set(task, task.earliestStart);
      }
    }
  }

  // Schedule every enrolled home's tasks together, so they spread out across the area.
  const enrolledTasks = homes.filter((h) => h.enrolled).flatMap((h) => h.tasks);
  const lambda = coordinated ? COORDINATED_LAMBDA : 0;
  const scheduled = optimize(enrolledTasks, fixedPlanned, n.transformerCapacityKW, DEFAULT_RATE, lambda);
  const planned = [...fixedPlanned];
  scheduled.forEach((t, i) => {
    addTaskLoad(planned, t, t.start);
    startOf.set(enrolledTasks[i], t.start); // optimize keeps input order
  });

  // Confidence-weighted curves: only enrolled homes change anything.
  const expected = [...baseline];
  const verifiedOnly = [...baseline];
  for (const home of homes.filter((h) => h.enrolled)) {
    const { c, verified } = confidence(home);
    homeDelta(home, startOf).forEach((d, h) => {
      expected[h] += c * d;
      if (verified) verifiedOnly[h] += c * d;
    });
  }

  return { homes, baseline, planned, expected, verifiedOnly, startOf };
}

function toForecast(id: string, a: { baseline: number[]; planned: number[]; expected: number[]; verifiedOnly: number[] }, capacityKW: number, homeCount: number): Forecast {
  return {
    ...withPeakTotals({ neighborhoodId: id, baselineKW: round2(a.baseline), plannedKW: round2(a.planned), capacityKW, homeCount }),
    expectedKW: round2(a.expected),
    verifiedOnlyKW: round2(a.verifiedOnly),
    peakKWhExpected: peakKWh(a.expected),
    maxKWBaseline: planDayMax(a.baseline),
    maxKWExpected: planDayMax(a.expected),
  };
}

// The plan day's single highest hour (for the "Highest hour" callout).
function planDayMax(curve: number[]): number {
  return Math.round(Math.max(...curve.slice(PLAN_DAY * 24, PLAN_DAY * 24 + 24)));
}

export function neighborhoodForecast(n: Neighborhood, coordinated: boolean): Forecast {
  const area = planArea(n, coordinated);
  return toForecast(n.id, area, n.transformerCapacityKW, area.homes.length);
}

export function regionForecast(coordinated: boolean): Forecast {
  const parts = listNeighborhoods().map((n) => ({ n, area: planArea(n, coordinated) }));
  const sum = { baseline: zeros(), planned: zeros(), expected: zeros(), verifiedOnly: zeros() };
  for (const { area } of parts) {
    addInto(sum.baseline, area.baseline);
    addInto(sum.planned, area.planned);
    addInto(sum.expected, area.expected);
    addInto(sum.verifiedOnly, area.verifiedOnly);
  }
  const capacity = parts.reduce((s, p) => s + p.n.transformerCapacityKW, 0);
  const homes = parts.reduce((s, p) => s + p.area.homes.length, 0);
  return toForecast("region", sum, capacity, homes);
}
