// POST /api/setup (owner: A) — change a household's setup without re-committing a plan.
// Request: { householdId, setup: CustomerSetup }  →  MyStatus  |  { error } 400/404
// If the home already committed (and Monday isn't settled yet), its *pending* estimate is
// redone for the new setup. A setup change never awards settled points, so toggling earns
// nothing; points already settled stay (rewards only, never taken back).
import { NextResponse } from "next/server";
import { myStatus, refreshPending } from "@/lib/rewards";
import { recordSubmission } from "@/lib/exchange";
import { getHousehold, getSettlement } from "@/lib/store";
import { BadRequest, errorResponse, parseSetup, readJson } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    if (!body || typeof body !== "object") return errorResponse("request body must be a JSON object");
    const setup = parseSetup(body.setup);
    if (!setup) return errorResponse("setup is required");
    const home = getHousehold(String(body.householdId));
    if (!home) return errorResponse(`unknown household "${body.householdId}"`, 404);

    home.setup = setup;
    if (home.enrolled) {
      if (!getSettlement(home.id)) refreshPending(home);
      recordSubmission(home); // data feed: AEP's verified share follows the new tier
    }
    return NextResponse.json(myStatus(home));
  } catch (e) {
    if (e instanceof BadRequest) return errorResponse(e.message);
    throw e;
  }
}
