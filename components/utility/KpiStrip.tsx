// components/utility/KpiStrip.tsx — four headline numbers on the AEP Overview (DESIGN.md §6.1, BUILD.md C4, owner: C)
// One divided band (like a market-data strip), not four floating cards.
// Polls /api/summary every 5 s; numbers ease to new values in 300 ms.
"use client";

import type { ReactNode } from "react";
import { AnimatedNumber, Stat, formatInt, formatPct } from "@/components/ui";
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

  // Phase 4: the headline peak number is the confidence-weighted "expected" forecast.
  const expectedPct = data.peakReductionExpectedPct ?? data.peakReductionPct;
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
        label="Verified homes"
        value={<AnimatedNumber value={data.verifiedHomes ?? 0} format={formatInt} />}
        delta={<><AnimatedNumber value={data.verifiedSharePct ?? 0} format={(n) => `${Math.round(n)}%`} /> of enrolled · smart meter or device</>}
        tag="SIMULATED"
      />
      <Stat
        bare
        label="Peak-hour load (expected)"
        value={<AnimatedNumber value={expectedPct} format={formatPct} />}
        delta={<>vs. baseline · <AnimatedNumber value={data.peakReductionPct} format={formatPct} /> if every plan is followed</>}
        deltaTone={expectedPct < 0 ? "plan" : "peak"}
        tag="SIMULATED"
        className={expectedPct < 0 ? "!bg-brand-wash" : ""}
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
