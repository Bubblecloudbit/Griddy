// lib/community.ts — seeded synthetic community (owner: A)
// ~120 simulated homes in 3 neighborhoods. Same seed → same data. See design.md §3.
// Every profile here is simulated, not real customer data.
import type { FlexTask, Household, Neighborhood } from "@/lib/types";
import { HORIZON_HOURS } from "@/lib/rates";

export const DEFAULT_SEED = 42;
export const DEFAULT_EV_ADOPTION = 0.35; // fraction of homes with an EV to charge
export const DEMO_HOUSEHOLD_ID = "h-jordan"; // the customer-app demo home, in n1

const TRANSFORMER_CAPACITY_KW = 200; // ~40 homes × 5 kW peak

// Exported for UI pickers (browser-safe: no store access). Use the id as the forecast scope.
export const NEIGHBORHOODS = [
  { id: "n1", name: "Oak Hill", homes: 40 },
  { id: "n2", name: "Riverside", homes: 42 },
  { id: "n3", name: "Eastside", homes: 38 },
];

// Illustrative hourly shape of an average home's non-flexible load (kW), ~28 kWh/day:
// overnight trough, morning bump 7–9 AM, evening bump 6–9 PM.
const DAILY_SHAPE_KW = [
  0.6, 0.5, 0.5, 0.5, 0.5, 0.6, 0.9, 1.4, 1.5, 1.1, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.1, 1.3, 1.8, 2.2, 2.3, 2.2, 1.9, 1.4, 0.9,
];

// mulberry32: tiny seeded PRNG returning floats in [0, 1).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1)); // inclusive
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function makeBaseline(rng: Rng): number[] {
  const homeSize = 0.7 + rng() * 0.6; // 0.7×–1.3× the average home
  return Array.from({ length: HORIZON_HOURS }, (_, h) => {
    const noise = 0.9 + rng() * 0.2; // ±10% hour to hour
    return round2(DAILY_SHAPE_KW[h % 24] * homeSize * noise);
  });
}

// Flexible appliances, sampled per home. Times use hour 0 = midnight today.
function makeTasks(rng: Rng, homeId: string, evAdoption: number): FlexTask[] {
  const tasks: FlexTask[] = [];
  if (rng() < evAdoption) {
    // Plug in 5–8 PM, full by 7 AM tomorrow (hour 31).
    tasks.push({ id: `${homeId}-ev`, label: "EV Charging", kWh: randInt(rng, 6, 14), powerKW: 7.2, earliestStart: randInt(rng, 17, 20), deadline: 31 });
  }
  if (rng() < 0.5) {
    const start = randInt(rng, 8, 19);
    tasks.push({ id: `${homeId}-dryer`, label: "Dryer", kWh: 1.5, powerKW: 3, earliestStart: start, deadline: start + randInt(rng, 6, 12) });
  }
  if (rng() < 0.6) {
    tasks.push({ id: `${homeId}-dish`, label: "Dishwasher", kWh: 1.2, powerKW: 1.5, earliestStart: randInt(rng, 19, 21), deadline: 31 });
  }
  if (rng() < 0.3) {
    tasks.push({ id: `${homeId}-water`, label: "Water Heater", kWh: 2, powerKW: 4.5, earliestStart: 22, deadline: 30 });
  }
  return tasks;
}

export function generateCommunity(
  seed: number = DEFAULT_SEED,
  evAdoption: number = DEFAULT_EV_ADOPTION,
): { households: Household[]; neighborhoods: Neighborhood[] } {
  const rng = mulberry32(seed);
  const households: Household[] = [];
  const neighborhoods: Neighborhood[] = [];

  for (const n of NEIGHBORHOODS) {
    const homeIds: string[] = [];
    for (let i = 0; i < n.homes; i++) {
      const isDemoHome = n.id === "n1" && i === 0;
      const id = isDemoHome ? DEMO_HOUSEHOLD_ID : `h-${n.id}-${i}`;
      const baselineKW = makeBaseline(rng);
      const tasks = makeTasks(rng, id, evAdoption);
      const points = randInt(rng, 0, 300);
      homeIds.push(id);
      households.push({
        id,
        neighborhoodId: n.id,
        baselineKW,
        // Jordan starts with an empty plan; the demo adds tasks from the customer app.
        tasks: isDemoHome ? [] : tasks,
        flags: [],
        points: isDemoHome ? 150 : points,
      });
    }
    neighborhoods.push({ id: n.id, name: n.name, transformerCapacityKW: TRANSFORMER_CAPACITY_KW, homeIds });
  }

  return { households, neighborhoods };
}
