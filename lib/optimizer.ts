// lib/optimizer.ts — appliance scheduler (owner: A)
// Picks each task's start hour by minimizing: energy $ + lambda × congestion.
// See design.md §2 for the pseudocode this follows line for line.
import type { FlexTask, Hour, RatePlan, ScheduledTask } from "@/lib/types";
import { priceAt } from "@/lib/rates";

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

function bestStart(task: FlexTask, sharedLoad: number[], capacityKW: number, rate: RatePlan, lambda: number): Hour {
  const lastStart = task.deadline - duration(task); // must finish by deadline (exclusive end)
  if (lastStart < task.earliestStart || lastStart + duration(task) > sharedLoad.length) {
    throw new InfeasibleTaskError(`No feasible window for "${task.label}": it needs ${duration(task)} h between hour ${task.earliestStart} and ${task.deadline}.`);
  }
  let best = task.earliestStart;
  let bestScore = Infinity;
  for (let s = task.earliestStart; s <= lastStart; s++) {
    const score = energyCost(task, s, rate) + lambda * congestion(task, s, sharedLoad, capacityKW);
    if (score < bestScore) { // strict <, so ties keep the earliest start
      bestScore = score;
      best = s;
    }
  }
  return best;
}

// Adds a task's draw to a 48-hour load curve, in place. kWh in a 1-hour slot = average kW.
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
    addTaskLoad(sharedLoad, task, start);
    scheduled[i] = {
      ...task,
      start,
      cost: round2(energyCost(task, start, rate)),
      baselineCost: round2(energyCost(task, task.earliestStart, rate)), // "run it now" = start at plug-in
    };
  }

  return scheduled;
}
