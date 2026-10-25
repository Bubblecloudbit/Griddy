// lib/points.ts — the GridPoints rules (owner: A). PLAN.md §7a; explainable on one slide.
// Pure functions: numbers in, PointsLine out. Every constant is listed on /methodology.
// Rewards only, never penalties. Points are never converted to dollars in the UI.
import type { PointsLine, Verification } from "@/lib/types";

export const COMMIT_POINTS = 5; // per commit, max one per day
export const CONTRIBUTION_PER_KWH = 1; // self-reported homes only, per kWh planned out of peak
export const CONTRIBUTION_MAX = 15; // per commit
export const VERIFIED_PER_KWH = 10; // per kWh delivered out of the peak window (measured)
export const EVENT_PER_KWH = 5; // × the event multiplier, per kWh reduced vs. the customer baseline
export const ACCURACY_BONUS = 0.2; // +20% of the day's verified points…
export const ACCURACY_THRESHOLD = 0.8; // …when at least 80% of the planned shift was delivered
export const DAILY_CAP = 300;

export function isVerified(v: Verification | undefined): boolean {
  return v === "smart_meter" || v === "device";
}

function kwh(n: number): string {
  return `${Math.round(n * 10) / 10} kWh`;
}

function line(rule: PointsLine["rule"], label: string, points: number, detail: string, status: PointsLine["status"]): PointsLine {
  return { rule, label, points: Math.round(points), detail, status };
}

// --- At commit -------------------------------------------------------------

export function commitLine(): PointsLine {
  return line("commit", "Commit", COMMIT_POINTS, "Plan committed (once per day)", "settled");
}

export function contributionLine(plannedPeakKWh: number): PointsLine {
  const pts = Math.min(CONTRIBUTION_MAX, plannedPeakKWh * CONTRIBUTION_PER_KWH);
  return line("contribution", "Contribution", pts, `${kwh(plannedPeakKWh)} planned out of peak × ${CONTRIBUTION_PER_KWH} (max ${CONTRIBUTION_MAX}), self-reported`, "settled");
}

// Pending estimates for measurable homes: settle after the meter read, and can differ.
export function pendingShiftLine(plannedPeakKWh: number): PointsLine {
  return line("verified_shift", "Verified shift", plannedPeakKWh * VERIFIED_PER_KWH, `${kwh(plannedPeakKWh)} planned out of 2–6 PM × ${VERIFIED_PER_KWH}`, "pending");
}

export function pendingEventLine(plannedEventKWh: number, multiplier: number, window: string): PointsLine {
  return line("event", "Flex Event", plannedEventKWh * EVENT_PER_KWH * multiplier, `${kwh(plannedEventKWh)} planned out of ${window} × ${EVENT_PER_KWH} × ${multiplier}`, "pending");
}

// --- At settlement (measured) ----------------------------------------------

export function settledShiftLine(deliveredKWh: number): PointsLine {
  return line("verified_shift", "Verified shift", deliveredKWh * VERIFIED_PER_KWH, `${kwh(deliveredKWh)} delivered out of 2–6 PM × ${VERIFIED_PER_KWH}`, "settled");
}

export function settledEventLine(reducedKWh: number, multiplier: number, window: string): PointsLine {
  return line("event", "Flex Event", reducedKWh * EVENT_PER_KWH * multiplier, `${kwh(reducedKWh)} reduced vs. your baseline in ${window} × ${EVENT_PER_KWH} × ${multiplier}`, "settled");
}

export function accuracyLine(verifiedPoints: number, adherence: number): PointsLine | null {
  if (adherence < ACCURACY_THRESHOLD || verifiedPoints <= 0) return null;
  return line("accuracy_bonus", "Accuracy bonus", verifiedPoints * ACCURACY_BONUS, `${Math.round(adherence * 100)}% of plan delivered → +${ACCURACY_BONUS * 100}%`, "settled");
}

// Trims lines (in order) so the day's total never passes DAILY_CAP. `usedToday` = points
// already on the books for the day (settled and pending).
export function capLines(lines: PointsLine[], usedToday: number): PointsLine[] {
  let room = Math.max(0, DAILY_CAP - usedToday);
  return lines.map((l) => {
    const pts = Math.min(l.points, room);
    room -= pts;
    return pts === l.points ? l : { ...l, points: pts, detail: `${l.detail} (daily cap ${DAILY_CAP})` };
  });
}

export function total(lines: PointsLine[]): number {
  return lines.reduce((sum, l) => sum + l.points, 0);
}
