// lib/mock.ts — v2 mock data (owner: A). Same shapes the real API returns (PLAN.md §7).
// Build screens against these until the real route is ready. Every number here is
// simulated or illustrative, never real customer data.
// Times: hour 0 = midnight Sun Oct 25 (DEMO_DAY_0); Mon Oct 26 = hours 24–47; Tue = 48–71.

import type {
  RatePlan,
  ScheduledTask,
  Forecast,
  RegionReference,
  FlexEvent,
  FlexTask,
  Household,
  Neighborhood,
  Heatmap,
  Summary,
  Trip,
  WeeklyRoutine,
  MyStatus,
  SettlementSummary,
  IntakeStats,
} from "@/lib/types";
import { HORIZON_HOURS, OUTLOOK_DAYS, dayLabel, hourLabel } from "@/lib/config";
import { NEIGHBORHOODS } from "@/lib/community";

// ---------------------------------------------------------------------------
// Rate plan: real AEP Ohio summer peak window, illustrative prices
// ---------------------------------------------------------------------------
export const MOCK_RATE: RatePlan = {
  name: "Illustrative time-of-use",
  offPeak: 0.11,
  onPeak: 0.22,
  peakHours: [14, 15, 16, 17], // 2–6 PM
  illustrative: true,
  weekdaysOnly: true,
  source: "AEP Ohio, Time-of-Use program page",
  sourceUrl: "https://www.aepohio.com/account/bills/programs/time-of-use",
};

// ---------------------------------------------------------------------------
// Jordan's optimized plan for Monday (plug in Mon 4 PM = h40, EV ready Tue 7 AM = h55)
// ---------------------------------------------------------------------------
export const MOCK_TASKS: ScheduledTask[] = [
  {
    id: "t1", label: "EV charging", appliance: "ev",
    kWh: 10, powerKW: 7.2, earliestStart: 40, deadline: 55,
    start: 47, // Mon 11 PM
    cost: 1.1, baselineCost: 2.2, peakKWhAvoided: 10,
    reason: "Off-peak after 6 PM; spreads EV charging in your area",
  },
  {
    id: "t2", label: "Dryer", appliance: "dryer",
    kWh: 1.5, powerKW: 3, earliestStart: 40, deadline: 48,
    start: 42, // Mon 6 PM
    cost: 0.17, baselineCost: 0.33, peakKWhAvoided: 1.5,
    reason: "Peak ends at 6 PM, so it starts right after",
  },
  {
    id: "t3", label: "Dishwasher", appliance: "dishwasher",
    kWh: 1.2, powerKW: 1.5, earliestStart: 43, deadline: 55,
    start: 45, // Mon 9 PM
    cost: 0.13, baselineCost: 0.13, peakKWhAvoided: 0,
    reason: "Already off-peak; 9 PM avoids the 7 PM rush in your area",
  },
  {
    id: "t4", label: "Water heater", appliance: "water_heater",
    kWh: 2, powerKW: 4.5, earliestStart: 38, deadline: 48,
    start: 42, // Mon 6 PM
    cost: 0.22, baselineCost: 0.44, peakKWhAvoided: 2,
    reason: "Off-peak after 6 PM",
  },
];

// ---------------------------------------------------------------------------
// Load curves (72 h)
// ---------------------------------------------------------------------------
// Illustrative average-home shape (kW) by clock hour, including people plugging in
// when they get home, so a real share of load lands in the 2–6 PM peak.
const HOME_SHAPE_KW = [
  0.6, 0.5, 0.5, 0.5, 0.5, 0.6, 0.9, 1.4, 1.5, 1.1, 1.0, 1.0,
  1.0, 1.1, 1.6, 2.2, 2.6, 2.7, 2.4, 2.1, 1.8, 1.5, 1.1, 0.8,
];
const MON_PEAK = [38, 39, 40, 41]; // Mon 2–6 PM

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function residentialBaseline(): number[] {
  return Array.from({ length: HORIZON_HOURS }, (_, h) => round2(HOME_SHAPE_KW[h % 24] + Math.sin(h * 1.3) * 0.05));
}

// Planned = baseline with Monday's peak trimmed 18% and that energy moved into the evening.
function plannedFrom(baseline: number[]): number[] {
  return baseline.map((v, h) => {
    if (MON_PEAK.includes(h)) return round2(v * 0.82);
    if (h >= 42 && h <= 47) return round2(v * 1.08);
    return v;
  });
}

function peakKWh(curve: number[]): number {
  return round2(MON_PEAK.reduce((sum, h) => sum + curve[h], 0));
}

