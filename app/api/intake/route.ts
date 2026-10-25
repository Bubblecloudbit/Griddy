// GET /api/intake (owner: A) — data feed counters for the AEP "Data feed" page. Aggregates only.
// Response: IntakeStats { plansReceived, verifiedSharePct, lastReceivedHour (demo clock), meterReads }
import { NextResponse } from "next/server";
import { intakeStats } from "@/lib/exchange";

export const dynamic = "force-dynamic"; // reads the live store; never cache

export async function GET() {
  return NextResponse.json(intakeStats());
}
