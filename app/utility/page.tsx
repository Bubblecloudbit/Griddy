// app/utility/page.tsx — placeholder AEP dashboard (owner: C)
// Renders the neighborhood forecast chart against mock data. The coordination
// toggle, EV slider, region reference chart, and trust panel are C's real build.
"use client";

import { Nav } from "@/components/ui/Nav";
import { ForecastChart } from "@/components/utility/ForecastChart";
import { MOCK_NEIGHBORHOOD_FORECAST } from "@/lib/mock";

export default function UtilityPage() {
  const forecast = MOCK_NEIGHBORHOOD_FORECAST;
  const canDisplay = forecast.homeCount >= 5; // honesty rule: aggregates of 5+ only

  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">AEP Grid View</h1>
        <p className="mt-1 text-sm text-slate-500">
          Forecasted neighborhood load vs. transformer capacity. Data is{" "}
          <span className="font-medium text-amber-700">simulated</span>.
        </p>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              Neighborhood: Oak Hill ({forecast.neighborhoodId})
            </h2>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              Aggregated view — {forecast.homeCount} homes
            </span>
          </div>

          {canDisplay ? (
            <ForecastChart forecast={forecast} />
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">
              Fewer than 5 homes — aggregate hidden for privacy.
            </p>
          )}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Placeholder page (owner C). Neighborhood/region switch, coordination
          toggle, EV slider, region reference chart, and trust panel build on top
          of this.
        </p>
      </div>
    </main>
  );
}
