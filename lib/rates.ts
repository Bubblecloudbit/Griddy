// lib/rates.ts — illustrative time-of-use rate (owner: A)
// Not real AEP pricing. See design.md §0 (time convention) and §4.
import type { Hour, RatePlan } from "@/lib/types";

export const HORIZON_HOURS = 48; // hour 0 = midnight today, 24–47 = tomorrow

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
