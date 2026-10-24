// POST /api/plan (owner: A) — commit a household's plan to the store.
// Request: { householdId, tasks: FlexTask[], flags?: LoadFlag[], trips?: Trip[], routine?: WeeklyRoutine, eventIds?: string[] }
//   trips / routine left out = keep the household's current ones. eventIds = Flex Events to join.
// Response: { points: number (new total), earned: number (this commit, incl. event multiplier) }
//   |  { error } with 400 or 404
import { NextResponse } from "next/server";
import { DEFAULT_RATE, HORIZON_HOURS } from "@/lib/rates";
import { InfeasibleTaskError, optimize } from "@/lib/optimizer";
import { UnknownEventError, commitPlan } from "@/lib/store";
import { BadRequest, errorResponse, parseEventIds, parseFlags, parseRoutine, parseTasks, parseTrips, readJson } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const plan = {
      tasks: parseTasks(body.tasks),
      flags: parseFlags(body.flags),
      trips: parseTrips(body.trips),
      routine: parseRoutine(body.routine),
      eventIds: parseEventIds(body.eventIds),
    };
    // Reject tasks that can't fit their window, so the forecast never breaks later.
    optimize(plan.tasks, new Array(HORIZON_HOURS).fill(0), 1, DEFAULT_RATE, 0);

    const result = commitPlan(String(body.householdId), plan);
    if (!result) return errorResponse(`unknown household "${body.householdId}"`, 404);
    return NextResponse.json({ points: result.household.points, earned: result.earned });
  } catch (e) {
    if (e instanceof BadRequest || e instanceof InfeasibleTaskError) return errorResponse(e.message);
    if (e instanceof UnknownEventError) return errorResponse(e.message, 404);
    throw e;
  }
}
