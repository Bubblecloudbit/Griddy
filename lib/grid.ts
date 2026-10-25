// lib/grid.ts — grid-stress tie-breaker from the real PJM AEP-zone forecast (owner: A)
//
// Why: AEP Ohio's time-of-use PRICE peak is 2–6 PM, but the zone's real DEMAND peaks around
// 7–8 AM and 7 PM (PJM). Price alone would park shifted load at 6–8 PM, right into the grid's
// evening peak. This adds a small penalty for busy grid hours so shifted load lands overnight.
// It only steers the start time; customer $ still come from the time-of-use price alone.
//
// TO TURN OFF: set GRID_WEIGHT = 0 (everything below becomes a no-op),
// or `git revert` the commit that added this file.
import type { Hour } from "@/lib/types";
import { DEMO_DAY_0, HORIZON_HOURS } from "@/lib/config";
import { getRegionReference } from "@/lib/realdata";

export const GRID_WEIGHT = 0.05; // ~$/kWh-equivalent at the zone's busiest hour; never shown as $

// 0 at the zone's quietest forecast hour in the horizon, 1 at its busiest.
function buildStress(): number[] {
  const ref = getRegionReference();
  const offset = ref.hours ? ref.hours.indexOf(`${DEMO_DAY_0}T00:00`) : 0; // align to the demo clock
  if (offset < 0) return new Array(HORIZON_HOURS).fill(0); // no overlap: no steering
  const mw = Array.from({ length: HORIZON_HOURS }, (_, h) => ref.demandMW[offset + h]);
  const known = mw.filter((v): v is number => typeof v === "number");
  const min = Math.min(...known);
  const range = Math.max(...known) - min || 1;
  return mw.map((v) => (typeof v === "number" ? (v - min) / range : 0));
}

const STRESS = buildStress();

export function gridStress(h: Hour): number {
  return STRESS[h] ?? 0;
}

// Grid penalty for drawing `kwhAt(i)` in each of `hours` run hours from `start`. Used only to pick the start.
export function gridCost(start: Hour, hours: number, kwhAt: (i: number) => number): number {
  let cost = 0;
  for (let i = 0; i < hours; i++) cost += gridStress(start + i) * kwhAt(i);
  return GRID_WEIGHT * cost;
}
