// components/utility/KpiStrip.tsx — four headline numbers on the AEP Overview (DESIGN.md §6.1, BUILD.md C4, owner: C)
// Polls /api/summary every 5 s; numbers ease to new values in 300 ms.
"use client";

import { AnimatedNumber, Stat, formatInt, formatKWh, formatPct } from "@/components/ui";
import { fetchSummary } from "./api";
import { usePolling } from "./usePolling";

function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Loading KPIs">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[116px] animate-pulse rounded-card border border-line bg-surface" />
      ))}
    </div>
  );
}

export function KpiStrip() {
  const { data, error } = usePolling(fetchSummary);

  if (!data) {
    return error ? <p className="text-body text-danger">{error}</p> : <Skeleton />;
  }

  const lessPeak = data.peakReductionPct < 0;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        label="Enrolled homes"
        value={<AnimatedNumber value={data.enrolledHomes} format={formatInt} />}
        delta="opted in to share plans"
        tag="SIMULATED"
      />
      <Stat
        label="Flexible load"
        value={<AnimatedNumber value={data.committedFlexKWh} format={formatKWh} />}
        delta="committed in plans"
        tag="SIMULATED"
      />
      <Stat
        label="Peak-hour load"
        value={<AnimatedNumber value={data.peakReductionPct} format={formatPct} />}
        delta={<>vs. baseline · <AnimatedNumber value={data.peakKWhShifted} format={formatKWh} /> moved</>}
        deltaTone={lessPeak ? "plan" : "peak"}
        tag="SIMULATED"
      />
      <Stat
        label="Homes away this week"
        value={<AnimatedNumber value={data.homesAwayThisWeek} format={formatInt} />}
        delta="from planned trips"
        tag="SIMULATED"
      />
    </div>
  );
}
