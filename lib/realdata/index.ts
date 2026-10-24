// lib/realdata/index.ts — Region reference loader (owner: D)
// Real PJM snapshots for C's zone context card: the 7-day forecast and last week's metered load.
//
// Synchronous and browser-safe on purpose: the snapshot is a static JSON import that
// gets bundled into the page, so C's "use client" utility page can call this directly.
// Never use fs or fetch here, and never call PJM/EIA live (see design.md §6).
import type { RegionReference } from "@/lib/types";
import { MOCK_REGION_REFERENCE } from "@/lib/mock";
// Snapshots made by scripts/convert.mjs (see scripts/README.md).
// Forecast: PJM 7-day AEP forecast retrieved Oct 24, trimmed to start Sun Oct 25 so hour index 0
// is the same real day as the demo clock. Set SNAPSHOT to null to fall back to the mock.
import snapshot from "@/data/real/pjm_aep_forecast_7d.json";
// Last week: PJM metered AEP load, Fri Oct 16 – Thu Oct 22 (the last full week posted on Oct 24).
import lastWeek from "@/data/real/pjm_aep_load_week.json";

const SNAPSHOT: unknown = snapshot;

const MAX_HOURS = 7 * 24; // the PJM 7-day forecast (DATA.md §2)

const isNumberArray = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every((x) => typeof x === "number" && Number.isFinite(x));

// Catches a bad snapshot in dev instead of letting the chart render garbage.
function checkSnapshot(data: unknown): RegionReference {
  const ref = data as RegionReference;
  const hours = ref?.demandMW?.length ?? 0;
  const problems = [
    typeof ref?.label !== "string" && "label",
    typeof ref?.source !== "string" && "source",
    typeof ref?.date !== "string" && "date",
    (!isNumberArray(ref?.demandMW) || hours < 24 || hours > MAX_HOURS) && `demandMW (24–${MAX_HOURS} numbers)`,
    ref?.hours !== undefined &&
      (!Array.isArray(ref.hours) || ref.hours.length !== hours || !ref.hours.every((t) => typeof t === "string")) &&
      "hours (one ISO timestamp per demandMW value)",
    ref?.forecastMW !== undefined && (!isNumberArray(ref.forecastMW) || ref.forecastMW.length !== hours) && "forecastMW",
    ref?.priceUSDperMWh !== undefined &&
      (!isNumberArray(ref.priceUSDperMWh) || ref.priceUSDperMWh.length !== hours) &&
      "priceUSDperMWh",
  ].filter(Boolean);

  if (problems.length > 0) {
    throw new Error(`Region snapshot doesn't match RegionReference: ${problems.join(", ")}`);
  }
  return ref;
}

export function getRegionReference(): RegionReference {
  return SNAPSHOT === null ? MOCK_REGION_REFERENCE : checkSnapshot(SNAPSHOT);
}

// "Last week: actual" view for the zone card (DATA.md §3): real daily shape with the weekend dip.
// Hour index 0 is Fri Oct 16, NOT the demo clock, so label the axis from `hours`, not hour index.
export function getLastWeekLoad(): RegionReference {
  return checkSnapshot(lastWeek);
}
