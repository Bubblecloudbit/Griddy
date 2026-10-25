// lib/community.ts — seeded synthetic community (owner: A)
// 12 service areas × 40 homes = 480, all simulated. Same seed → same data. See BUILD.md A3.
// Flexible tasks sit on Monday Oct 26 (hours 24–47, "tomorrow" on every chart).
import type { CustomerSetup, FlexTask, Household, Neighborhood, Trip, Verification, WeeklyRoutine } from "@/lib/types";
import { HORIZON_HOURS } from "@/lib/config";
import { ROUTINE_PRESETS, isAwayAt } from "@/lib/routines";

export const DEFAULT_SEED = 42;
export const DEFAULT_EV_ADOPTION = 0.35; // fraction of homes with an EV to charge
export const DEMO_HOUSEHOLD_ID = "h-jordan"; // the customer-app demo home, in n1

const TRANSFORMER_CAPACITY_KW = 200; // internal normalizer for the optimizer; never displayed
const ENROLLED_SHARE = 0.6; // homes already committing GridShift plans
const TRIP_SHARE = 0.12; // homes with a seeded Thu–Sat trip
const AWAY_FACTOR = 0.5; // an empty home still draws fridge, HVAC, standby

// Phase 4: how each home can be measured (PHASE4.md §1, §7). One constant each; all simulated.
export const SMART_METER_SHARE = 0.27; // working figure: ~27% of Ohio homes have a smart meter (PHASE4.md §1); D may replace with AEP Ohio's EIA-861 count
export const DEVICE_SHARE = 0.12; // assumption: homes with a connected EV charger or thermostat but no smart meter
export const TOU_SHARE = 0.06; // assumption: homes on time-of-use (needs a smart meter); everyone else is on the flat standard rate
const RELIABILITY_MIN = 0.6; // verified homes follow 60–98% of their plans (PHASE4.md §3.2)
const RELIABILITY_MAX = 0.98;
export const JORDAN_RELIABILITY = 0.95; // the demo home, forced on-plan at settlement

// 12 synthetic service areas × 40 homes = 480. Shown in the UI as "service areas".
const AREA_NAMES = [
  "Oak Hill", "Riverside", "Eastside", "Maple Park", "Cedar Ridge", "Lakeview",
  "Birchwood", "Stonebrook", "Willow Creek", "Elm Court", "Pine Terrace", "Meadow Lane",
];

// Exported for UI pickers (browser-safe: no store access). Use the id as the forecast scope.
export const NEIGHBORHOODS = AREA_NAMES.map((name, i) => ({ id: `n${i + 1}`, name, homes: 40 }));

// Illustrative hourly shape of an average home's non-flexible load (kW), ~28 kWh/day:
// overnight trough, morning bump 7–9 AM, evening bump 6–9 PM.
const DAILY_SHAPE_KW = [
  0.6, 0.5, 0.5, 0.5, 0.5, 0.6, 0.9, 1.4, 1.5, 1.1, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.1, 1.3, 1.8, 2.2, 2.3, 2.2, 1.9, 1.4, 0.9,
];

const MONDAY = 24; // first hour of Mon Oct 26
const EV_READY_BY = 55; // Tue 7 AM
const LAST_HOUR = HORIZON_HOURS; // deadlines are exclusive, so 72 = end of Tuesday

const SEEDED_TRIP: Omit<Trip, "id"> = { label: "Trip", startDate: "2026-10-29", endDate: "2026-10-31" }; // Thu–Sat

// FNV-1a: a stable 32-bit number from a string (per-home random streams, pseudonymous ids).
export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

