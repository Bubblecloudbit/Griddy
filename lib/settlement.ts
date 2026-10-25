// lib/settlement.ts — "Simulate Monday's meter reads" (owner: A). PHASE4.md §3.2, step by step.
// Settles the plan day for every enrolled home that AEP can measure. All reads are SIMULATED,
// seeded per home id, so every demo run gives identical numbers. Self-reported homes aren't settled.
import type { FlexEvent, FlexTask, Hour, Household, PointsLine, Settlement, SettlementSummary, TierResult, Verification } from "@/lib/types";
import { PLAN_DAY } from "@/lib/config";
import { DEMO_HOUSEHOLD_ID, hashString, mulberry32 } from "@/lib/community";
import { meterReadRow } from "@/lib/exchange";
import { addTaskLoad } from "@/lib/optimizer";
import { MIN_GROUP_SIZE, applyFlags, planArea } from "@/lib/forecast";
import { peakShiftKWh, verifiableTasks } from "@/lib/rewards";
import { accuracyLine, capLines, isVerified, settledEventLine, settledShiftLine, total } from "@/lib/points";
import { rangeText } from "@/lib/reasons";
import {
  addMeterReads, getEvent, getLedger, getSettlementSummary, listNeighborhoods, saveSettlement, setLedger, type MeterRead,
} from "@/lib/store";

const USAGE_NOISE = 0.05; // ±5% on non-flexible load in the simulated meter read
const BASELINE_DAYS = 10; // prior weekdays simulated for the customer baseline
const BASELINE_TOP = 3; // average of the 3 highest (simplified from Ameren's Peak Time Rewards)
const BASELINE_NOISE = 0.15; // ±15% day-to-day variation in those prior weekdays
const RELIABILITY_KEEP = 0.7; // R ← 0.7·R + 0.3·adherence

const DAY_HOURS = Array.from({ length: 24 }, (_, c) => PLAN_DAY * 24 + c);

function jitter(rng: () => number, spread: number): number {
  return 1 + (rng() * 2 - 1) * spread;
}

// What the meter sees, per hour of the horizon: a smart meter sees the whole home, a
// connected device only its own runs.
function meterRead(home: Household, startOf: (t: FlexTask) => Hour, noise: () => number): number[] {
  const wholeHome = home.setup?.verification === "smart_meter";
  const base = wholeHome ? applyFlags(home.baselineKW, home.flags).map((v) => v * noise()) : home.baselineKW.map(() => 0);
  for (const t of verifiableTasks(home)) addTaskLoad(base, t, startOf(t));
  return base;
}

function windowSum(curve: number[], from: Hour, to: Hour): number {
  let sum = 0;
  for (let h = from; h < to; h++) sum += curve[h] ?? 0;
  return sum;
}

