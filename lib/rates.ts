// lib/rates.ts — illustrative time-of-use rate (owner: A)
// Not real AEP pricing. See design.md §0 (time convention) and §4.
import type { Hour, RatePlan } from "@/lib/types";

// 72 h from DEMO_DAY_0 (Sun–Tue). Defined in lib/config.ts; re-exported because older code imports it from here.
export { HORIZON_HOURS } from "@/lib/config";

export const DEFAULT_RATE: RatePlan = {
  name: "Illustrative TOU",
  offPeak: 0.07, // $/kWh
  onPeak: 0.22, // $/kWh
  peakHours: [16, 17, 18, 19, 20], // clock hours; applies to both days
  illustrative: true,
};

export function isPeak(rate: RatePlan, hour: Hour): boolean {
  return rate.peakHours.includes(hour % 24);
}

// $/kWh at a horizon hour.
export function priceAt(rate: RatePlan, hour: Hour): number {
  return isPeak(rate, hour) ? rate.onPeak : rate.offPeak;
}
