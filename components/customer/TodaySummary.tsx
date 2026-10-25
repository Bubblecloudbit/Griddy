// components/customer/TodaySummary.tsx — "Best time to run things" headline + plan stats (owner: B)
// DESIGN.md §5.1. The headline is computed from the rate plan, never hardcoded.
import type { RatePlan, ScheduledTask } from "@/lib/types";
import { PLAN_DAY } from "@/lib/config";
import { isPeak } from "@/lib/rates";
import { Stat, Tag } from "@/components/ui";
import { clockLabel, money } from "./hours";
import { kWh, planTotals } from "./totals";

// Last peak hour of the day + 1 → "After 6 PM and overnight".
export function bestTimeText(rate: RatePlan, day: number = PLAN_DAY): string {
  const peakHours = Array.from({ length: 24 }, (_, c) => day * 24 + c).filter((h) => isPeak(rate, h));
  if (peakHours.length === 0) return "Any time; no peak hours today";
  return `After ${clockLabel(peakHours[peakHours.length - 1] + 1)} and overnight`;
}

export function BestTime({ rate }: { rate: RatePlan }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-brand-wash px-5 py-4">
      <div>
        <p className="eyebrow text-brand">Best time to run things</p>
        <p className="mt-1 font-display text-[22px] font-semibold leading-7 text-ink">{bestTimeText(rate)}</p>
      </div>
      <Tag kind="OFF-PEAK" className="bg-surface" />
    </div>
  );
}

export function PlanStats({ schedule }: { schedule: ScheduledTask[] }) {
  const { saved, peakKWhAvoided } = planTotals(schedule);
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Saved this week" value={money(saved)} tag="ILLUSTRATIVE" />
      <Stat label="Moved out of peak" value={kWh(peakKWhAvoided)} tag="SIMULATED" />
    </div>
  );
}
