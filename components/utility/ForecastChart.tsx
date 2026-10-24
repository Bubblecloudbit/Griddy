// components/utility/ForecastChart.tsx — placeholder forecast chart (owner: C)
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
  ResponsiveContainer,
} from "recharts";
import type { Forecast } from "@/lib/types";

export function ForecastChart({ forecast }: { forecast: Forecast }) {
  const data = forecast.baselineKW.map((b, i) => ({
    hour: i,
    baseline: b,
    planned: forecast.plannedKW[i],
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="hour" tick={{ fontSize: 11 }} label={{ value: "Hour", position: "insideBottom", offset: -2, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} label={{ value: "kW", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <ReferenceLine
            y={forecast.capacityKW}
            stroke="#dc2626"
            strokeDasharray="6 4"
            label={{ value: "Transformer limit", position: "right", fill: "#dc2626", fontSize: 11 }}
          />
          <Line type="monotone" dataKey="baseline" stroke="#94a3b8" dot={false} name="Baseline" />
          <Line type="monotone" dataKey="planned" stroke="#2563eb" dot={false} name="Planned (committed)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
