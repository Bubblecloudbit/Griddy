// components/utility/api.ts — the only place the AEP view talks to the backend (owner: C)
// Routes are owned by A (real engine since v1 integration).
import type { Forecast, Heatmap, IntakeStats, SettlementSummary, Summary } from "@/lib/types";

export type Scope = string; // a neighborhood id ("n1") or "region"

export async function fetchForecast(scope: Scope, coordinated = true): Promise<Forecast> {
  const res = await fetch(`/api/forecast?scope=${scope}&coordinated=${coordinated}`);
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res.json();
}

// API errors come back as { error } (PLAN.md §7). 403 = fewer than 5 homes (privacy).
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

// KPI strip numbers (BUILD.md C4). Polled every 5 s on the Overview.
export async function fetchSummary(): Promise<Summary> {
  const res = await fetch("/api/summary", { cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res.json();
}

// Heat maps (BUILD.md C7–C8). Null cells = hidden for privacy (< 5 homes).
export async function fetchHeatmap(view: Heatmap["view"], metric: Heatmap["metric"]): Promise<Heatmap> {
  const res = await fetch(`/api/heatmap?view=${view}&metric=${metric}`, { cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res.json();
}

// Phase 4: settlement results (settled: false until the demo button is pressed).
export async function fetchSettlement(): Promise<SettlementSummary> {
  const res = await fetch("/api/settlement", { cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res.json();
}

// Phase 4: "Simulate Monday's meter reads" (demo). Idempotent.
export async function settlePlanDay(): Promise<SettlementSummary> {
  const res = await fetch("/api/settle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day: 1 }) });
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res.json();
}

// Phase 4: data feed counters.
export async function fetchIntake(): Promise<IntakeStats> {
  const res = await fetch("/api/intake", { cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res.json();
}
