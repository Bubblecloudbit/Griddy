// lib/reasons.ts — one-line "why this time?" for each scheduled task (owner: A)
// Shown behind the InfoTip on B's appliance cards. Built from facts the optimizer already
// knows, so it's always true: peak kWh moved, and whether spreading load or the grid term
// (lib/grid.ts) changed the start.
import type { FlexTask, Hour, RatePlan } from "@/lib/types";
import { DAY_NAMES, isWeekend, weekdayOf } from "@/lib/config";

// "6 PM", "12 AM"
function clockLabel(clock: number): string {
  const c = ((clock % 24) + 24) % 24;
  return `${c % 12 === 0 ? 12 : c % 12} ${c < 12 ? "AM" : "PM"}`;
}

// "Mon 4–6 PM" for a window of horizon hours [start, end).
export function rangeText(start: Hour, end: Hour): string {
  const from = clockLabel(start);
  const to = clockLabel(end);
  const sameHalf = from.slice(-2) === to.slice(-2);
  return `${DAY_NAMES[weekdayOf(start)]} ${sameHalf ? from.slice(0, -3) : from}–${to}`;
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
  if (clock < 6 || clock >= 22) return "overnight";
  if (clock >= peakEnd) return `after ${clockLabel(peakEnd)}`;
  return `at ${clockLabel(clock)}`;
}

// Added when lib/grid.ts (real PJM forecast) moved the start, not price or spreading.
const GRID_NOTE = " and the busiest grid hours (PJM forecast)";

function spreadNote(task: FlexTask): string {
  return task.appliance === "ev" ? "; spreads EV charging in your area" : "; spreads load in your area";
}

export function explainStart(
  task: FlexTask,
  start: Hour,
  noSpreadStart: Hour, // where it would start without the area spreading term (lambda = 0)
  gridMoved: boolean, // true if the grid-stress term changed the start (lib/grid.ts)
  peakKWhAvoided: number,
  peakKWhAtStart: number,
  rate: RatePlan,
): string {
  const spread = start !== noSpreadStart ? spreadNote(task) : "";
  const grid = gridMoved ? GRID_NOTE : "";
  if (peakKWhAvoided > 0 && peakKWhAtStart === 0) {
    return `Off-peak ${whenLabel(start, rate)}, avoiding the ${peakWindowLabel(rate)} price peak${grid}${spread}`;
  }
  if (peakKWhAtStart > 0) {
    return `No full off-peak window fits before your deadline; this is the cheapest option${spread}`;
  }
  // Only a car is "plugged in"; a dishwasher or dryer just starts right away.
  const startsNow = task.appliance === "ev" ? ", so it starts when you plug in" : ", so it starts right away";
  const plugIn = start === task.earliestStart ? startsNow : "";
  if (rate.weekdaysOnly && isWeekend(start)) return `No peak hours on weekends${plugIn || spread}`;
  if (plugIn) return `Already off-peak${plugIn}`;
  if (grid) return `Already off-peak; starts ${whenLabel(start, rate)} to avoid${GRID_NOTE.replace(" and", "")}${spread}`;
  return `Already off-peak${spread || `; starts ${whenLabel(start, rate)}`}`;
}