// Customer baseline for an event window: 10 simulated prior weekdays of normal use
// (every task at plug-in), average of the 3 highest.
function customerBaseline(home: Household, e: FlexEvent, rng: () => number): number {
  const days = Array.from({ length: BASELINE_DAYS }, () =>
    windowSum(meterRead(home, (t) => t.earliestStart, () => jitter(rng, BASELINE_NOISE)), e.startHour, e.endHour),
  );
  const top = days.sort((a, b) => b - a).slice(0, BASELINE_TOP);
  return top.reduce((s, v) => s + v, 0) / top.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Settles one measurable home: simulated actuals, delivered shift, event reduction, points.
// Also returns the simulated meter read (the data feed's meter_reads table).
function settleHome(home: Household, plannedStart: (t: FlexTask) => Hour): { settlement: Settlement; read: MeterRead } {
  const rng = mulberry32(hashString(`${home.id}:${PLAN_DAY}`));
  const reliability = home.reliability ?? 0.8;
  const onPlan = home.id === DEMO_HOUSEHOLD_ID; // Jordan always follows the plan, so the demo is predictable

  // 1. Each flexible task follows the plan with probability R, otherwise snaps back to plug-in.
  const follows = new Map(verifiableTasks(home).map((t) => [t, onPlan || rng() < reliability]));
  const actualStart = (t: FlexTask) => (follows.get(t) ? plannedStart(t) : t.earliestStart);
  const actual = meterRead(home, actualStart, () => jitter(rng, USAGE_NOISE));

  // 3. Delivered shift and adherence.
  const measurable = verifiableTasks(home);
  const plannedShiftKWh = peakShiftKWh(measurable, plannedStart);
  const deliveredShiftKWh = peakShiftKWh(measurable, actualStart);
  const adherence = plannedShiftKWh > 0 ? Math.min(1, Math.max(0, deliveredShiftKWh / plannedShiftKWh)) : 1;

  // 2. Flex Event reduction vs. the customer baseline (first joined event on the plan day).
  const event = (home.eventIds ?? []).map(getEvent).find((e): e is FlexEvent => !!e && DAY_HOURS.includes(e.startHour));
  let eventResult: Settlement["event"];
  if (event) {
    const baselineKWh = customerBaseline(home, event, rng);
    const actualKWh = windowSum(actual, event.startHour, event.endHour);
    eventResult = { eventId: event.id, baselineKWh: round1(baselineKWh), actualKWh: round1(actualKWh), reducedKWh: round1(Math.max(0, baselineKWh - actualKWh)) };
  }

  // 5. Points (rules in lib/points.ts), capped with what the day already holds.
  const earned: PointsLine[] = [settledShiftLine(deliveredShiftKWh)];
  if (event && eventResult) earned.push(settledEventLine(eventResult.reducedKWh, event.multiplier, rangeText(event.startHour, event.endHour)));
  const bonus = accuracyLine(total(earned), adherence);
  if (bonus) earned.push(bonus);
  const kept = getLedger(home.id).filter((l) => l.status === "settled");
  const lines = capLines(earned, total(kept));
  setLedger(home.id, [...kept, ...lines]); // pending estimates are replaced by measured lines
  home.points += total(lines);

  // 4. Reliability update: history makes trust.
  home.reliability = round2(RELIABILITY_KEEP * reliability + (1 - RELIABILITY_KEEP) * adherence);

  const settlement: Settlement = {
    householdId: home.id,
    day: PLAN_DAY,
    verification: home.setup!.verification,
    plannedShiftKWh: round1(plannedShiftKWh),
    deliveredShiftKWh: round1(deliveredShiftKWh),
    adherence: round2(adherence),
    event: eventResult,
    points: lines,
  };
  return { settlement, read: meterReadRow(home, DAY_HOURS.map((h) => actual[h])) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptyTiers(): Record<Verification, TierResult> {
  return { smart_meter: { homes: 0, plannedKWh: 0, deliveredKWh: 0 }, device: { homes: 0, plannedKWh: 0, deliveredKWh: 0 }, none: { homes: 0, plannedKWh: 0, deliveredKWh: 0 } };
}

export const UNSETTLED: SettlementSummary = {
  day: PLAN_DAY, settled: false, homesSettled: 0, byTier: emptyTiers(), deliveredPct: 0, eventReducedKWh: 0, pointsIssued: 0, reliabilityByArea: [],
};

// Settles the plan day once; calling again returns the same summary (reset clears it).
export function settlePlanDay(): SettlementSummary {
  const existing = getSettlementSummary();
  if (existing) return existing;

  const settlements: Settlement[] = [];
  const reads: MeterRead[] = [];
  const byTier = emptyTiers();
  const reliabilityByArea: SettlementSummary["reliabilityByArea"] = [];

  for (const n of listNeighborhoods()) {
    const area = planArea(n, true);
    const plannedStart = (t: FlexTask) => area.startOf.get(t) ?? t.earliestStart;
    for (const home of area.homes.filter((h) => h.enrolled)) {
      const tier = home.setup?.verification ?? "none";
      if (!isVerified(tier)) {
        byTier.none.homes += 1;
        byTier.none.plannedKWh += peakShiftKWh(home.tasks, plannedStart); // planned, but not measurable
        continue;
      }
      const { settlement: s, read } = settleHome(home, plannedStart);
      settlements.push(s);
      reads.push(read);
      byTier[tier].homes += 1;
      byTier[tier].plannedKWh += s.plannedShiftKWh;
      byTier[tier].deliveredKWh += s.deliveredShiftKWh;
    }
    const verified = area.homes.filter((h) => h.enrolled && isVerified(h.setup?.verification));
    if (verified.length >= MIN_GROUP_SIZE) {
      const avg = verified.reduce((s, h) => s + (h.reliability ?? 0), 0) / verified.length;
      reliabilityByArea.push({ areaId: n.id, name: n.name, homes: verified.length, avgReliability: round2(avg) });
    }
  }

  for (const t of Object.values(byTier)) {
    t.plannedKWh = round1(t.plannedKWh);
    t.deliveredKWh = round1(t.deliveredKWh);
  }
  const planned = byTier.smart_meter.plannedKWh + byTier.device.plannedKWh;
  const delivered = byTier.smart_meter.deliveredKWh + byTier.device.deliveredKWh;
  const summary: SettlementSummary = {
    day: PLAN_DAY,
    settled: true,
    homesSettled: settlements.length,
    byTier,
    deliveredPct: planned > 0 ? Math.round((delivered / planned) * 100) : 0,
    eventReducedKWh: round1(settlements.reduce((s, x) => s + (x.event?.reducedKWh ?? 0), 0)),
    pointsIssued: settlements.reduce((s, x) => s + total(x.points), 0),
    reliabilityByArea,
  };
  saveSettlement(settlements, summary);
  addMeterReads(reads);
  return summary;
}
