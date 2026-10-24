// app/utility/page.tsx — AEP dashboard (owner: C)
// Neighborhood/region forecast with transformer limit, region reference (real grid data),
// Flex Event creator, and trust panel. Coordination toggle + EV slider are P2 (not built).
"use client";

import { useCallback, useEffect, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { ForecastChart } from "@/components/utility/ForecastChart";
import { ForecastStatsRow } from "@/components/utility/ForecastStatsRow";
import { RegionReferenceChart } from "@/components/utility/RegionReferenceChart";
import { ScopeSwitch, type ScopeOption } from "@/components/utility/ScopeSwitch";
import { FlexEventPanel } from "@/components/utility/FlexEventPanel";
import { TrustPanel } from "@/components/utility/TrustPanel";
import { fetchEvents, fetchForecast, type Scope } from "@/components/utility/api";
import { getRegionReference } from "@/lib/realdata";
import { MOCK_NEIGHBORHOODS } from "@/lib/mock";
import type { FlexEvent, Forecast } from "@/lib/types";

const MIN_HOMES = 5; // honesty rule: never show groups smaller than this

// TODO (C, after integration): if A adds a neighborhoods endpoint, load names from it.
const SCOPES: ScopeOption[] = [
  ...MOCK_NEIGHBORHOODS.map((n) => ({ id: n.id, name: n.name })),
  { id: "region", name: "Whole region" },
];

function scopeName(scope: Scope): string {
  return SCOPES.find((s) => s.id === scope)?.name ?? scope;
}

function useForecast(scope: Scope) {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchForecast(scope)
      .then((f) => !cancelled && setForecast(f))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [scope]);
  return { forecast, error };
}

function useEvents() {
  const [events, setEvents] = useState<FlexEvent[]>([]);
  const reload = useCallback(() => {
    fetchEvents().then(setEvents).catch(() => setEvents([]));
  }, []);
  useEffect(reload, [reload]);
  return { events, reload };
}

function ForecastCard({ scope, forecast, events }: { scope: Scope; forecast: Forecast; events: FlexEvent[] }) {
  const canDisplay = forecast.homeCount >= MIN_HOMES;
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-800">Forecast load: {scopeName(scope)}</h2>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          Aggregated view, {forecast.homeCount} homes · simulated
        </span>
      </div>
      {canDisplay ? (
        <>
          <ForecastStatsRow forecast={forecast} />
          <div className="mt-4">
            <ForecastChart forecast={forecast} events={events} />
          </div>
        </>
      ) : (
        <p className="py-12 text-center text-sm text-slate-400">
          Fewer than {MIN_HOMES} homes in this group, so the aggregate is hidden for privacy.
        </p>
      )}
    </section>
  );
}

export default function UtilityPage() {
  const [scope, setScope] = useState<Scope>("n1");
  const { forecast, error } = useForecast(scope);
  const { events, reload } = useEvents();
  const reference = getRegionReference();

  return (
    <main className="bg-slate-50 pb-12">
      <Nav />
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AEP Grid View</h1>
            <p className="mt-1 text-sm text-slate-500">
              Committed customer plans turned into a 48-hour load forecast. Community data is{" "}
              <span className="font-medium text-amber-700">simulated</span>.
            </p>
          </div>
          <ScopeSwitch options={SCOPES} value={scope} onChange={setScope} />
        </header>

        {error && <p className="rounded bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        {forecast && <ForecastCard scope={scope} forecast={forecast} events={events} />}

        {scope === "region" && (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Real grid context: AEP zone demand</h2>
            <RegionReferenceChart reference={reference} />
          </section>
        )}

        <FlexEventPanel events={events} onCreated={reload} />
        <TrustPanel />
      </div>
    </main>
  );
}
