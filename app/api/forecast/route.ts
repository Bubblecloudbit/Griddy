// GET /api/forecast?scope=<neighborhoodId|region>&coordinated=<true|false> — STUB (owner: A)
// Response: Forecast (aggregates only, homeCount >= 5)
import { NextRequest, NextResponse } from "next/server";
import { MOCK_NEIGHBORHOOD_FORECAST, MOCK_REGION_FORECAST } from "@/lib/mock";

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope") ?? "n1";
  // TODO (A): aggregate the real community from lib/store.ts.
  const forecast = scope === "region" ? MOCK_REGION_FORECAST : MOCK_NEIGHBORHOOD_FORECAST;
  return NextResponse.json(forecast);
}
