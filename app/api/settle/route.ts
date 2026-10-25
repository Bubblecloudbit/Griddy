// POST /api/settle (owner: A) — "Simulate Monday's meter reads" (demo). PHASE4.md §3.2.
// Request: { day: 1 } (only the plan day)  →  SettlementSummary. Idempotent; /api/reset clears it.
import { NextResponse } from "next/server";
import { PLAN_DAY } from "@/lib/config";
import { settlePlanDay } from "@/lib/settlement";
import { BadRequest, errorResponse, readJson } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const body = await readJson(req).catch(() => ({}));
    const day = body?.day ?? PLAN_DAY;
    if (day !== PLAN_DAY) return errorResponse(`only the plan day (day ${PLAN_DAY}, Mon Oct 26) can be settled`);
    return NextResponse.json(settlePlanDay());
  } catch (e) {
    if (e instanceof BadRequest) return errorResponse(e.message);
    throw e;
  }
}
