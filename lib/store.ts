// lib/store.ts — in-memory store, seeded from the synthetic community (owner: A)
// Lives on globalThis so dev hot reloads and separate API routes share one copy.
// Single-machine demo only: state resets when the server restarts.
import type {
  CustomerSetup, FlexEvent, FlexTask, Household, LoadFlag, Neighborhood, PointsLine, Settlement, SettlementSummary, Trip, Verification, WeeklyRoutine,
} from "@/lib/types";
import { generateCommunity } from "@/lib/community";

interface StoreState {
  households: Map<string, Household>;
  neighborhoods: Neighborhood[];
  events: FlexEvent[];
  nextEventId: number;
  ledger: Map<string, PointsLine[]>; // Phase 4: each home's points lines for the demo day (pending + settled)
  settlements: Map<string, Settlement>; // Phase 4: one per settled home (plan day)
  settlementSummary: SettlementSummary | null; // Phase 4: null until "Simulate Monday's meter reads"
  planSubmissions: PlanSubmission[] | null; // Phase 4 data feed; null until first read (seeded lazily)
  meterReads: MeterRead[]; // Phase 4 data feed; written by settlement
}

// Data feed tables (PHASE4.md §5). Pseudonymous: no names, no addresses. AEP never reads
// these directly; it only sees aggregates of 5+ homes.
export interface PlanSubmission {
  pseudonymId: string;
  areaId: string;
  tier: Verification;
  receivedHour: number; // demo clock
  plannedKWh24: number[]; // the plan day, hour by hour
}
export interface MeterRead {
  pseudonymId: string;
  day: number;
  source: "AMI (simulated)" | "Device (simulated)";
  kWh: number[]; // the plan day, hour by hour
}

const globalStore = globalThis as unknown as { __gridshiftStore?: StoreState };

function seed(): StoreState {
  const { households, neighborhoods } = generateCommunity();
  return {
    households: new Map(households.map((h) => [h.id, h])),
    neighborhoods,
    events: [],
    nextEventId: 1,
    ledger: new Map(),
    settlements: new Map(),
    settlementSummary: null,
    planSubmissions: null,
    meterReads: [],
  };
}

export function getPlanSubmissions(): PlanSubmission[] | null {
  return state().planSubmissions;
}

export function setPlanSubmissions(rows: PlanSubmission[]): void {
  state().planSubmissions = rows;
}

export function getMeterReads(): MeterRead[] {
  return state().meterReads;
}

export function addMeterReads(rows: MeterRead[]): void {
  state().meterReads.push(...rows);
}

function state(): StoreState {
  if (!globalStore.__gridshiftStore) globalStore.__gridshiftStore = seed();
  return globalStore.__gridshiftStore;
}

// Demo reset (BUILD.md A9): throw away every commit, trip, and event and re-seed (seed 42),
// so two run-throughs in a row start from the exact same numbers.
export function resetStore(): void {
  globalStore.__gridshiftStore = seed();
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
  setup?: CustomerSetup; // undefined = keep the current setup
}

export class UnknownEventError extends Error {}

// Replaces the household's plan, enrolls it (its tasks get optimized in the forecast from
// now on), and counts it once per newly joined Flex Event. Points are awarded separately
// (lib/rewards.ts) because they depend on the area's schedule.
export function commitPlan(householdId: string, plan: PlanInput): Household | undefined {
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
  if (plan.setup) household.setup = plan.setup;
  household.enrolled = true;
  household.eventIds = [...joined, ...newEvents.map((e) => e.id)];
  for (const e of newEvents) e.optedIn = (e.optedIn ?? 0) + 1;
  return household;
}

export function getLedger(householdId: string): PointsLine[] {
  return state().ledger.get(householdId) ?? [];
}

export function setLedger(householdId: string, lines: PointsLine[]): void {
  state().ledger.set(householdId, lines);
}

export function getSettlement(householdId: string): Settlement | undefined {
  return state().settlements.get(householdId);
}

export function getSettlementSummary(): SettlementSummary | null {
  return state().settlementSummary;
}

export function saveSettlement(settlements: Settlement[], summary: SettlementSummary): void {
  for (const s of settlements) state().settlements.set(s.householdId, s);
  state().settlementSummary = summary;
}

export function getEvent(id: string): FlexEvent | undefined {
  return state().events.find((e) => e.id === id);
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
