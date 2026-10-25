// components/utility/KpiStrip.tsx — four headline numbers on the AEP Overview (DESIGN.md §6.1, BUILD.md C4, owner: C)
// One divided band (like a market-data strip), not four floating cards.
// Polls /api/summary every 5 s; numbers ease to new values in 300 ms.
"use client";

import type { ReactNode } from "react";
import { AnimatedNumber, Stat, formatInt, formatKWh, formatPct } from "@/components/ui";
import { fetchSummary } from "./api";
import { usePolling } from "./usePolling";

// gap-px over a line-colored background draws the dividers at any column count.
const BAND = "grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line xl:grid-cols-4 [&>*]:bg-surface";

function Band({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className={BAND} aria-label={label}>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <Band label="Loading KPIs">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[124px] p-5">
          <div className="h-3 w-24 animate-pulse rounded-tag bg-paper" />
          <div className="mt-4 h-8 w-32 animate-pulse rounded-tag bg-paper" />
        </div>
      ))}
    </Band>
  );
}

export function KpiStrip() {
  const { data, error } = usePolling(fetchSummary);

  if (!data) {
    return error ? <p className="text-body text-danger">{error.message}</p> : <Skeleton />;
  }

  const lessPeak = data.peakReductionPct < 0;
  return (
    <Band>
      <Stat
        bare
        label="Enrolled homes"
        value={<AnimatedNumber value={data.enrolledHomes} format={formatInt} />}
        delta="opted in to share plans"
        tag="SIMULATED"
      />
      <Stat
        bare
        label="Flexible load"
        value={<AnimatedNumber value={data.committedFlexKWh} format={formatKWh} />}
        delta="committed in plans"
        tag="SIMULATED"
      />
      <Stat
        bare
        label="Peak-hour load"
        value={<AnimatedNumber value={data.peakReductionPct} format={formatPct} />}
        delta={<>vs. baseline · <AnimatedNumber value={data.peakKWhShifted} format={formatKWh} /> moved</>}
        deltaTone={lessPeak ? "plan" : "peak"}
        tag="SIMULATED"
        className={lessPeak ? "!bg-brand-wash" : ""}
      />
      <Stat
        bare
        label="Homes away this week"
        value={<AnimatedNumber value={data.homesAwayThisWeek} format={formatInt} />}
        delta="from planned trips"
        tag="SIMULATED"
      />
    </Band>
  );
}
