// components/utility/ForecastChart.tsx — baseline vs. planned load with the transformer limit (owner: C)
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import type { FlexEvent, Forecast } from "@/lib/types";
import { LAST_HOUR, axisTick, fullHourLabel } from "./hours";

const TICKS = Array.from({ length: Math.floor(LAST_HOUR / 6) + 1 }, (_, i) => i * 6); // every 6 h across the horizon

function toRows(forecast: Forecast) {
  return forecast.baselineKW.map((b, hour) => ({
    hour,
    baseline: b,
    planned: forecast.plannedKW[hour],
  }));
}

interface Props {
  forecast: Forecast;
  events?: FlexEvent[]; // shaded on the chart so the utility sees where it asked for relief
}

export function ForecastChart({ forecast, events = [] }: Props) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={toRows(forecast)} margin={{ top: 10, right: 24, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="hour"
            type="number"
            domain={[0, LAST_HOUR]}
            ticks={TICKS}
            tickFormatter={axisTick}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            // always leave room for the transformer limit, even when load is far below it
            domain={[0, (dataMax: number) => Math.ceil((Math.max(dataMax, forecast.capacityKW) * 1.1) / 50) * 50]}
            tick={{ fontSize: 11 }}
            label={{ value: "kW", angle: -90, position: "insideLeft", fontSize: 11 }}
          />
          <Tooltip
            labelFormatter={(h) => fullHourLabel(Number(h))}
            formatter={(v) => `${Number(v).toFixed(1)} kW`}
          />
          <Legend />
          {events.map((e) => (
            <ReferenceArea
              key={e.id}
              x1={e.startHour}
              x2={e.endHour}
              fill="#f59e0b"
              fillOpacity={0.15}
              label={{ value: `Flex ${e.multiplier}×`, position: "insideTop", fontSize: 10, fill: "#b45309" }}
            />
          ))}
          <ReferenceLine
            y={forecast.capacityKW}
            stroke="#dc2626"
            strokeDasharray="6 4"
            label={{ value: "Transformer limit", position: "insideTopRight", fill: "#dc2626", fontSize: 11 }}
          />
          <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} dot={false} name="Baseline (simulated)" />
          <Line type="monotone" dataKey="planned" stroke="#2563eb" strokeWidth={2} dot={false} name="Planned / committed (simulated)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
