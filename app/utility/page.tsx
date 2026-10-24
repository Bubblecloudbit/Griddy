// app/utility/page.tsx — AEP dashboard Overview (owner: C)
// Shell (app switcher, sidebar, top bar) comes from app/utility/layout.tsx (C3).
// The cards below are the v1 versions; C4–C6 replace them with the KPI strip,
// projected load chart, and zone context card from DESIGN.md §6.1.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, EmptyState, Tag } from "@/components/ui";
import { ForecastChart } from "@/components/utility/ForecastChart";
import { ForecastStatsRow } from "@/components/utility/ForecastStatsRow";
import { RegionReferenceChart } from "@/components/utility/RegionReferenceChart";
import { AreaPicker, areaName } from "@/components/utility/AreaPicker";
import { FlexEventPanel } from "@/components/utility/FlexEventPanel";
import { TrustPanel } from "@/components/utility/TrustPanel";
import { ApiError, fetchEvents, fetchForecast, type Scope } from "@/components/utility/api";
import { getRegionReference } from "@/lib/realdata";
import type { FlexEvent, Forecast } from "@/lib/types";

const MIN_HOMES = 5; // privacy rule: never show groups smaller than this
const PRIVACY_MESSAGE = "Hidden for privacy (fewer than 5 homes).";

type ForecastState =
  | { status: "loading" }
  | { status: "ok"; forecast: Forecast }
  | { status: "hidden" } // API returned 403
  | { status: "error"; message: string };

function useForecast(scope: Scope): ForecastState {
  const [state, setState] = useState<ForecastState>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetchForecast(scope)
      .then((forecast) => !cancelled && setState({ status: "ok", forecast }))
      .catch((e: Error) => {
        if (cancelled) return;
        const hidden = e instanceof ApiError && e.status === 403;
        setState(hidden ? { status: "hidden" } : { status: "error", message: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);
  return state;
}

function useEvents() {
  const [events, setEvents] = useState<FlexEvent[]>([]);
  const reload = useCallback(() => {
    fetchEvents().then(setEvents).catch(() => setEvents([]));
  }, []);
  useEffect(reload, [reload]);
  return { events, reload };
}

function ForecastBody({ state, events }: { state: ForecastState; events: FlexEvent[] }) {
  if (state.status === "loading") return <div className="h-80 animate-pulse rounded-control bg-paper" />;
  if (state.status === "error") return <p className="text-body text-danger">{state.message}</p>;
  if (state.status === "hidden" || state.forecast.homeCount < MIN_HOMES) return <EmptyState message={PRIVACY_MESSAGE} />;
  return (
    <>
      <ForecastStatsRow forecast={state.forecast} />
      <div className="mt-4">
        <ForecastChart forecast={state.forecast} events={events} />
      </div>
    </>
  );
}

export default function OverviewPage() {
  const [scope, setScope] = useState<Scope>("region");
  const forecast = useForecast(scope);
  const { events, reload } = useEvents();
  const reference = getRegionReference();
  const homes = forecast.status === "ok" ? `${forecast.forecast.homeCount} homes` : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-h1">Overview</h1>
        <AreaPicker value={scope} onChange={setScope} />
      </header>

      <Card
        title={`Projected residential load · ${areaName(scope)}`}
        explainer={`kW${homes ? `, ${homes} combined` : ""}. Baseline = everyone runs things when they get home. Planned = committed GridShift plans.`}
        action={<Tag kind="SIMULATED" />}
      >
        <ForecastBody state={forecast} events={events} />
      </Card>

      <Card
        title="AEP zone context · PJM"
        explainer="What AEP already forecasts for the whole zone, in MW. GridShift adds what customers plan to do."
        action={<Tag kind="REAL" />}
      >
        <RegionReferenceChart reference={reference} />
      </Card>

      <FlexEventPanel events={events} onCreated={reload} />
      <TrustPanel />
    </div>
  );
}