function forecastFor(id: string, homes: number): Forecast {
  const baselineKW = residentialBaseline().map((v) => round2(v * homes));
  const plannedKW = plannedFrom(baselineKW);
  return {
    neighborhoodId: id,
    baselineKW,
    plannedKW,
    capacityKW: homes * 5, // internal normalizer only; never displayed
    homeCount: homes,
    peakKWhBaseline: peakKWh(baselineKW),
    peakKWhPlanned: peakKWh(plannedKW),
  };
}

const baselineHome = residentialBaseline();

export const MOCK_NEIGHBORHOOD_FORECAST: Forecast = forecastFor("n1", 40);
export const MOCK_REGION_FORECAST: Forecast = forecastFor("region", 480);

// ---------------------------------------------------------------------------
// Service areas (12 × 40 homes, all synthetic)
// ---------------------------------------------------------------------------
const AREA_NAMES = NEIGHBORHOODS.map((n) => n.name);

export const MOCK_NEIGHBORHOODS: Neighborhood[] = AREA_NAMES.map((name, i) => ({
  id: `n${i + 1}`,
  name,
  transformerCapacityKW: 200,
  homeIds: Array.from({ length: 40 }, (_, j) => (i === 0 && j === 0 ? "h-jordan" : `h-n${i + 1}-${j}`)),
}));

// ---------------------------------------------------------------------------
// Heat maps
// ---------------------------------------------------------------------------
const HOUR_COLS = Array.from({ length: 24 }, (_, c) => hourLabel(c));

// Deterministic per-row wobble so rows don't look identical.
function wobble(row: number, col: number): number {
  return Math.sin(row * 2.1 + col * 0.7);
}

// % change vs. baseline for one area at one clock hour on a weekday.
function weekdayChange(row: number, c: number): number {
  if (c >= 14 && c <= 17) return Math.round(-22 + wobble(row, c) * 8); // peak: load moved away
  if (c >= 18 && c <= 23) return Math.round(9 + wobble(row, c) * 4); // evening: load moved in
  return Math.round(wobble(row, c) * 2);
}

function areaHourMap(metric: "load" | "change"): Heatmap {
  const values = AREA_NAMES.map((_, r) =>
    HOUR_COLS.map((_, c) => {
      const change = weekdayChange(r, c);
      if (metric === "change") return change;
      return Math.round(40 * HOME_SHAPE_KW[c] * (1 + change / 100));
    }),
  );
  return {
    view: "area_hour", metric, rows: AREA_NAMES, cols: HOUR_COLS, values,
    unit: metric === "load" ? "kW" : "%",
    label: metric === "load" ? "Planned load, Mon Oct 26 (kW)" : "Change vs. baseline, Mon Oct 26 (%)",
  };
}

const TRIP_DAYS = [4, 5, 6]; // Thu–Sat

function dayHourMap(metric: "load" | "change"): Heatmap {
  const rows = Array.from({ length: OUTLOOK_DAYS }, (_, d) => dayLabel(d));
  const values = rows.map((_, d) =>
    HOUR_COLS.map((_, c) => {
      const weekday = d >= 1 && d <= 5;
      let change = weekday ? weekdayChange(d, c) : Math.round(wobble(d, c) * 2);
      if (TRIP_DAYS.includes(d)) change -= 8; // homes away on planned trips
      if (metric === "change") return change;
      return Math.round(480 * HOME_SHAPE_KW[c] * (1 + change / 100));
    }),
  );
  return {
    view: "day_hour", metric, rows, cols: HOUR_COLS, values,
    unit: metric === "load" ? "kW" : "%",
    label: metric === "load" ? "Planned load, all areas, Oct 25–31 (kW)" : "Change vs. baseline, all areas, Oct 25–31 (%)",
  };
}

export function mockHeatmap(view: Heatmap["view"], metric: Heatmap["metric"]): Heatmap {
  return view === "area_hour" ? areaHourMap(metric) : dayHourMap(metric);
}

export const MOCK_HEATMAP_AREA_HOUR: Heatmap = mockHeatmap("area_hour", "change");
export const MOCK_HEATMAP_DAY_HOUR: Heatmap = mockHeatmap("day_hour", "change");

// ---------------------------------------------------------------------------
// Flex Event, summary, trips, routine
// ---------------------------------------------------------------------------
export const MOCK_FLEX_EVENT: FlexEvent = {
  id: "fe1",
  startHour: 40, // Mon 4 PM
  endHour: 42, // Mon 6 PM
  multiplier: 2,
  message: "Shift load out of Mon 4–6 PM and earn 2× GridPoints.",
  optedIn: 38,
};

