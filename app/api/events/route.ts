// GET/POST /api/events — STUB (owner: A)
// GET  Response: FlexEvent[]
// POST Request:  { startHour, endHour, multiplier, message } -> FlexEvent
import { NextResponse } from "next/server";
import { MOCK_FLEX_EVENT } from "@/lib/mock";

export async function GET() {
  // TODO (A): list Flex Events from lib/store.ts.
  return NextResponse.json([MOCK_FLEX_EVENT]);
}

export async function POST() {
  // TODO (A): create and persist a Flex Event.
  return NextResponse.json(MOCK_FLEX_EVENT);
}
