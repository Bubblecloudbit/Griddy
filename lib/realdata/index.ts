// lib/realdata/index.ts — STUB (owner: D)
// Returns the mock RegionReference until real PJM/EIA JSON snapshots are added to data/real/.
//
// Synchronous and browser-safe on purpose: the snapshot is a static JSON import that
// gets bundled into the page, so C's "use client" utility page can call this directly.
// Never use fs or fetch here, and never call PJM/EIA live (see design.md §6).
import type { RegionReference } from "@/lib/types";
import { MOCK_REGION_REFERENCE } from "@/lib/mock";
// TODO (D): once scripts/ has produced a snapshot, swap the mock for it:
// import snapshot from "@/data/real/pjm-aep-2024-10-15.json";

export function getRegionReference(): RegionReference {
  // TODO (D): return snapshot as RegionReference;
  return MOCK_REGION_REFERENCE;
}
