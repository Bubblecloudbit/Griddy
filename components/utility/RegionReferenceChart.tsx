// components/utility/RegionReferenceChart.tsx — real public grid data snapshot (owner: C)
// Data comes from getRegionReference() (owner D). It is in MW for the whole zone, so it
// gets its own chart and never shares an axis with our kW forecast (design.md §6).
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RegionReference } from "@/lib/types";
import { axisTick, fullHourLabel } from "./hours";

function toRows(ref: RegionReference) {
  return ref.demandMW.map((demand, hour) => ({
    hour,
    demand,
    forecast: ref.forecastMW?.[hour],
  }));
}

export function RegionReferenceChart({ reference }: { reference: RegionReference }) {
  const hasForecast = Boolean(reference.forecastMW?.length);
  const last = reference.demandMW.length - 1;
  const ticks = [0, 6, 12, 18, 24, 30, 36, 42, 47].filter((t) => t <= last);

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={toRows(reference)} margin={{ top: 10, right: 24, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="hour" type="number" domain={[0, last]} ticks={ticks} tickFormatter={axisTick} tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
              label={{ value: "MW", angle: -90, position: "insideLeft", fontSize: 11 }}
            />
            <Tooltip labelFormatter={(h) => fullHourLabel(Number(h))} formatter={(v) => `${Math.round(Number(v)).toLocaleString()} MW`} />
            <Legend />
            <Line type="monotone" dataKey="demand" stroke="#0f766e" strokeWidth={2} dot={false} name="Zone demand" />
            {hasForecast && (
              <Line type="monotone" dataKey="forecast" stroke="#0f766e" strokeDasharray="5 4" dot={false} name="Day-ahead forecast" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {reference.label}. Source: {reference.source}, {reference.date}. Grid context only; customer
        bills use the illustrative time-of-use rate.
      </p>
    </div>
  );
}
