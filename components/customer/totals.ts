// components/customer/totals.ts — plan-level numbers shown on Today and Plan (owner: B)
import type { ScheduledTask } from "@/lib/types";

export interface PlanTotals {
  saved: number; // $ vs. running everything at plug-in time (illustrative)
  peakKWhAvoided: number; // kWh moved out of peak hours
}

export function planTotals(schedule: ScheduledTask[]): PlanTotals {
  return {
    saved: schedule.reduce((sum, t) => sum + (t.baselineCost - t.cost), 0),
    peakKWhAvoided: schedule.reduce((sum, t) => sum + (t.peakKWhAvoided ?? 0), 0),
  };
}

// 10 → "10 kWh", 11.52 → "11.5 kWh", 1900 → "1,900 kWh"
export function kWh(n: number): string {
  return `${Number(n.toFixed(1)).toLocaleString("en-US")} kWh`;
}
