// GET /api/export?scope=region|n1…n12 (owner: A) — "Download forecast CSV" for AEP.
// Response: text/csv, one row per area × hour: area, hour, baseline, expected, verifiedOnly,
// planned (kW), homes, verifiedHomes. Areas under 5 homes are never included. Simulated data.
import { NextRequest } from "next/server";
import { forecastCsv } from "@/lib/exchange";
import { getNeighborhood } from "@/lib/store";
import { errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic"; // reads the live store; never cache

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope") ?? "region";
  if (scope !== "region" && !getNeighborhood(scope)) return errorResponse(`unknown scope "${scope}"`, 404);
  return new Response(forecastCsv(scope), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gridshift-forecast-${scope}-simulated.csv"`,
    },
  });
}
