// GET /api/heatmap?view=area_hour|day_hour&metric=load|change (owner: A)
// Response: Heatmap (null cells = hidden, fewer than 5 homes)  |  { error } with 400
//   area_hour: 12 areas × Mon Oct 26.  day_hour: Oct 25–31, all areas; Tue–Sat rows are projected.
import { NextRequest, NextResponse } from "next/server";
import { areaHourHeatmap, dayHourHeatmap } from "@/lib/heatmap";
import { errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic"; // reads the live store; never cache

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view") ?? "area_hour";
  const metric = req.nextUrl.searchParams.get("metric") ?? "change";
  if (view !== "area_hour" && view !== "day_hour") return errorResponse('view must be "area_hour" or "day_hour"');
  if (metric !== "load" && metric !== "change") return errorResponse('metric must be "load" or "change"');
  return NextResponse.json(view === "area_hour" ? areaHourHeatmap(metric) : dayHourHeatmap(metric));
}
