// GET /api/summary (owner: A) — STUB until BUILD.md A5.
// Response: Summary (KPI strip on the AEP overview)
import { NextResponse } from "next/server";
import { MOCK_SUMMARY } from "@/lib/mock";

export const dynamic = "force-dynamic"; // will read the live store; never cache

export async function GET() {
  // TODO (A5): compute from lib/store.ts and lib/forecast.ts.
  return NextResponse.json(MOCK_SUMMARY);
}
