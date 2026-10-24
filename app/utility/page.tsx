// app/utility/page.tsx — AEP dashboard Overview (DESIGN.md §6.1, owner: C)
// Shell (app switcher, sidebar, top bar) comes from app/utility/layout.tsx.
// KPI strip (C4) → projected load chart, "the proof" (C5) → zone context (C6) + next Flex Event.
// Creating events lives on A's /utility/events page (A10); privacy details on /methodology (D).
"use client";

import { useState } from "react";
import { KpiStrip } from "@/components/utility/KpiStrip";
import { ProjectedLoadChart } from "@/components/utility/ProjectedLoadChart";
import { ZoneContextChart } from "@/components/utility/ZoneContextChart";
import { NextEventCard } from "@/components/utility/NextEventCard";
import { ResetDemoLink } from "@/components/utility/ResetDemoLink";
import type { Scope } from "@/components/utility/api";

export default function OverviewPage() {
  const [scope, setScope] = useState<Scope>("region");

  return (
    <div className="space-y-6">
      <h1 className="text-h1">Overview</h1>
      <KpiStrip />
      <ProjectedLoadChart scope={scope} onScopeChange={setScope} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ZoneContextChart />
        </div>
        <NextEventCard />
      </div>
      <ResetDemoLink />
    </div>
  );
}
