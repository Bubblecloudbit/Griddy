// lib/optimizer.ts — appliance scheduler (owner: A)
// Picks each task's start hour by minimizing: energy $ + lambda × congestion + grid stress.
// See design.md §2 for the first two terms; the grid term is lib/grid.ts (GRID_WEIGHT = 0 turns it off).
import type { FlexTask, Hour, RatePlan, ScheduledTask } from "@/lib/types";
import { isPeak, priceAt } from "@/lib/rates";
import { explainStart } from "@/lib/reasons";
import { gridCost } from "@/lib/grid";
import { breaksQuietHours } from "@/lib/quiet";

export const COORDINATED_LAMBDA = 2; // ~0.5 $/EV-hour vs ~1.0 penalty/full-transformer-hour

export class InfeasibleTaskError extends Error {}

export function duration(task: FlexTask): number {
  return Math.ceil(task.kWh / task.powerKW);
}

// kWh drawn in the i-th run hour: full power except the last hour, which draws what's left.
export function kwhInRunHour(task: FlexTask, i: number): number {
  return Math.min(task.powerKW, task.kWh - i * task.powerKW);
}

// Illustrative $ cost of running the task starting at hour `start`. This is shown to customers.
export function energyCost(task: FlexTask, start: Hour, rate: RatePlan): number {
  let cost = 0;
  for (let i = 0; i < duration(task); i++) {
    cost += priceAt(rate, start + i) * kwhInRunHour(task, i);
  }
  return cost;
}

// kWh the task draws inside peak hours if it starts at `start`.
export function peakKWh(task: FlexTask, start: Hour, rate: RatePlan): number {
  let kwh = 0;
  for (let i = 0; i < duration(task); i++) {
    if (isPeak(rate, start + i)) kwh += kwhInRunHour(task, i);
  }
  return kwh;
}

// kWh the task draws inside [from, to) if it starts at `start` (e.g. a Flex Event window).
export function windowKWh(task: FlexTask, start: Hour, from: Hour, to: Hour): number {
  let kwh = 0;
  for (let i = 0; i < duration(task); i++) {
    if (start + i >= from && start + i < to) kwh += kwhInRunHour(task, i);
  }
  return kwh;
}

// Penalty for running in crowded hours. Used only to choose the start, never shown as $.
function congestion(task: FlexTask, start: Hour, sharedLoad: number[], capacityKW: number): number {
  let penalty = 0;
  for (let i = 0; i < duration(task); i++) {
    penalty += (sharedLoad[start + i] / capacityKW) ** 2;
  }
  return penalty;
}

function flexibility(task: FlexTask): number {
  return task.deadline - task.earliestStart - duration(task);
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

// useGrid: include the PJM grid-stress tie-breaker (lib/grid.ts; GRID_WEIGHT = 0 turns it off).
function bestStart(task: FlexTask, sharedLoad: number[], capacityKW: number, rate: RatePlan, lambda: number, useGrid = true): Hour {
  const lastStart = task.deadline - duration(task); // must finish by deadline (exclusive end)
  if (lastStart < task.earliestStart || lastStart + duration(task) > sharedLoad.length) {
    throw new InfeasibleTaskError(`No feasible window for "${task.label}": it needs ${duration(task)} h between hour ${task.earliestStart} and ${task.deadline}.`);
  }
  // Quiet hours (lib/quiet.ts): skip starts that would run a dryer 10 PM–7 AM, unless the
  // customer's window leaves no other choice.
  const starts = Array.from({ length: lastStart - task.earliestStart + 1 }, (_, i) => task.earliestStart + i);
  const polite = starts.filter((s) => !breaksQuietHours(task, s, duration(task)));
  const candidates = polite.length > 0 ? polite : starts;

  let best = candidates[0];
  let bestScore = Infinity;
  for (const s of candidates) {
    const grid = useGrid ? gridCost(s, duration(task), (i) => kwhInRunHour(task, i)) : 0;
    const score = energyCost(task, s, rate) + lambda * congestion(task, s, sharedLoad, capacityKW) + grid;
    if (score < bestScore) { // strict <, so ties keep the earliest start
      bestScore = score;
      best = s;
    }
  }
  return best;
}

// Adds a task's draw to a 72-hour load curve, in place. kWh in a 1-hour slot = average kW.
export function addTaskLoad(load: number[], task: FlexTask, start: Hour): void {
  for (let i = 0; i < duration(task); i++) {
    load[start + i] += kwhInRunHour(task, i);
  }
}

// Schedules tasks least-flexible first. Each placed task adds to the shared load, so with
// lambda > 0 later tasks avoid crowded hours. Returns tasks in their original order.
// Throws InfeasibleTaskError if any task can't fit its window.
export function optimize(
  tasks: FlexTask[],
  neighborhoodLoad: number[],
  capacityKW: number,
  rate: RatePlan,
  lambda: number,
): ScheduledTask[] {
  const sharedLoad = [...neighborhoodLoad];
  const order = tasks.map((_, i) => i).sort((a, b) => flexibility(tasks[a]) - flexibility(tasks[b]));
  const scheduled: ScheduledTask[] = new Array(tasks.length);

  for (const i of order) {
    const task = tasks[i];
    const start = bestStart(task, sharedLoad, capacityKW, rate, lambda);
    // For the "why" text: where it would start without spreading, and without the grid term too.
    const noSpreadStart = bestStart(task, sharedLoad, capacityKW, rate, 0);
    const priceOnlyStart = bestStart(task, sharedLoad, capacityKW, rate, 0, false);
    addTaskLoad(sharedLoad, task, start);

    const peakAtStart = peakKWh(task, start, rate);
    const peakKWhAvoided = round2(peakKWh(task, task.earliestStart, rate) - peakAtStart);
    scheduled[i] = {
      ...task,
      start,
      cost: round2(energyCost(task, start, rate)),
      baselineCost: round2(energyCost(task, task.earliestStart, rate)), // "run it now" = start at plug-in
      peakKWhAvoided,
      reason: explainStart(task, start, noSpreadStart, noSpreadStart !== priceOnlyStart, peakKWhAvoided, peakAtStart, rate),
    };
  }

  return scheduled;
}