export const MOCK_SUMMARY: Summary = {
  enrolledHomes: 288,
  committedFlexKWh: 1900,
  peakReductionPct: -18,
  peakKWhShifted: 412,
  homesAwayThisWeek: 57,
  nextEvent: MOCK_FLEX_EVENT,
};

export const MOCK_TRIP: Trip = {
  id: "trip1",
  label: "Visit family",
  startDate: "2026-10-29", // Thu
  endDate: "2026-10-31", // Sat, inclusive
};

export const MOCK_ROUTINE: WeeklyRoutine = {
  preset: "early_shift",
  awayBlocks: [{ days: [1, 2, 3, 4, 5], start: 6, end: 15 }], // weekdays 6 AM – 3 PM
  plugInHour: 16, // car plugged in at 4 PM
};

// ---------------------------------------------------------------------------
// Region reference — real public data placeholder (owner D replaces via lib/realdata)
// ---------------------------------------------------------------------------
const pjmDemand: number[] = [
  // Placeholder 48-point curve (MW), modeled on a mild fall weekday shape. Not real data.
  8200, 7900, 7650, 7450, 7350, 7400, 7700, 8100,
  8600, 9100, 9500, 9700, 9800, 9750, 9600, 9700,
  10100, 10800, 11200, 10900, 10400, 9800, 9100, 8500,
  8200, 7900, 7650, 7450, 7350, 7400, 7700, 8100,
  8600, 9100, 9500, 9700, 9800, 9750, 9600, 9700,
  10100, 10800, 11200, 10900, 10400, 9800, 9100, 8500,
];

export const MOCK_REGION_REFERENCE: RegionReference = {
  label: "AEP zone · sample data (D replaces with PJM snapshot)",
  source: "PJM Data Miner 2",
  sourceUrl: "https://dataminer2.pjm.com",
  date: "sample",
  unit: "MW",
  demandMW: pjmDemand,
  forecastMW: pjmDemand.map((v) => Math.round(v * 1.02)),
  priceUSDperMWh: pjmDemand.map((v) => round2((v / 11200) * 55 + 10)),
};

// ---------------------------------------------------------------------------
// Demo household (Jordan): not enrolled until the first commit
// ---------------------------------------------------------------------------
export const MOCK_HOUSEHOLD: Household = {
  id: "h-jordan",
  neighborhoodId: "n1",
  baselineKW: baselineHome,
  tasks: MOCK_TASKS.map((t): FlexTask => ({
    id: t.id,
    label: t.label,
    appliance: t.appliance,
    kWh: t.kWh,
    powerKW: t.powerKW,
    earliestStart: t.earliestStart,
    deadline: t.deadline,
  })),
  flags: [],
  points: 150,
  enrolled: false,
  trips: [MOCK_TRIP],
  routine: MOCK_ROUTINE,
  eventIds: [],
};

// ---------------------------------------------------------------------------
// Phase 4 (PHASE4.md §7): verification, points, settlement, data feed. All simulated.
// ---------------------------------------------------------------------------
export const MOCK_MY_STATUS: MyStatus = {
  points: 155,
  setup: { rate: "flat", verification: "smart_meter" },
  reliability: 0.95,
  pending: [
    { rule: "verified_shift", label: "Verified shift", points: 115, detail: "11.5 kWh planned out of 2–6 PM × 10", status: "pending" },
    { rule: "event", label: "Flex Event", points: 115, detail: "11.5 kWh out of Mon 4–6 PM × 5 × 2", status: "pending" },
  ],
  history: [{ rule: "commit", label: "Commit", points: 5, detail: "Plan committed", status: "settled" }],
  touComparison: { flatMonthly: 50.4, touMonthly: 39.6 },
};

export const MOCK_SETTLEMENT_SUMMARY: SettlementSummary = {
  day: 1,
  settled: true,
  homesSettled: 116,
  byTier: {
    smart_meter: { homes: 80, plannedKWh: 310, deliveredKWh: 262 },
    device: { homes: 36, plannedKWh: 140, deliveredKWh: 121 },
    none: { homes: 182, plannedKWh: 690, deliveredKWh: 0 },
  },
  deliveredPct: 85,
  eventReducedKWh: 9,
  pointsIssued: 4820,
  reliabilityByArea: NEIGHBORHOODS.map((n, i) => ({ areaId: n.id, name: n.name, homes: 9 + (i % 4), avgReliability: 0.78 + (i % 5) * 0.03 })),
};

export const MOCK_INTAKE: IntakeStats = { plansReceived: 298, verifiedSharePct: 39, lastReceivedHour: 18, meterReads: 0 };
