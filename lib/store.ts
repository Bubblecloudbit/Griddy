// lib/store.ts — in-memory store, seeded from the synthetic community (owner: A)
// Lives on globalThis so dev hot reloads and separate API routes share one copy.
// Single-machine demo only: state resets when the server restarts.
import type { FlexEvent, FlexTask, Household, LoadFlag, Neighborhood } from "@/lib/types";
import { generateCommunity } from "@/lib/community";

export const COMMIT_POINTS = 10; // P0: flat GridPoints per committed plan

interface StoreState {
  households: Map<string, Household>;
  neighborhoods: Neighborhood[];
  events: FlexEvent[];
  nextEventId: number;
}

const globalStore = globalThis as unknown as { __gridshiftStore?: StoreState };

function seed(): StoreState {
  const { households, neighborhoods } = generateCommunity();
  return {
    households: new Map(households.map((h) => [h.id, h])),
    neighborhoods,
    events: [],
    nextEventId: 1,
  };
}

function state(): StoreState {
  if (!globalStore.__gridshiftStore) globalStore.__gridshiftStore = seed();
  return globalStore.__gridshiftStore;
}

export function listNeighborhoods(): Neighborhood[] {
  return state().neighborhoods;
}

export function getNeighborhood(id: string): Neighborhood | undefined {
  return state().neighborhoods.find((n) => n.id === id);
}

export function getHousehold(id: string): Household | undefined {
  return state().households.get(id);
}

export function listHouseholds(): Household[] {
  return Array.from(state().households.values());
}

export function householdsIn(neighborhoodId: string): Household[] {
  const n = getNeighborhood(neighborhoodId);
  return n ? n.homeIds.map((id) => state().households.get(id)!) : [];
}

// Replaces the household's plan, enrolls it (its tasks get optimized in the forecast from
// now on), and awards points. Returns the updated household.
export function commitPlan(householdId: string, tasks: FlexTask[], flags: LoadFlag[]): Household | undefined {
  const household = getHousehold(householdId);
  if (!household) return undefined;
  household.tasks = tasks;
  household.flags = flags;
  household.enrolled = true;
  household.points += COMMIT_POINTS;
  return household;
}

export function listEvents(): FlexEvent[] {
  return state().events;
}

export function createEvent(input: Omit<FlexEvent, "id">): FlexEvent {
  const s = state();
  const event: FlexEvent = { id: `fe${s.nextEventId++}`, ...input };
  s.events.push(event);
  return event;
}
