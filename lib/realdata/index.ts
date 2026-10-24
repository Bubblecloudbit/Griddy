// lib/realdata/index.ts — Region reference loader (owner: D)
// Returns the real PJM/EIA snapshot for C's region chart, or the mock until one exists.
//
// Synchronous and browser-safe on purpose: the snapshot is a static JSON import that
// gets bundled into the page, so C's "use client" utility page can call this directly.
// Never use fs or fetch here, and never call PJM/EIA live (see design.md §6).
import type { RegionReference } from "@/lib/types";
import { MOCK_REGION_REFERENCE } from "@/lib/mock";
// Snapshot made by scripts/convert.mjs (see scripts/README.md). PJM 7-day AEP forecast retrieved
// Oct 24, trimmed to start Sun Oct 25 so hour index 0 is the same real day as the demo clock.
// Set SNAPSHOT to null to fall back to the mock.
import snapshot from "@/data/real/pjm_aep_forecast_7d.json";

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
