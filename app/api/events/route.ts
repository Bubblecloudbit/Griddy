// GET/POST /api/events (owner: A) — Flex Events created by the utility.
// GET  Response: FlexEvent[]  (empty until the utility creates one)
// POST Request:  { startHour, endHour, multiplier, message } -> FlexEvent  |  { error } with 400
import { NextResponse } from "next/server";
import { createEvent, listEvents } from "@/lib/store";
import { BadRequest, errorResponse, parseEvent, readJson } from "@/lib/validate";

export const dynamic = "force-dynamic"; // reads the live store; never cache

export async function GET() {
  return NextResponse.json(listEvents());
}

export async function POST(req: Request) {
  try {
    return NextResponse.json(createEvent(parseEvent(await readJson(req))));
  } catch (e) {
    if (e instanceof BadRequest) return errorResponse(e.message);
    throw e;
  }
}
