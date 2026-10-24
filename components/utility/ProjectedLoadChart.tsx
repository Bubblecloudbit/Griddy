// components/utility/ProjectedLoadChart.tsx — "the proof" (DESIGN.md §6.1, BUILD.md C5, owner: C)
// Monday only (hours 24–47): dashed gray baseline vs. teal planned area, 2–6 PM peak band,
// direct line labels, and the callout "Peak-hour load −X% (Y kWh moved)".
// Polls /api/forecast every 5 s so the callout moves after Jordan commits.
"use client";

import { useCallback } from "react";
import { Area, CartesianGrid, ComposedChart, LabelList, Line, ReferenceArea, Tooltip, XAxis, YAxis } from "recharts";
import {
  ChartFrame,
  ChartTooltip,
  InfoTip,
  Tag,
  axisProps,
  chartColors,
  endLabel,
  formatInt,
  formatKWh,
  formatPct,
  gridProps,
  hourLabel,
  hourTicks,
  peakBandProps,
} from "@/components/ui";
import { PLAN_DAY } from "@/lib/config";
import { DEFAULT_RATE } from "@/lib/rates";
import type { Forecast } from "@/lib/types";
import { ApiError, fetchForecast, type Scope } from "./api";
import { AreaPicker, areaName } from "./AreaPicker";
import { usePolling } from "./usePolling";

const FIRST = PLAN_DAY * 24; // Mon 12 AM = hour 24
const LAST = FIRST + 23; // Mon 11 PM = hour 47
const PEAK_START = FIRST + Math.min(...DEFAULT_RATE.peakHours); // Mon 2 PM
const PEAK_END = FIRST + Math.max(...DEFAULT_RATE.peakHours) + 1; // Mon 6 PM (exclusive)
const PRIVACY_MESSAGE = "Hidden for privacy (fewer than 5 homes).";

function toRows(f: Forecast) {
  const rows = [];
  for (let hour = FIRST; hour <= LAST; hour++) {
    rows.push({ hour, baseline: f.baselineKW[hour], planned: f.plannedKW[hour] });
  }
  return rows;
}

// kWh in the peak window. The API sends these (v2); fall back to summing hourly kW.
function peakKWh(f: Forecast) {
  const sum = (series: number[]) => series.slice(PEAK_START, PEAK_END).reduce((a, b) => a + b, 0);
  return {
    baseline: f.peakKWhBaseline ?? sum(f.baselineKW),
    planned: f.peakKWhPlanned ?? sum(f.plannedKW),
  };
}

function Callout({ forecast }: { forecast: Forecast }) {
  const { baseline, planned } = peakKWh(forecast);
  const pct = baseline > 0 ? ((planned - baseline) / baseline) * 100 : 0;
  const moved = baseline - planned;
  const tone = pct <= 0 ? "text-plan" : "text-peak";
  return (
    <div className="flex items-center justify-between gap-3">
      <span>
        Peak-hour load <span className={`font-mono font-semibold ${tone}`}>{formatPct(pct)}</span>{" "}
        <span className="text-ink-muted">({formatKWh(Math.abs(moved))} {moved >= 0 ? "moved" : "added"}, 2–6 PM)</span>
      </span>
      <Tag kind="SIMULATED" />
    </div>
  );
}

// ResponsiveContainer passes width/height to its direct child, so forward them to the chart.
function Chart({ forecast, width, height }: { forecast: Forecast; width?: number; height?: number }) {
  const rows = toRows(forecast);
  const last = rows.length - 1;
  // Keep the two end labels apart: the line that ends lower gets its label pushed down.
  const plannedLower = rows[last].planned <= rows[last].baseline;
  const [plannedDy, baselineDy] = plannedLower ? [14, -4] : [-4, 14];
  return (
    <ComposedChart width={width} height={height} data={rows} margin={{ top: 20, right: 72, bottom: 0, left: 0 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="hour" type="number" domain={[FIRST, LAST]} ticks={hourTicks(FIRST, LAST)} tickFormatter={hourLabel} {...axisProps} />
      <YAxis width={48} tickFormatter={formatInt} {...axisProps} />
      <ReferenceArea {...peakBandProps(PEAK_START, PEAK_END)} />
      <Tooltip content={<ChartTooltip unit="kW" />} />
      <Area
        type="monotone"
        dataKey="planned"
        name="Planned"
        stroke={chartColors.plan}
        strokeWidth={2}
        fill={chartColors.plan}
        fillOpacity={0.15}
        animationDuration={300}
      >
        <LabelList content={endLabel("Planned", chartColors.plan, last, plannedDy)} />
      </Area>
      <Line
        type="monotone"
        dataKey="baseline"
        name="Baseline"
        stroke={chartColors.baseline}
        strokeDasharray="5 4"
        strokeWidth={2}
        dot={false}
        animationDuration={300}
      >
        <LabelList content={endLabel("Baseline", chartColors.baseline, last, baselineDy)} />
      </Line>
    </ComposedChart>
  );
}

export function ProjectedLoadChart({ scope, onScopeChange }: { scope: Scope; onScopeChange: (s: Scope) => void }) {
  const load = useCallback(() => fetchForecast(scope), [scope]);
  const { data, error } = usePolling(load);
  const hidden = error instanceof ApiError && error.status === 403;
  const homes = data ? `${formatInt(data.homeCount)} homes` : null;

  return (
    <ChartFrame
      title={`Projected residential load · ${areaName(scope)} · Mon`}
      explainer={`kW${homes ? `, ${homes} combined` : ""}. Baseline = everyone runs things when they get home. Planned = committed GridShift plans.`}
      action={
        <>
          <AreaPicker value={scope} onChange={onScopeChange} />
          <InfoTip>
            Each point is the total load of the homes in this area during that hour, from our simulated community.
            The amber band is AEP Ohio&apos;s 2–6 PM weekday peak.
          </InfoTip>
        </>
      }
      height={300}
      loading={!data && !error}
      emptyMessage={hidden ? PRIVACY_MESSAGE : error && !data ? error.message : null}
      callout={data ? <Callout forecast={data} /> : null}
    >
      {data ? <Chart forecast={data} /> : <ComposedChart />}
    </ChartFrame>
  );
}
