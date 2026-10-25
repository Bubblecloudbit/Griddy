// lib/exchange.ts — the GridShift ↔ AEP data feed, simulated in memory (owner: A). PLAN.md §7a
//
//   Customer app ─plan─▶ API ─▶ plan_submissions (pseudonymous id, area, tier, 24 h planned kWh)
//                          ├─ aggregate (≥5 homes) ─▶ AEP forecast feed + "Download forecast CSV"
//   AEP meter data (AMI) ──┴─▶ meter_reads ─▶ settlement ─▶ settlements ─▶ points back to customers
//
// Production would be a database plus AEP's meter data system. AEP never reads these tables
// directly: it only calls aggregate endpoints (the existing ≥5-homes rule).
import type { FlexTask, Hour, Household, IntakeStats } from "@/lib/types";
import { DEMO_NOW, PLAN_DAY, isoDate } from "@/lib/config";
import { hashString } from "@/lib/community";
import { addTaskLoad } from "@/lib/optimizer";
import { MIN_GROUP_SIZE, applyFlags, neighborhoodForecast, planArea } from "@/lib/forecast";
import { isVerified } from "@/lib/points";
import {
  getMeterReads, getNeighborhood, getPlanSubmissions, householdsIn, listNeighborhoods, setPlanSubmissions,
  type MeterRead, type PlanSubmission,
} from "@/lib/store";

const DAY_HOURS = Array.from({ length: 24 }, (_, c) => PLAN_DAY * 24 + c);

// Short, stable, non-reversible id: "p-3fa9c2e1". No names, no addresses.
export function pseudonymId(householdId: string): string {
  return `p-${hashString(`gridshift:${householdId}`).toString(16).padStart(8, "0")}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// The home's planned load for the plan day, hour by hour.
function plannedDay(home: Household, startOf: (t: FlexTask) => Hour): number[] {
  const load = applyFlags(home.baselineKW, home.flags);
  for (const t of home.tasks) addTaskLoad(load, t, startOf(t));
  return DAY_HOURS.map((h) => round2(load[h]));
}

function submissionRow(home: Household, startOf: (t: FlexTask) => Hour, receivedHour: number): PlanSubmission {
  return {
    pseudonymId: pseudonymId(home.id),
    areaId: home.neighborhoodId,
    tier: home.setup?.verification ?? "none",
    receivedHour,
    plannedKWh24: plannedDay(home, startOf),
  };
}

// Seeded homes that are already enrolled submitted their plans earlier on Sunday (8 AM–5 PM).
function submissions(): PlanSubmission[] {
  const existing = getPlanSubmissions();
  if (existing) return existing;
  const rows: PlanSubmission[] = [];
  for (const n of listNeighborhoods()) {
    const area = planArea(n, true);
    const startOf = (t: FlexTask) => area.startOf.get(t) ?? t.earliestStart;
    for (const home of area.homes.filter((h) => h.enrolled)) {
      rows.push(submissionRow(home, startOf, 8 + (hashString(home.id) % 10)));
    }
  }
  rows.sort((a, b) => a.receivedHour - b.receivedHour);
  setPlanSubmissions(rows);
  return rows;
}

// Written on every /api/plan commit, stamped with "now" on the demo clock.
export function recordSubmission(home: Household): void {
  const rows = submissions();
  const area = planArea(getNeighborhood(home.neighborhoodId)!, true);
  rows.push(submissionRow(home, (t) => area.startOf.get(t) ?? t.earliestStart, DEMO_NOW));
}

// One meter_reads row from settlement's simulated actuals (24 values for the plan day).
export function meterReadRow(home: Household, kWh: number[]): MeterRead {
  return {
    pseudonymId: pseudonymId(home.id),
    day: PLAN_DAY,
    source: home.setup?.verification === "device" ? "Device (simulated)" : "AMI (simulated)",
    kWh: kWh.map(round2),
  };
}

export function intakeStats(): IntakeStats {
  const rows = submissions();
  const latestTier = new Map(rows.map((r) => [r.pseudonymId, r.tier])); // last row per home wins
  const verified = Array.from(latestTier.values()).filter((t) => isVerified(t)).length;
  return {
    plansReceived: rows.length,
    verifiedSharePct: latestTier.size ? Math.round((verified / latestTier.size) * 100) : 0,
    lastReceivedHour: rows.length ? Math.max(...rows.map((r) => r.receivedHour)) : null,
    meterReads: getMeterReads().length,
  };
}

// The aggregate AEP would download: one row per area × hour (72 h). Areas under 5 homes are left out.
export function forecastCsv(scope: string): string {
  const areas = listNeighborhoods().filter((n) => scope === "region" || n.id === scope);
  const lines = ["area,hour,baseline_kw,expected_kw,verified_only_kw,planned_kw,homes,verified_homes"];
  for (const n of areas) {
    const f = neighborhoodForecast(n, true);
    if (f.homeCount < MIN_GROUP_SIZE) continue;
    const verifiedHomes = householdsIn(n.id).filter((h) => h.enrolled && isVerified(h.setup?.verification)).length;
    f.baselineKW.forEach((b, h) => {
      const hour = `${isoDate(Math.floor(h / 24))}T${String(h % 24).padStart(2, "0")}:00`;
      lines.push([n.name, hour, b, f.expectedKW![h], f.verifiedOnlyKW![h], f.plannedKW[h], f.homeCount, verifiedHomes].join(","));
    });
  }
  return lines.join("\n") + "\n";
}
