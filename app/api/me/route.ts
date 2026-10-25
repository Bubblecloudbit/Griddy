// GET /api/me?householdId=h-jordan (owner: A) — the customer's own status (customer app only).
// Response: MyStatus (points, setup, reliability, pending/settled lines, settlement, TOU comparison) | { error } 404
import { NextRequest, NextResponse } from "next/server";
import { myStatus } from "@/lib/rewards";
import { getHousehold } from "@/lib/store";
import { errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic"; // reads the live store; never cache

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("householdId") ?? "h-jordan";
  const home = getHousehold(id);
  if (!home) return errorResponse(`unknown household "${id}"`, 404);
  return NextResponse.json(myStatus(home));
}
