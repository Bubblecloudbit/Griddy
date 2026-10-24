// POST /api/optimize — STUB (owner: A)
// Request: { tasks: FlexTask[], neighborhoodId: string, coordinated: boolean }
// Response: ScheduledTask[]
import { NextResponse } from "next/server";
import { MOCK_TASKS } from "@/lib/mock";

export async function POST() {
  // TODO (A): run lib/optimizer.ts against the real community load.
  return NextResponse.json(MOCK_TASKS);
}
