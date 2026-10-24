// lib/store.ts — in-memory store, seeded from the synthetic community (owner: A)
// Lives on globalThis so dev hot reloads and separate API routes share one copy.
// Single-machine demo only: state resets when the server restarts.
import type { FlexEvent, FlexTask, Household, LoadFlag, Neighborhood, Trip, WeeklyRoutine } from "@/lib/types";
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

export interface PlanInput {
  tasks: FlexTask[];
  flags: LoadFlag[];
  trips?: Trip[]; // undefined = keep the household's current trips
  routine?: WeeklyRoutine; // undefined = keep the current routine
  eventIds: string[]; // Flex Events to join with this commit
}

export class UnknownEventError extends Error {}

// Replaces the household's plan, enrolls it (its tasks get optimized in the forecast from
// now on), and awards points. Joining Flex Events multiplies this commit's points by the
// highest multiplier among the newly joined events, and counts the home once per event.
// Returns the updated household and the points this commit earned.
export function commitPlan(householdId: string, plan: PlanInput): { household: Household; earned: number } | undefined {
  const household = getHousehold(householdId);
  if (!household) return undefined;

  const joined = household.eventIds ?? [];
  const newEvents = plan.eventIds.filter((id) => !joined.includes(id)).map((id) => {
    const event = state().events.find((e) => e.id === id);
    if (!event) throw new UnknownEventError(`unknown Flex Event "${id}"`);
    return event;
  });

  household.tasks = plan.tasks;
  household.flags = plan.flags;
  if (plan.trips) household.trips = plan.trips;
  if (plan.routine) household.routine = plan.routine;
  household.enrolled = true;
  household.eventIds = [...joined, ...newEvents.map((e) => e.id)];
  for (const e of newEvents) e.optedIn = (e.optedIn ?? 0) + 1;

  const multiplier = Math.max(1, ...newEvents.map((e) => e.multiplier));
  const earned = Math.round(COMMIT_POINTS * multiplier);
  household.points += earned;
  return { household, earned };
}

export function listEvents(): FlexEvent[] {
  return state().events;
}

export function createEvent(input: Omit<FlexEvent, "id">): FlexEvent {
  const s = state();
  const event: FlexEvent = { id: `fe${s.nextEventId++}`, optedIn: 0, ...input };
  s.events.push(event);
  return event;
}
