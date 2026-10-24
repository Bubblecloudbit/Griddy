// GET /api/rates (owner: A)
// Response: RatePlan (real AEP Ohio peak window, illustrative prices)
import { NextResponse } from "next/server";
import { DEFAULT_RATE } from "@/lib/rates";

export async function GET() {
  return NextResponse.json(DEFAULT_RATE);
}
