// POST /api/simulate — STUB (owner: A). Deferred to P2: leave as a stub until P0 is done.
// Request: { evAdoption: number, coordinated: boolean }
// Response: Forecast (region-level, regenerated community)
import { NextResponse } from "next/server";
import { MOCK_REGION_FORECAST } from "@/lib/mock";

export async function POST() {
  // TODO (A): regenerate the community with evAdoption and re-run the optimizer.
  return NextResponse.json(MOCK_REGION_FORECAST);
}
