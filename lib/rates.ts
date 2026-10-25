// lib/rates.ts — time-of-use rate plan (owner: A)
// The peak WINDOW is real (AEP Ohio summer schedule, May 1–Oct 31: 2–6 PM weekdays).
// The $/kWh prices are illustrative. See PLAN.md §5–§6 and DATA.md §1.
import type { Hour, RatePlan } from "@/lib/types";
import { isWeekend } from "@/lib/config";

// 72 h from DEMO_DAY_0 (Sun–Tue). Defined in lib/config.ts; re-exported because older code imports it from here.
export { HORIZON_HOURS } from "@/lib/config";

// TODO (D1): once D commits data/real/aep_tou.json and confirms the window, keep these
// numbers in sync with it. If D verifies tariff ¢/kWh, set them here and drop "illustrative" in the UI.
export const DEFAULT_RATE: RatePlan = {
  name: "Illustrative time-of-use",
  offPeak: 0.11, // $/kWh, illustrative
  onPeak: 0.22, // $/kWh, illustrative
  peakHours: [14, 15, 16, 17], // clock hours: 2–6 PM
  illustrative: true,
  weekdaysOnly: true,
  flatRate: 0.14, // $/kWh, illustrative standard rate (same price all day), for the time-of-use comparison
  source: "AEP Ohio, Time-of-Use program page",
  sourceUrl: "https://www.aepohio.com/account/bills/programs/time-of-use",
};

// Peak = a peak clock hour, and (if weekdaysOnly) not Sat/Sun. Sun Oct 25 (hours 0–23) has no peak.
export function isPeak(rate: RatePlan, hour: Hour): boolean {
  if (rate.weekdaysOnly && isWeekend(hour)) return false;
  return rate.peakHours.includes(hour % 24);
}

// $/kWh at a horizon hour.
export function priceAt(rate: RatePlan, hour: Hour): number {
  return isPeak(rate, hour) ? rate.onPeak : rate.offPeak;
}
