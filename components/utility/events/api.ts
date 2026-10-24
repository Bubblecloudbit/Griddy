// components/utility/events/api.ts — Flex events page data (owner: A, BUILD.md A10)
import type { FlexEvent, Forecast, Summary } from "@/lib/types";

export type NewFlexEvent = Omit<FlexEvent, "id" | "optedIn">;

// Shows the API's own error message ("needs startHour < endHour …") instead of a status code.
export async function createFlexEvent(event: NewFlexEvent): Promise<FlexEvent> {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Create event failed (${res.status})`);
  return data;
}

export interface EventsView {
  events: FlexEvent[];
  forecast: Forecast; // region, 72 h
  enrolledHomes: number;
}

// One poll for everything the list needs.
export async function loadEventsView(): Promise<EventsView> {
  const [events, forecast, summary] = await Promise.all([
    fetch("/api/events", { cache: "no-store" }).then((r) => r.json() as Promise<FlexEvent[]>),
    fetch("/api/forecast?scope=region", { cache: "no-store" }).then((r) => r.json() as Promise<Forecast>),
    fetch("/api/summary", { cache: "no-store" }).then((r) => r.json() as Promise<Summary>),
  ]);
  return { events, forecast, enrolledHomes: summary.enrolledHomes };
}

// Simulated estimate of kWh opted-in homes keep out of the event window: the average
// enrolled home's planned reduction in that window, times homes opted in.
export function estimateShiftedKWh(event: FlexEvent, forecast: Forecast, enrolledHomes: number): number {
  if (!event.optedIn || enrolledHomes === 0) return 0;
  let reduction = 0;
  for (let h = event.startHour; h < event.endHour; h++) {
    reduction += (forecast.baselineKW[h] ?? 0) - (forecast.plannedKW[h] ?? 0);
  }
  return Math.max(0, (reduction / enrolledHomes) * event.optedIn);
}
