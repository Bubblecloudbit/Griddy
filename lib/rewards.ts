// lib/rewards.ts — turn a commit into points lines (owner: A). PLAN.md §7a
// Uses the area's actual schedule, so "planned out of peak" matches what the forecast shows.
import type { FlexEvent, FlexTask, Hour, Household, MyStatus, PointsLine } from "@/lib/types";
import { DEFAULT_RATE } from "@/lib/rates";
import { energyCost, peakKWh, windowKWh } from "@/lib/optimizer";
import { planArea } from "@/lib/forecast";
import { getEvent, getLedger, getNeighborhood, getSettlement, setLedger } from "@/lib/store";
import {
  capLines, commitLine, contributionLine, isVerified, pendingEventLine, pendingShiftLine, total,
} from "@/lib/points";
import { rangeText } from "@/lib/reasons";

// Tasks a home's measurement can see: a smart meter sees everything, a connected
// device only its own runs (the EV charger), self-reported nothing.
export function verifiableTasks(home: Household): FlexTask[] {
  const v = home.setup?.verification;
  if (v === "smart_meter") return home.tasks;
  if (v === "device") return home.tasks.filter((t) => t.appliance === "ev");
  return [];
}

// kWh moved out of the 2–6 PM window, plug-in vs. a given start for each task.
export function peakShiftKWh(tasks: FlexTask[], startOf: (t: FlexTask) => Hour): number {
  return tasks.reduce((sum, t) => sum + peakKWh(t, t.earliestStart, DEFAULT_RATE) - peakKWh(t, startOf(t), DEFAULT_RATE), 0);
}

// kWh moved out of a Flex Event window, plug-in vs. a given start.
export function eventShiftKWh(tasks: FlexTask[], startOf: (t: FlexTask) => Hour, e: FlexEvent): number {
  return tasks.reduce(
    (sum, t) => sum + windowKWh(t, t.earliestStart, e.startHour, e.endHour) - windowKWh(t, startOf(t), e.startHour, e.endHour),
    0,
  );
}

// The household's planned start for each task, from the area's coordinated schedule.
export function plannedStarts(home: Household): (t: FlexTask) => Hour {
  const area = planArea(getNeighborhood(home.neighborhoodId)!, true);
  return (t) => area.startOf.get(t) ?? t.earliestStart;
}

// The customer's own status for the app (GET /api/me). Only this home's data.
export function myStatus(home: Household): MyStatus {
  const ledger = getLedger(home.id);
  return {
    points: home.points,
    setup: home.setup,
    reliability: isVerified(home.setup?.verification) ? home.reliability : undefined,
    pending: ledger.filter((l) => l.status === "pending"),
    history: ledger.filter((l) => l.status === "settled"),
    settlement: getSettlement(home.id),
    touComparison: home.tasks.length ? touComparison(home) : undefined,
  };
}

// Illustrative: this plan's monthly cost on the flat standard rate vs. on time-of-use
// with GridShift's start times (plan × 30 days).
function touComparison(home: Household): { flatMonthly: number; touMonthly: number } {
  const startOf = plannedStarts(home);
  const flatRate = DEFAULT_RATE.flatRate ?? DEFAULT_RATE.offPeak;
  const flat = home.tasks.reduce((s, t) => s + t.kWh * flatRate, 0);
  const tou = home.tasks.reduce((s, t) => s + energyCost(t, startOf(t), DEFAULT_RATE), 0);
  return { flatMonthly: Math.round(flat * 30 * 100) / 100, touMonthly: Math.round(tou * 30 * 100) / 100 };
}

// Awards a commit: commit points (once a day), contribution for self-reported homes,
// pending verified-shift and Flex Event estimates for measurable homes. Replaces any
// earlier pending estimate. Returns this commit's lines; settled ones are added to points.
export function awardCommit(home: Household): PointsLine[] {
  const kept = getLedger(home.id).filter((l) => l.status === "settled"); // drop the old pending estimate
  const startOf = plannedStarts(home);

  const lines: PointsLine[] = [];
  if (!kept.some((l) => l.rule === "commit")) lines.push(commitLine());
  if (!isVerified(home.setup?.verification)) {
    if (!kept.some((l) => l.rule === "contribution")) lines.push(contributionLine(peakShiftKWh(home.tasks, startOf)));
  } else {
    lines.push(...pendingLines(home, startOf, kept));
  }

  const capped = capLines(lines, total(kept)).filter((l) => l.points > 0 || l.rule === "commit");
  home.points += total(capped.filter((l) => l.status === "settled"));
  setLedger(home.id, [...kept, ...capped]);
  return capped;
}

// Pending estimates for a measurable home. A self-reported contribution already earned for
// the same plan is subtracted from the shift estimate, so the same kWh is never paid twice.
function pendingLines(home: Household, startOf: (t: FlexTask) => Hour, kept: PointsLine[]): PointsLine[] {
  const measurable = verifiableTasks(home);
  const shift = pendingShiftLine(peakShiftKWh(measurable, startOf));
  const already = total(kept.filter((l) => l.rule === "contribution"));
  const lines = [already ? { ...shift, points: Math.max(0, shift.points - already), detail: `${shift.detail}, minus ${already} contribution already earned` } : shift];
  for (const e of (home.eventIds ?? []).map(getEvent).filter((e): e is FlexEvent => !!e)) {
    lines.push(pendingEventLine(eventShiftKWh(measurable, startOf, e), e.multiplier, rangeText(e.startHour, e.endHour)));
  }
  return lines;
}

// A setup change after a commit (POST /api/setup): replace the pending estimate for the new
// tier. Never awards settled points, so switching back and forth can't earn anything.
export function refreshPending(home: Household): void {
  const kept = getLedger(home.id).filter((l) => l.status === "settled");
  const pending = isVerified(home.setup?.verification) ? pendingLines(home, plannedStarts(home), kept) : [];
  setLedger(home.id, [...kept, ...capLines(pending, total(kept)).filter((l) => l.points > 0)]);
}
