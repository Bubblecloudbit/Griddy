// components/utility/api.ts — the only place the AEP view talks to the backend (owner: C)
// Routes are owned by A. While they are stubs they return lib/mock.ts data,
// so this file does not change when the real engine lands.
import type { FlexEvent, Forecast } from "@/lib/types";

export type Scope = string; // a neighborhood id ("n1") or "region"

export async function fetchForecast(scope: Scope, coordinated = true): Promise<Forecast> {
  const res = await fetch(`/api/forecast?scope=${scope}&coordinated=${coordinated}`);
  if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
  return res.json();
}

export async function fetchEvents(): Promise<FlexEvent[]> {
  const res = await fetch("/api/events");
  if (!res.ok) throw new Error(`Events request failed (${res.status})`);
  return res.json();
}

export type NewFlexEvent = Omit<FlexEvent, "id">;

export async function createEvent(event: NewFlexEvent): Promise<FlexEvent> {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Create event failed (${res.status})`);
  return res.json();
}
