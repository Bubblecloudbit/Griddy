// GET /api/heatmap?view=area_hour|day_hour&metric=load|change (owner: A) — STUB until BUILD.md A6/A8.
// Response: Heatmap  |  { error } with 400
import { NextRequest, NextResponse } from "next/server";
import { mockHeatmap } from "@/lib/mock";
import { errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic"; // will read the live store; never cache

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view") ?? "area_hour";
  const metric = req.nextUrl.searchParams.get("metric") ?? "change";
  if (view !== "area_hour" && view !== "day_hour") return errorResponse('view must be "area_hour" or "day_hour"');
  if (metric !== "load" && metric !== "change") return errorResponse('metric must be "load" or "change"');
  // TODO (A6, A8): aggregate the live community instead of mocks.
  return NextResponse.json(mockHeatmap(view, metric));
}
