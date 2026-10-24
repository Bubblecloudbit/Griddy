// POST /api/optimize (owner: A) — recommend start times, no save.
// Request: { tasks: FlexTask[], neighborhoodId: string, coordinated: boolean }
// Response: ScheduledTask[]  |  { error } with 400 (bad input / no feasible window) or 404
import { NextResponse } from "next/server";
import { DEFAULT_RATE } from "@/lib/rates";
import { COORDINATED_LAMBDA, InfeasibleTaskError, optimize } from "@/lib/optimizer";
import { neighborhoodForecast } from "@/lib/forecast";
import { getNeighborhood } from "@/lib/store";
import { BadRequest, errorResponse, parseTasks, readJson } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const tasks = parseTasks(body.tasks);
    const n = getNeighborhood(body.neighborhoodId ?? "n1");
    if (!n) return errorResponse(`unknown neighborhood "${body.neighborhoodId}"`, 404);
    const coordinated = body.coordinated !== false; // default: coordinated

    // Schedule against the neighborhood's current planned load, so the customer's tasks
    // steer around hours the rest of the neighborhood has already claimed.
    const neighborhoodLoad = neighborhoodForecast(n, coordinated).plannedKW;
    const lambda = coordinated ? COORDINATED_LAMBDA : 0;
    return NextResponse.json(optimize(tasks, neighborhoodLoad, n.transformerCapacityKW, DEFAULT_RATE, lambda));
  } catch (e) {
    if (e instanceof BadRequest || e instanceof InfeasibleTaskError) return errorResponse(e.message);
    throw e;
  }
}
