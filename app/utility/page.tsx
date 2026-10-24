// app/utility/page.tsx — AEP dashboard Overview (DESIGN.md §6.1, owner: C)
// Shell (app switcher, sidebar, top bar) comes from app/utility/layout.tsx.
// KPI strip (C4) → projected load chart, "the proof" (C5) → zone context (C6) + next Flex Event.
"use client";

import { useCallback, useEffect, useState } from "react";
import { KpiStrip } from "@/components/utility/KpiStrip";
import { ProjectedLoadChart } from "@/components/utility/ProjectedLoadChart";
import { ZoneContextChart } from "@/components/utility/ZoneContextChart";
import { NextEventCard } from "@/components/utility/NextEventCard";
import { FlexEventPanel } from "@/components/utility/FlexEventPanel";
import { TrustPanel } from "@/components/utility/TrustPanel";
import { fetchEvents, type Scope } from "@/components/utility/api";
import type { FlexEvent } from "@/lib/types";

// v1 Flex Event creator stays until A's /utility/events page lands (BUILD.md A10), then it goes.
function useEvents() {
  const [events, setEvents] = useState<FlexEvent[]>([]);
  const reload = useCallback(() => {
    fetchEvents().then(setEvents).catch(() => setEvents([]));
  }, []);
  useEffect(reload, [reload]);
  return { events, reload };
}

export default function OverviewPage() {
  const [scope, setScope] = useState<Scope>("region");
  const { events, reload } = useEvents();

  return (
    <div className="space-y-6">
      <h1 className="text-h1">Overview</h1>
      <KpiStrip />
      <ProjectedLoadChart scope={scope} onScopeChange={setScope} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ZoneContextChart />
        </div>
        <NextEventCard />
      </div>
      <FlexEventPanel events={events} onCreated={reload} />
      <TrustPanel />
    </div>
  );
}
