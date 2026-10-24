// GET /api/forecast?scope=<neighborhoodId|region>&coordinated=<true|false> (owner: A)
// Response: Forecast (aggregates only, homeCount >= 5)  |  { error } with 404 or 403
import { NextRequest, NextResponse } from "next/server";
import { MIN_GROUP_SIZE, neighborhoodForecast, regionForecast } from "@/lib/forecast";
import { getNeighborhood } from "@/lib/store";
import { errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic"; // reads the live store; never cache

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope") ?? "n1";
  const coordinated = req.nextUrl.searchParams.get("coordinated") !== "false"; // default: true

  let forecast;
  if (scope === "region") {
    forecast = regionForecast(coordinated);
  } else {
    const n = getNeighborhood(scope);
    if (!n) return errorResponse(`unknown scope "${scope}"`, 404);
    forecast = neighborhoodForecast(n, coordinated);
  }

  if (forecast.homeCount < MIN_GROUP_SIZE) {
    return errorResponse(`fewer than ${MIN_GROUP_SIZE} homes; aggregate hidden for privacy`, 403);
  }
  return NextResponse.json(forecast);
}
