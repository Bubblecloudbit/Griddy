// POST /api/setup (owner: A) — change a household's setup without re-committing a plan.
// Request: { householdId, setup: CustomerSetup }  →  MyStatus  |  { error } 400/404
// If the home already committed a plan (and Monday isn't settled yet), its pending points are
// recalculated for the new setup. Points already settled stay: rewards only, never taken back.
import { NextResponse } from "next/server";
import { awardCommit, myStatus } from "@/lib/rewards";
import { getHousehold, getSettlement } from "@/lib/store";
import { BadRequest, errorResponse, parseSetup, readJson } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const setup = parseSetup(body.setup);
    if (!setup) return errorResponse("setup is required");
    const home = getHousehold(String(body.householdId));
    if (!home) return errorResponse(`unknown household "${body.householdId}"`, 404);

    home.setup = setup;
    if (home.enrolled && !getSettlement(home.id)) awardCommit(home); // refresh pending for the new tier
    return NextResponse.json(myStatus(home));
  } catch (e) {
    if (e instanceof BadRequest) return errorResponse(e.message);
    throw e;
  }
}
