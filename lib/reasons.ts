// lib/reasons.ts — one-line "why this time?" for each scheduled task (owner: A)
// Shown behind the InfoTip on B's appliance cards. Built from facts the optimizer already
// knows, so it's always true: peak kWh moved, and whether spreading load changed the start.
import type { FlexTask, Hour, RatePlan } from "@/lib/types";
import { isWeekend } from "@/lib/config";

// "6 PM", "12 AM"
function clockLabel(clock: number): string {
  const c = ((clock % 24) + 24) % 24;
  return `${c % 12 === 0 ? 12 : c % 12} ${c < 12 ? "AM" : "PM"}`;
}

// "2–6 PM" for a contiguous peak window like [14, 15, 16, 17].
export function peakWindowLabel(rate: RatePlan): string {
  const first = Math.min(...rate.peakHours);
  const end = Math.max(...rate.peakHours) + 1;
  const sameHalf = (first < 12) === (end % 24 < 12);
  const from = sameHalf ? clockLabel(first).replace(/ (AM|PM)$/, "") : clockLabel(first);
  return `${from}–${clockLabel(end)}`;
}

function whenLabel(start: Hour, rate: RatePlan): string {
  const clock = start % 24;
  const peakEnd = Math.max(...rate.peakHours) + 1;
  if (clock >= peakEnd) return `after ${clockLabel(peakEnd)}`;
  if (clock < 6) return "overnight";
  return `at ${clockLabel(clock)}`;
}

function spreadNote(task: FlexTask): string {
  return task.appliance === "ev" ? "; spreads EV charging in your area" : "; spreads load in your area";
}

export function explainStart(
  task: FlexTask,
  start: Hour,
  priceOnlyStart: Hour, // where it would start if only price mattered (lambda = 0)
  peakKWhAvoided: number,
  peakKWhAtStart: number,
  rate: RatePlan,
): string {
  const spread = start !== priceOnlyStart ? spreadNote(task) : "";
  if (peakKWhAvoided > 0 && peakKWhAtStart === 0) {
    return `Off-peak ${whenLabel(start, rate)}, avoiding the ${peakWindowLabel(rate)} peak${spread}`;
  }
  if (peakKWhAtStart > 0) {
    return `No full off-peak window fits before your deadline; this is the cheapest option${spread}`;
  }
  // Only a car is "plugged in"; a dishwasher or dryer just starts right away.
  const startsNow = task.appliance === "ev" ? ", so it starts when you plug in" : ", so it starts right away";
  const plugIn = start === task.earliestStart ? startsNow : "";
  if (rate.weekdaysOnly && isWeekend(start)) return `No peak hours on weekends${plugIn || spread}`;
  if (plugIn) return `Already off-peak${plugIn}`;
  return `Already off-peak${spread || `; starts ${whenLabel(start, rate)}`}`;
}
