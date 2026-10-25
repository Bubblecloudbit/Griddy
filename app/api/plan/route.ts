// POST /api/plan (owner: A) — commit a household's plan to the store.
// Request: { householdId, tasks: FlexTask[], flags?: LoadFlag[], trips?: Trip[], routine?: WeeklyRoutine,
//            eventIds?: string[], setup?: CustomerSetup }
//   trips / routine / setup left out = keep the household's current ones. eventIds = Flex Events to join.
// Response: { points (settled total), earned (settled by this commit), lines: PointsLine[] (this commit;
//             verified homes' shift and event lines are "pending" until settlement) }  |  { error } 400/404
import { NextResponse } from "next/server";
import { DEFAULT_RATE, HORIZON_HOURS } from "@/lib/rates";
import { InfeasibleTaskError, optimize } from "@/lib/optimizer";
import { UnknownEventError, commitPlan } from "@/lib/store";
import { awardCommit } from "@/lib/rewards";
import { recordSubmission } from "@/lib/exchange";
import { total } from "@/lib/points";
import {
  BadRequest, errorResponse, parseEventIds, parseFlags, parseRoutine, parseSetup, parseTasks, parseTrips, readJson,
} from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const plan = {
      tasks: parseTasks(body.tasks),
      flags: parseFlags(body.flags),
      trips: parseTrips(body.trips),
      routine: parseRoutine(body.routine),
      eventIds: parseEventIds(body.eventIds),
      setup: parseSetup(body.setup),
    };
    // Reject tasks that can't fit their window, so the forecast never breaks later.
    optimize(plan.tasks, new Array(HORIZON_HOURS).fill(0), 1, DEFAULT_RATE, 0);

    const household = commitPlan(String(body.householdId), plan);
    if (!household) return errorResponse(`unknown household "${body.householdId}"`, 404);
    const lines = awardCommit(household);
    recordSubmission(household); // data feed: plan_submissions (pseudonymous)
    return NextResponse.json({ points: household.points, earned: total(lines.filter((l) => l.status === "settled")), lines });
  } catch (e) {
    if (e instanceof BadRequest || e instanceof InfeasibleTaskError) return errorResponse(e.message);
    if (e instanceof UnknownEventError) return errorResponse(e.message, 404);
    throw e;
  }
}
