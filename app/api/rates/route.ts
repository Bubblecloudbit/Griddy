// GET /api/rates (owner: A) — STUB until BUILD.md A2.
// Response: RatePlan (real AEP Ohio peak window, illustrative prices)
import { NextResponse } from "next/server";
import { MOCK_RATE } from "@/lib/mock";

export async function GET() {
  // TODO (A2): return DEFAULT_RATE from lib/rates.ts.
  return NextResponse.json(MOCK_RATE);
}
