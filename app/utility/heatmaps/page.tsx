// app/utility/heatmaps/page.tsx — Heat maps (DESIGN.md §6.2, BUILD.md C7–C8, owner: C)
// Area × hour (C7): 12 areas on Mon Oct 26. Day × hour (C8): all areas, Sun Oct 25 – Sat Oct 31,
// Tue–Sat projected. Change (vs. baseline) is the default metric: it's the persuasive view.
"use client";

import { useCallback, useState } from "react";
import { Card, InfoTip, Segmented, Tag } from "@/components/ui";
import { DEFAULT_RATE } from "@/lib/rates";
import { PLAN_DAY, dayLabel, isWeekend } from "@/lib/config";
import type { Heatmap } from "@/lib/types";
import { fetchHeatmap } from "@/components/utility/api";
import { usePolling } from "@/components/utility/usePolling";
import { HeatmapGrid, type PeakOutline } from "@/components/utility/HeatmapGrid";
import { HeatmapLegend } from "@/components/utility/HeatmapLegend";
import { biggestShift, tripTakeaway } from "@/components/utility/heatmapMath";
import { clockRange } from "@/components/utility/hours";

type View = Heatmap["view"];
type Metric = Heatmap["metric"];

const FIRST_PROJECTED_DAY = 2; // Tue: Sun–Mon are scheduled, Tue–Sat projected (lib/outlook.ts)
const TRIP_DAYS: [number, number] = [4, 6]; // Thu Oct 29 – Sat Oct 31: the seeded trips (lib/community.ts)
const PEAK_COLS: [number, number] = [Math.min(...DEFAULT_RATE.peakHours), Math.max(...DEFAULT_RATE.peakHours)];

const EXPLAINER: Record<View, string> = {
  area_hour: `Each row is one area on ${dayLabel(PLAN_DAY)}. Each cell = 5+ homes.`,
  day_hour: "All 12 areas combined, one row per day. Tue–Sat are projected from routines and planned trips.",
};

// Weekday rows only: the peak doesn't apply on weekends.
function peakOutline(view: View, rowCount: number): PeakOutline | null {
  if (view === "area_hour") return { cols: PEAK_COLS, rows: [0, rowCount - 1] };
  const weekdays = Array.from({ length: rowCount }, (_, d) => d).filter((d) => !isWeekend(d * 24));
  return weekdays.length ? { cols: PEAK_COLS, rows: [weekdays[0], weekdays[weekdays.length - 1]] } : null;
}

function useHeatmaps(view: View) {
  // Both metrics, so the hover tooltip can show planned kW and % change together.
  const load = useCallback(() => Promise.all([fetchHeatmap(view, "load"), fetchHeatmap(view, "change")]), [view]);
  return usePolling(load);
}

export default function HeatmapsPage() {
  const [view, setView] = useState<View>("area_hour");
  const [metric, setMetric] = useState<Metric>("change");
  const { data, error } = useHeatmaps(view);
  const [loadMap, changeMap] = data ?? [null, null];

  const takeaway =
    loadMap && changeMap
      ? view === "area_hour"
        ? biggestShift(loadMap.values, changeMap.values, loadMap.rows, clockRange)
        : tripTakeaway(loadMap.values, changeMap.values, TRIP_DAYS[0], TRIP_DAYS[1], "Thu–Sat")
      : null;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1">Heat maps</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<View>
            ariaLabel="View"
            options={[
              { value: "area_hour", label: "Area × hour" },
              { value: "day_hour", label: "Day × hour" },
            ]}
            value={view}
            onChange={setView}
          />
          <Segmented<Metric>
            ariaLabel="Metric"
            options={[
              { value: "load", label: "Load" },
              { value: "change", label: "Change" },
            ]}
            value={metric}
            onChange={setMetric}
          />
        </div>
      </header>

      <Card
        title="Where and when residential load is planned"
        explainer={EXPLAINER[view]}
        action={
          <>
            <Tag kind="SIMULATED" />
            <InfoTip>
              Change compares committed GridShift plans with a baseline where everyone runs things when they get home.
              Teal means load moved away from that hour; amber means load was added.
            </InfoTip>
          </>
        }
      >
        {!loadMap || !changeMap ? (
          error ? (
            <p className="text-body text-danger">{error.message}</p>
          ) : (
            <div className="h-96 animate-pulse rounded-control bg-paper" aria-label="Loading heat map" />
          )
        ) : (
          <div className="space-y-4">
            <HeatmapGrid
              metric={metric}
              rows={loadMap.rows}
              cols={loadMap.cols}
              load={loadMap.values}
              change={changeMap.values}
              projectedFrom={view === "day_hour" ? FIRST_PROJECTED_DAY : undefined}
              peak={peakOutline(view, loadMap.rows.length)}
              tooltipRowLabel={(r) => (view === "area_hour" ? `${loadMap.rows[r]} · ${dayLabel(PLAN_DAY).slice(0, 3)}` : loadMap.rows[r])}
            />
            <HeatmapLegend metric={metric} load={loadMap.values} change={changeMap.values} />
            {takeaway && <p className="border-t border-line pt-3 text-body text-ink">▸ {takeaway}</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
