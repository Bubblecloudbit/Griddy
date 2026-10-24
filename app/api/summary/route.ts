// GET /api/summary (owner: A)
// Response: Summary (KPI strip on the AEP overview; region-wide aggregates, simulated)
//   peakReductionPct / peakKWhShifted refer to Mon Oct 26, 2–6 PM, planned vs. baseline.
import { NextResponse } from "next/server";
import { computeSummary } from "@/lib/summary";

export const dynamic = "force-dynamic"; // reads the live store; never cache

export async function GET() {
  return NextResponse.json(computeSummary());
}