// mulberry32: tiny seeded PRNG returning floats in [0, 1). Also used by lib/settlement.ts.
export function mulberry32(seed: number): () => number {
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

function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

// ≈30% early shift, 35% commuter, 25% home all day, 10% night shift.
function pickRoutine(rng: Rng): WeeklyRoutine {
  const r = rng();
  const preset = r < 0.3 ? "early_shift" : r < 0.65 ? "commuter" : r < 0.9 ? "home_all_day" : "night_shift";
  return ROUTINE_PRESETS[preset].routine;
}

function makeBaseline(rng: Rng, routine: WeeklyRoutine): number[] {
  const homeSize = 0.7 + rng() * 0.6; // 0.7×–1.3× the average home
  return Array.from({ length: HORIZON_HOURS }, (_, h) => {
    const noise = 0.9 + rng() * 0.2; // ±10% hour to hour
    const away = isAwayAt(routine, h) ? AWAY_FACTOR : 1;
    return round2(DAILY_SHAPE_KW[h % 24] * homeSize * noise * away);
  });
}

// Monday's flexible appliances. Plug-in is drawn around the routine's plug-in hour and kept
// in Mon 2–8 PM (h38–44), so a real share of "run it when I get home" load lands in the peak.
function makeTasks(rng: Rng, homeId: string, routine: WeeklyRoutine, evAdoption: number): FlexTask[] {
  const plugIn = clamp(MONDAY + routine.plugInHour + randInt(rng, -1, 2), 38, 44);
  const tasks: FlexTask[] = [];
  if (rng() < evAdoption) {
    tasks.push({ id: `${homeId}-ev`, label: "EV charging", appliance: "ev", kWh: randInt(rng, 6, 14), powerKW: 7.2, earliestStart: plugIn, deadline: EV_READY_BY });
  }
  if (rng() < 0.5) {
    const start = plugIn + randInt(rng, 0, 1);
    tasks.push({ id: `${homeId}-dryer`, label: "Dryer", appliance: "dryer", kWh: 1.5, powerKW: 3, earliestStart: start, deadline: Math.min(LAST_HOUR, start + randInt(rng, 6, 12)) });
  }
  if (rng() < 0.6) {
    tasks.push({ id: `${homeId}-dish`, label: "Dishwasher", appliance: "dishwasher", kWh: 1.2, powerKW: 1.5, earliestStart: plugIn + randInt(rng, 0, 3), deadline: EV_READY_BY });
  }
  if (rng() < 0.3) {
    tasks.push({ id: `${homeId}-water`, label: "Water heater", appliance: "water_heater", kWh: 2, powerKW: 4.5, earliestStart: plugIn, deadline: plugIn + randInt(rng, 4, 8) });
  }
  return tasks;
}

// Rate + verification for one home, from its own random stream so the rest of the
// community (routines, tasks, baselines) stays exactly as it was before Phase 4.
function pickSetup(rng: Rng): { setup: CustomerSetup; reliability?: number } {
  const r = rng();
  const verification: Verification = r < SMART_METER_SHARE ? "smart_meter" : r < SMART_METER_SHARE + DEVICE_SHARE ? "device" : "none";
  const tou = verification === "smart_meter" && rng() < TOU_SHARE / SMART_METER_SHARE;
  const reliability = RELIABILITY_MIN + rng() * (RELIABILITY_MAX - RELIABILITY_MIN);
  return {
    setup: { rate: tou ? "tou" : "flat", verification },
    reliability: verification === "none" ? undefined : Math.round(reliability * 100) / 100,
  };
}

export function generateCommunity(
  seed: number = DEFAULT_SEED,
  evAdoption: number = DEFAULT_EV_ADOPTION,
): { households: Household[]; neighborhoods: Neighborhood[] } {
  const rng = mulberry32(seed);
  const setupRng = mulberry32(seed + 1000); // Phase 4 stream; never touches `rng`
  const households: Household[] = [];
  const neighborhoods: Neighborhood[] = [];

  for (const n of NEIGHBORHOODS) {
    const homeIds: string[] = [];
    for (let i = 0; i < n.homes; i++) {
      const isDemoHome = n.id === "n1" && i === 0;
      const id = isDemoHome ? DEMO_HOUSEHOLD_ID : `h-${n.id}-${i}`;
      // Every home draws the same random values in the same order, so Jordan's
      // overrides below never shift anyone else's data.
      const drawn = pickRoutine(rng);
      const routine = isDemoHome ? ROUTINE_PRESETS.early_shift.routine : drawn; // Jordan: early shift (demo story)
      const baselineKW = makeBaseline(rng, routine);
      const tasks = makeTasks(rng, id, routine, evAdoption);
      const enrolled = rng() < ENROLLED_SHARE;
      const trips: Trip[] = rng() < TRIP_SHARE ? [{ id: `${id}-trip`, ...SEEDED_TRIP }] : [];
      const points = randInt(rng, 0, 300);
      const { setup, reliability } = pickSetup(setupRng);
      homeIds.push(id);
      households.push(
        isDemoHome
          ? // Jordan starts with an empty plan, isn't enrolled, and has no setup until the customer picks one.
            { id, neighborhoodId: n.id, baselineKW, tasks: [], flags: [], points: 150, enrolled: false, trips: [], routine, eventIds: [], reliability: JORDAN_RELIABILITY }
          : { id, neighborhoodId: n.id, baselineKW, tasks, flags: [], points: enrolled ? points : 0, enrolled, trips, routine, eventIds: [], setup, reliability },
      );
    }
    neighborhoods.push({ id: n.id, name: n.name, transformerCapacityKW: TRANSFORMER_CAPACITY_KW, homeIds });
  }

  return { households, neighborhoods };
}
