// POST /api/reset (owner: A, BUILD.md A9) — restore the seeded demo state.
// Clears all plans, trips, points, and Flex Events. Response: { ok: true }
// Customer tabs keep their own on-screen state, so reload them after a reset.
import { NextResponse } from "next/server";
import { resetStore } from "@/lib/store";

export async function POST() {
  resetStore();
  return NextResponse.json({ ok: true });
}
