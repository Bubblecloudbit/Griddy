// lib/summary.ts — KPI strip numbers for the AEP overview (owner: A)
// Region-wide aggregates only (480 homes), so nothing here identifies a household.
import type { FlexEvent, Household, Summary, Trip } from "@/lib/types";
import { OUTLOOK_DAYS, isoDate } from "@/lib/config";
import { regionForecast } from "@/lib/forecast";
import { listEvents, listHouseholds } from "@/lib/store";
import { isVerified } from "@/lib/points";

const WEEK_START = isoDate(0); // "2026-10-25"
const WEEK_END = isoDate(OUTLOOK_DAYS - 1); // "2026-10-31"

// ISO dates compare correctly as strings.
function tripInWeek(t: Trip): boolean {
  return t.startDate <= WEEK_END && t.endDate >= WEEK_START;
}

function committedKWh(homes: Household[]): number {
  return homes.filter((h) => h.enrolled).reduce((sum, h) => sum + h.tasks.reduce((s, t) => s + t.kWh, 0), 0);
}

// The event that starts soonest; there's no live clock in the demo.
function nextEvent(events: FlexEvent[]): FlexEvent | null {
  return events.reduce<FlexEvent | null>((first, e) => (!first || e.startHour < first.startHour ? e : first), null);
}

export function computeSummary(): Summary {
  const homes = listHouseholds();
  const region = regionForecast(true);
  const baseline = region.peakKWhBaseline ?? 0;
  const planned = region.peakKWhPlanned ?? 0;
  const expected = region.peakKWhExpected ?? planned;
  const enrolled = homes.filter((h) => h.enrolled);
  const verified = enrolled.filter((h) => isVerified(h.setup?.verification));
  const pct = (a: number) => (baseline > 0 ? Math.round(((a - baseline) / baseline) * 1000) / 10 : 0);

  return {
    verifiedHomes: verified.length,
    verifiedSharePct: enrolled.length ? Math.round((verified.length / enrolled.length) * 100) : 0,
    peakReductionExpectedPct: pct(expected),
    enrolledHomes: enrolled.length,
    committedFlexKWh: Math.round(committedKWh(homes)),
    peakReductionPct: baseline > 0 ? Math.round(((planned - baseline) / baseline) * 1000) / 10 : 0,
    peakKWhShifted: Math.round(baseline - planned),
    homesAwayThisWeek: homes.filter((h) => (h.trips ?? []).some(tripInWeek)).length,
    nextEvent: nextEvent(listEvents()),
  };
}
