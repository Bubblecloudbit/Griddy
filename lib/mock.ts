// lib/mock.ts — Realistic mock data for scaffold development.
// Everyone builds against these shapes until real logic is wired in.

import type {
  RatePlan,
  ScheduledTask,
  Forecast,
  RegionReference,
  FlexEvent,
  FlexTask,
  Household,
  Neighborhood,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Rate plan
// ---------------------------------------------------------------------------
export const MOCK_RATE: RatePlan = {
  name: "Illustrative TOU",
  offPeak: 0.07,
  onPeak: 0.22,
  peakHours: [16, 17, 18, 19, 20],
  illustrative: true,
};

// ---------------------------------------------------------------------------
// Scheduled tasks for Jordan's household
// ---------------------------------------------------------------------------
export const MOCK_TASKS: ScheduledTask[] = [
  {
    id: "t1",
    label: "EV Charging",
    kWh: 10,
    powerKW: 7.2,
    earliestStart: 0,
    deadline: 30, // must finish by 7 AM (hour 7 on a 0-based 48h horizon starting midnight)
    start: 2, // 2 AM
    cost: 0.7, // illustrative $
    baselineCost: 2.2,
  },
  {
    id: "t2",
    label: "Dryer",
    kWh: 1.5,
    powerKW: 3.0,
    earliestStart: 6,
    deadline: 36,
    start: 8, // 8 AM
    cost: 0.11,
    baselineCost: 0.33,
  },
  {
    id: "t3",
    label: "Dishwasher",
    kWh: 1.2,
    powerKW: 1.5,
    earliestStart: 18,
    deadline: 40,
    start: 22, // 10 PM
    cost: 0.08,
    baselineCost: 0.26,
  },
  {
    id: "t4",
    label: "Water Heater",
    kWh: 2.0,
    powerKW: 4.5,
    earliestStart: 0,
    deadline: 24,
    start: 3, // 3 AM
    cost: 0.14,
    baselineCost: 0.44,
  },
];

// ---------------------------------------------------------------------------
// Helpers — generate a simple residential load curve (48 hours)
// ---------------------------------------------------------------------------
function residentialBaseline(): number[] {
  const curve: number[] = [];
  for (let h = 0; h < 48; h++) {
    const hour = h % 24;
    let base = 0.8;
    if (hour >= 6 && hour <= 9) base = 1.8; // morning bump
    if (hour >= 17 && hour <= 21) base = 2.6; // evening bump
    if (hour >= 0 && hour <= 4) base = 0.4; // overnight trough
    // add slight noise for realism
    base += (Math.sin(h * 1.3) * 0.1);
    curve.push(Math.max(0.3, base));
  }
  return curve;
}

function scale(arr: number[], factor: number): number[] {
  return arr.map((v) => parseFloat((v * factor).toFixed(2)));
}

function addArrays(a: number[], b: number[]): number[] {
  return a.map((v, i) => parseFloat((v + (b[i] ?? 0)).toFixed(2)));
}

const baseline48 = residentialBaseline();

// Neighborhood n1: 40 homes
export const MOCK_NEIGHBORHOOD_FORECAST: Forecast = {
  neighborhoodId: "n1",
  baselineKW: scale(baseline48, 40),
  plannedKW: scale(baseline48, 36), // optimized — slightly lower peak
  capacityKW: 200,
  homeCount: 40,
};

// Region: 120 homes across 3 neighborhoods
export const MOCK_REGION_FORECAST: Forecast = {
  neighborhoodId: "region",
  baselineKW: scale(baseline48, 120),
  plannedKW: scale(baseline48, 108),
  capacityKW: 600,
  homeCount: 120,
};

// ---------------------------------------------------------------------------
// Region reference — real public data placeholder (owner: D replaces this)
// ---------------------------------------------------------------------------
const pjmDemand: number[] = [
  // Illustrative 48-point curve (MW), modeled on a mild fall weekday shape
  // Source placeholder: PJM Data Miner 2 snapshot — owner D fills in real data
  8200, 7900, 7650, 7450, 7350, 7400, 7700, 8100,
  8600, 9100, 9500, 9700, 9800, 9750, 9600, 9700,
  10100, 10800, 11200, 10900, 10400, 9800, 9100, 8500,
  8200, 7900, 7650, 7450, 7350, 7400, 7700, 8100,
  8600, 9100, 9500, 9700, 9800, 9750, 9600, 9700,
  10100, 10800, 11200, 10900, 10400, 9800, 9100, 8500,
];

export const MOCK_REGION_REFERENCE: RegionReference = {
  label: "PJM AEP Zone — placeholder (owner D)",
  source: "PJM Data Miner 2",
  date: "2024-10-15",
  demandMW: pjmDemand,
  forecastMW: pjmDemand.map((v) => v * 1.02),
  priceUSDperMWh: pjmDemand.map((v) =>
    parseFloat(((v / 11200) * 55 + 10).toFixed(1))
  ),
};

// ---------------------------------------------------------------------------
// Flex Event
// ---------------------------------------------------------------------------
export const MOCK_FLEX_EVENT: FlexEvent = {
  id: "fe1",
  startHour: 17, // 5 PM
  endHour: 19, // 7 PM
  multiplier: 2,
  message: "Reduce load 5–7 PM tomorrow and earn 2× GridPoints.",
};

// ---------------------------------------------------------------------------
// Demo household (Jordan)
// ---------------------------------------------------------------------------
export const MOCK_HOUSEHOLD: Household = {
  id: "h-jordan",
  neighborhoodId: "n1",
  baselineKW: baseline48,
  tasks: MOCK_TASKS.map((t): FlexTask => ({
    id: t.id,
    label: t.label,
    kWh: t.kWh,
    powerKW: t.powerKW,
    earliestStart: t.earliestStart,
    deadline: t.deadline,
  })),
  flags: [],
  points: 150,
};

// ---------------------------------------------------------------------------
// Neighborhoods
// ---------------------------------------------------------------------------
export const MOCK_NEIGHBORHOODS: Neighborhood[] = [
  { id: "n1", name: "Oak Hill", transformerCapacityKW: 200, homeIds: Array.from({ length: 40 }, (_, i) => `h-n1-${i}`) },
  { id: "n2", name: "Riverside", transformerCapacityKW: 200, homeIds: Array.from({ length: 42 }, (_, i) => `h-n2-${i}`) },
  { id: "n3", name: "Eastside", transformerCapacityKW: 200, homeIds: Array.from({ length: 38 }, (_, i) => `h-n3-${i}`) },
];
