// components/utility/ZoneContextChart.tsx — AEP zone context from PJM (DESIGN.md §6.1, BUILD.md C6, owner: C)
// Real public data in MW, slate blue, separate from our kW chart (never one axis).
// Data comes from D's getRegionReference(); it's a sample curve until D sets the snapshot.
"use client";

import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, ChartTooltip, InfoTip, SourceNote, Tag, axisProps, chartColors, formatInt, gridProps, hourLabel } from "@/components/ui";
import { DAY_NAMES } from "@/lib/config";
import { getRegionReference } from "@/lib/realdata";
import type { RegionReference } from "@/lib/types";

const isSample = (ref: RegionReference) => ref.date === "sample";

function parseHours(ref: RegionReference): Date[] | null {
  if (!ref.hours?.length) return null;
  const dates = ref.hours.map((t) => new Date(t));
  return dates.every((d) => !Number.isNaN(d.getTime())) ? dates : null;
}

// "Oct 24, 2026", or null if the date isn't a real date.
function retrievedLabel(date: string): string | null {
  const d = new Date(`${date}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// With timestamps: one tick per day ("Mon"). Without: every 6 hours ("6a").
function axisFor(ref: RegionReference, dates: Date[] | null) {
  const n = ref.demandMW.length;
  if (dates) {
    const ticks = dates.map((d, i) => (d.getHours() === 0 ? i : -1)).filter((i) => i >= 0);
    return { ticks, format: (i: number) => DAY_NAMES[dates[i]?.getDay() ?? 0] };
  }
  const ticks = Array.from({ length: Math.ceil(n / 6) }, (_, i) => i * 6);
  return { ticks, format: (i: number) => hourLabel(i) };
}

function tooltipTitle(dates: Date[] | null) {
  return (i: number | string) => {
    const d = dates?.[Number(i)];
    if (!d) return `Hour ${i}`;
    return `${DAY_NAMES[d.getDay()]} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "numeric" })}`;
  };
}

// Width/height come from ChartFrame's ResponsiveContainer.
function Chart({ reference, width, height }: { reference: RegionReference; width?: number; height?: number }) {
  const dates = parseHours(reference);
  const axis = axisFor(reference, dates);
  const rows = reference.demandMW.map((mw, i) => ({ i, mw }));
  return (
    <LineChart width={width} height={height} data={rows} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="i" type="number" domain={[0, rows.length - 1]} ticks={axis.ticks} tickFormatter={axis.format} {...axisProps} />
      <YAxis width={56} tickFormatter={(v: number) => formatInt(v)} domain={["auto", "auto"]} {...axisProps} />
      <Tooltip content={<ChartTooltip unit="MW" titleFormatter={tooltipTitle(dates)} />} />
      <Line type="monotone" dataKey="mw" name="AEP zone load" stroke={chartColors.real} strokeWidth={2} dot={false} animationDuration={300} />
    </LineChart>
  );
}

export function ZoneContextChart() {
  const reference = getRegionReference();
  const sample = isSample(reference);
  const retrieved = retrievedLabel(reference.date);

  return (
    <ChartFrame
      title="AEP zone context · PJM"
      explainer="MW, whole AEP zone. What AEP already forecasts for the whole zone. Griddy adds what customers plan to do."
      action={
        <>
          <Tag kind={sample ? "SIMULATED" : "REAL"} />
          <InfoTip>
            {sample
              ? "Sample curve standing in until the PJM snapshot is added."
              : "Public PJM data for the AEP transmission zone. It's in MW for millions of customers, so it gets its own chart."}
          </InfoTip>
        </>
      }
      height={220}
      footer={
        <SourceNote
          source={reference.source}
          details={[reference.label]}
          retrieved={retrieved ?? undefined}
          href={reference.sourceUrl}
        />
      }
    >
      <Chart reference={reference} />
    </ChartFrame>
  );
}
