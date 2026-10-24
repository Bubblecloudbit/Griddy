// GET /api/heatmap?view=area_hour|day_hour&metric=load|change (owner: A)
// Response: Heatmap (null cells = hidden, fewer than 5 homes)  |  { error } with 400
// area_hour is live (A6). day_hour is still mock data until BUILD.md A8.
import { NextRequest, NextResponse } from "next/server";
import { areaHourHeatmap } from "@/lib/heatmap";
import { mockHeatmap } from "@/lib/mock";
import { errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic"; // reads the live store; never cache

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view") ?? "area_hour";
  const metric = req.nextUrl.searchParams.get("metric") ?? "change";
  if (view !== "area_hour" && view !== "day_hour") return errorResponse('view must be "area_hour" or "day_hour"');
  if (metric !== "load" && metric !== "change") return errorResponse('metric must be "load" or "change"');
  // TODO (A8): day_hour from the 72 h forecast (Sun, Mon) + routines and trips (Tue–Sat).
  return NextResponse.json(view === "area_hour" ? areaHourHeatmap(metric) : mockHeatmap(view, metric));
}
