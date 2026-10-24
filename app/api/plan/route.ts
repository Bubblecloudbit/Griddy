// POST /api/plan (owner: A) — commit a household's plan to the store.
// Request: { householdId: string, tasks: FlexTask[], flags: LoadFlag[] }
// Response: { points: number }  (the household's new total)  |  { error } with 400 or 404
import { NextResponse } from "next/server";
import { DEFAULT_RATE, HORIZON_HOURS } from "@/lib/rates";
import { InfeasibleTaskError, optimize } from "@/lib/optimizer";
import { commitPlan } from "@/lib/store";
import { BadRequest, errorResponse, parseFlags, parseTasks, readJson } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const tasks = parseTasks(body.tasks);
    const flags = parseFlags(body.flags);
    // Reject tasks that can't fit their window, so the forecast never breaks later.
    optimize(tasks, new Array(HORIZON_HOURS).fill(0), 1, DEFAULT_RATE, 0);

    const household = commitPlan(String(body.householdId), tasks, flags);
    if (!household) return errorResponse(`unknown household "${body.householdId}"`, 404);
    return NextResponse.json({ points: household.points });
  } catch (e) {
    if (e instanceof BadRequest || e instanceof InfeasibleTaskError) return errorResponse(e.message);
    throw e;
  }
}
