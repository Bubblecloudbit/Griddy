// components/utility/ProjectedLoadChart.tsx — "the proof" (DESIGN.md §6.1, BUILD.md C5, owner: C)
// Monday only (hours 24–47): dashed gray baseline vs. teal expected line, a light range band
// (verified homes only ↔ every plan followed, PLAN.md §7a), 2–6 PM peak band, direct line
// labels, and the callouts "Peak-hour load (expected) −X%" and "Highest hour −Z%".
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

// Phase 4: expected = the confidence-weighted forecast (falls back to planned on old data).
function expectedOf(f: Forecast): number[] {
  return f.expectedKW ?? f.plannedKW;
}

function toRows(f: Forecast) {
  const expected = expectedOf(f);
  const edge = f.verifiedOnlyKW ?? f.plannedKW;
  const rows = [];
  for (let hour = FIRST; hour <= LAST; hour++) {
    const lo = Math.min(edge[hour], f.plannedKW[hour]);
    const hi = Math.max(edge[hour], f.plannedKW[hour]);
    rows.push({ hour, baseline: f.baselineKW[hour], expected: expected[hour], range: [lo, hi] as [number, number] });
  }
  return rows;
}

// kWh in the peak window, baseline vs. expected. The API sends these; fall back to summing hourly kW.
function peakKWh(f: Forecast) {
  const sum = (series: number[]) => series.slice(PEAK_START, PEAK_END).reduce((a, b) => a + b, 0);
  return {
    baseline: f.peakKWhBaseline ?? sum(f.baselineKW),
    planned: f.peakKWhExpected ?? sum(expectedOf(f)),
  };
}

// Monday's single highest hour, baseline vs. expected: shows the plan doesn't just move the peak.
function highestHour(f: Forecast) {
  const max = (series: number[]) => Math.max(...series.slice(FIRST, LAST + 1));
  return { baseline: f.maxKWBaseline ?? max(f.baselineKW), planned: f.maxKWExpected ?? max(expectedOf(f)) };
}

function pctChange(planned: number, baseline: number) {
  return baseline > 0 ? ((planned - baseline) / baseline) * 100 : 0;
}

function Callout({ forecast }: { forecast: Forecast }) {
  const { baseline, planned } = peakKWh(forecast);
  const pct = pctChange(planned, baseline);
  const moved = baseline - planned;
  const top = highestHour(forecast);
  const topPct = pctChange(top.planned, top.baseline);
  const tone = (n: number) => (n <= 0 ? "text-plan" : "text-peak");
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-0.5">
        <div>
          Peak-hour load (expected) <span className={`font-mono font-semibold ${tone(pct)}`}>{formatPct(pct)}</span>{" "}
          <span className="text-ink-muted">({formatKWh(Math.abs(moved))} {moved >= 0 ? "moved" : "added"}, 2–6 PM)</span>
        </div>
        <div>
          Highest hour <span className={`font-mono font-semibold ${tone(topPct)}`}>{formatPct(topPct)}</span>{" "}
          <span className="text-ink-muted">
            ({formatInt(top.baseline)} → {formatInt(top.planned)} kW, any hour of the day)
          </span>
        </div>
      </div>
      <Tag kind="SIMULATED" />
    </div>
  );
}

// ResponsiveContainer passes width/height to its direct child, so forward them to the chart.
function Chart({ forecast, width, height }: { forecast: Forecast; width?: number; height?: number }) {
  const rows = toRows(forecast);
  const last = rows.length - 1;
  // Keep the two end labels apart: the line that ends lower gets its label pushed down.
  const expectedLower = rows[last].expected <= rows[last].baseline;
  const [expectedDy, baselineDy] = expectedLower ? [14, -4] : [-4, 14];
  return (
    <ComposedChart width={width} height={height} data={rows} margin={{ top: 20, right: 72, bottom: 0, left: 0 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="hour" type="number" domain={[FIRST, LAST]} ticks={hourTicks(FIRST, LAST)} tickFormatter={hourLabel} {...axisProps} />
      <YAxis width={48} tickFormatter={formatInt} {...axisProps} />
      <ReferenceArea {...peakBandProps(PEAK_START, PEAK_END)} />
      <Tooltip content={<ChartTooltip unit="kW" />} />
      {/* Range: verified homes only ↔ every plan followed (Phase 4) */}
      <Area type="monotone" dataKey="range" name="Range" stroke="none" fill={chartColors.plan} fillOpacity={0.12} animationDuration={300} />
      <Line
        type="monotone"
        dataKey="expected"
        name="Expected"
        stroke={chartColors.plan}
        strokeWidth={2}
        dot={false}
        animationDuration={300}
      >
        <LabelList content={endLabel("Expected", chartColors.plan, last, expectedDy)} />
      </Line>
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
      explainer={`kW${homes ? `, ${homes} combined` : ""}. Baseline = everyone runs things when they get home. Expected = committed Griddy plans, each weighted by how reliably that home follows it. Shaded range: verified homes only ↔ every plan followed.`}
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
