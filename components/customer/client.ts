// components/customer/client.ts — the customer app's only door to the backend (owner: B)
// All calls go to A's real engine (/api/optimize, /api/plan, /api/rates, /api/events, /api/me).
import type {
  CustomerSetup, FlexEvent, FlexTask, LoadFlag, MyStatus, PointsLine, RatePlan, ScheduledTask, Trip, WeeklyRoutine,
} from "@/lib/types";

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

// Flex Events created on the AEP side. Polled every 5 s by the page.
export async function getEvents(): Promise<FlexEvent[]> {
  return get<FlexEvent[]>("/api/events");
}

export interface CoachReply {
  reply: string;
  tasks?: FlexTask[];
  trips?: Trip[];
  flags?: LoadFlag[];
  setup?: Partial<CustomerSetup>; // "I'm on the standard rate", "I have a smart meter"
}

// Plain language → proposed tasks/trips (D's coach; rule-based when there's no API key).
export async function askCoach(message: string): Promise<CoachReply> {
  return post<CoachReply>("/api/coach", { message });
}

export interface PlanCommit {
  tasks: FlexTask[];
  flags?: LoadFlag[];
  trips?: Trip[];
  routine?: WeeklyRoutine;
  eventIds?: string[];
  setup?: CustomerSetup;
}

export interface CommitResult {
  points: number; // settled total
  earned: number; // settled by this commit (commit + contribution)
  lines: PointsLine[]; // this commit's lines; measurable homes' shift/event lines are "pending"
}

export async function commitPlan(plan: PlanCommit): Promise<CommitResult> {
  return post<CommitResult>("/api/plan", { householdId: HOUSEHOLD_ID, flags: [], ...plan });
}

// Jordan's own status: points, pending vs. settled lines, settlement, TOU comparison. Polled every 5 s.
export async function getMe(): Promise<MyStatus> {
  return get<MyStatus>(`/api/me?householdId=${HOUSEHOLD_ID}`);
}

// A non-JSON body (e.g. a dev-server error page) becomes "Request failed (404)", not a parse error.
async function read<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);
  if (!res.ok || data === null) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

async function get<T>(url: string): Promise<T> {
  return read<T>(await fetch(url));
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return read<T>(res);
}
