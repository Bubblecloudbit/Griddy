// lib/realdata/index.ts — STUB (owner: D)
// Returns the mock RegionReference until real PJM/EIA JSON snapshots are added to data/real/.
import type { RegionReference } from "@/lib/types";
import { MOCK_REGION_REFERENCE } from "@/lib/mock";

export async function getRegionReference(): Promise<RegionReference> {
  // TODO (D): load a snapshot from data/real/*.json produced by scripts/.
  return MOCK_REGION_REFERENCE;
}
