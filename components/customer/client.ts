// components/customer/client.ts — the customer app's only door to the backend (owner: B)
// Flip USE_MOCKS to false once A's real /api/optimize and /api/plan land.
import type { FlexTask, LoadFlag, RatePlan, ScheduledTask } from "@/lib/types";
import { MOCK_RATE } from "@/lib/mock";
import { isPeak, priceAt } from "@/lib/rates";

const USE_MOCKS = true;

export const HOUSEHOLD_ID = "h-jordan";
export const NEIGHBORHOOD_ID = "n1";

export function durationHours(task: FlexTask): number {
  return Math.ceil(task.kWh / task.powerKW);
}

export async function optimize(tasks: FlexTask[]): Promise<ScheduledTask[]> {
  if (USE_MOCKS) return mockOptimize(tasks);
  return post<ScheduledTask[]>("/api/optimize", {
    tasks,
    neighborhoodId: NEIGHBORHOOD_ID,
    coordinated: true,
  });
}

// /api/rates is live (A2), so no mock here.
export async function getRates(): Promise<RatePlan> {
  return get<RatePlan>("/api/rates");
}

// Returns GridPoints earned by this commit.
export async function commitPlan(tasks: FlexTask[], flags: LoadFlag[]): Promise<number> {
  const data = await post<{ points: number }>("/api/plan", {
    householdId: HOUSEHOLD_ID,
    tasks,
    flags,
  });
  return data.points;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

// --- Temporary stand-in for A's optimizer (design.md §2 with λ = 0) ---------
// The stub /api/optimize ignores its input, so this lets the planner react to
// the tasks the user actually enters. Delete once USE_MOCKS is false.

function price(h: number): number {
  return priceAt(MOCK_RATE, h);
}

// kWh drawn in the i-th hour of a run (the last hour may be partial).
function kWhInHour(task: FlexTask, i: number): number {
  return Math.min(task.powerKW, task.kWh - i * task.powerKW);
}

function energyCost(task: FlexTask, start: number): number {
  let cost = 0;
  for (let i = 0; i < durationHours(task); i++) cost += price(start + i) * kWhInHour(task, i);
  return cost;
}

function peakKWh(task: FlexTask, start: number): number {
  let kWh = 0;
  for (let i = 0; i < durationHours(task); i++) if (isPeak(MOCK_RATE, start + i)) kWh += kWhInHour(task, i);
  return kWh;
}

function mockOptimize(tasks: FlexTask[]): ScheduledTask[] {
  return tasks.map((task) => {
    const lastStart = task.deadline - durationHours(task);
    if (lastStart < task.earliestStart) {
      throw new Error(`No feasible window for ${task.label}: it needs ${durationHours(task)} h.`);
    }
    let best = task.earliestStart;
    for (let s = task.earliestStart; s <= lastStart; s++) {
      if (energyCost(task, s) < energyCost(task, best)) best = s;
    }
    return {
      ...task,
      start: best,
      cost: energyCost(task, best),
      baselineCost: energyCost(task, task.earliestStart),
      peakKWhAvoided: peakKWh(task, task.earliestStart) - peakKWh(task, best),
    };
  });
}
