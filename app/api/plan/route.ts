// POST /api/plan — STUB (owner: A)
// Request: { householdId: string, tasks: FlexTask[], flags: LoadFlag[] }
// Response: { points: number }
import { NextResponse } from "next/server";

export async function POST() {
  // TODO (A): persist to lib/store.ts and award GridPoints.
  return NextResponse.json({ points: 10 });
}
