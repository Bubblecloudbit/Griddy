// components/customer/client.ts — the customer app's only door to the backend (owner: B)
// All calls go to A's real engine (/api/optimize, /api/plan, /api/rates).
import type { FlexTask, LoadFlag, RatePlan, ScheduledTask, Trip, WeeklyRoutine } from "@/lib/types";

export const HOUSEHOLD_ID = "h-jordan";
export const NEIGHBORHOOD_ID = "n1";

export function durationHours(task: FlexTask): number {
  return Math.ceil(task.kWh / task.powerKW);
}

// Recommended start times (no save). Coordinated, so tasks spread across Jordan's area.
export async function optimize(tasks: FlexTask[]): Promise<ScheduledTask[]> {
  return post<ScheduledTask[]>("/api/optimize", {
    tasks,
    neighborhoodId: NEIGHBORHOOD_ID,
    coordinated: true,
  });
}

export async function getRates(): Promise<RatePlan> {
  return get<RatePlan>("/api/rates");
}

export interface PlanCommit {
  tasks: FlexTask[];
  flags?: LoadFlag[];
  trips?: Trip[];
  routine?: WeeklyRoutine;
  eventIds?: string[];
}

// points = the household's new total; earned = this commit's points, incl. any Flex Event bonus.
export async function commitPlan(plan: PlanCommit): Promise<{ points: number; earned: number }> {
  return post<{ points: number; earned: number }>("/api/plan", { householdId: HOUSEHOLD_ID, flags: [], ...plan });
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
