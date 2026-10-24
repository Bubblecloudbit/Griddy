// POST /api/coach — STUB (owner: D, P1)
// Request: { message: string }
// Response: { reply: string, tasks?: FlexTask[], flags?: LoadFlag[] }
import { NextResponse } from "next/server";

export async function POST() {
  // TODO (D): call lib/ai/coach.ts with a rule-based fallback (must work with no API key).
  return NextResponse.json({
    reply:
      "Coach stub — rule-based fallback and Claude integration land in P1 (owner D). Numbers are illustrative.",
  });
}
