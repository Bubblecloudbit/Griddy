// GET /api/settlement (owner: A) — the plan day's settlement results (aggregates, ≥5 homes per area row).
// Response: SettlementSummary (settled: false before "Simulate Monday's meter reads").
import { NextResponse } from "next/server";
import { UNSETTLED } from "@/lib/settlement";
import { getSettlementSummary } from "@/lib/store";

export const dynamic = "force-dynamic"; // reads the live store; never cache

export async function GET() {
  return NextResponse.json(getSettlementSummary() ?? UNSETTLED);
}
