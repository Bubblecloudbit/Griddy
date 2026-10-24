// components/ui/chart.tsx — shared Recharts styling (DESIGN.md §3 "Chart rules", owner: C)
// Recharts only renders its own child types, so these are props to spread, not wrapper components:
//   <CartesianGrid {...gridProps} />
//   <XAxis dataKey="hour" {...axisProps} ticks={hourTicks(24, 47)} tickFormatter={hourLabel} />
//   <ReferenceArea {...peakBandProps(38, 42)} />
//   <Tooltip content={<ChartTooltip unit="kW" />} />
//   <Line ...><LabelList content={endLabel("Planned", colors.plan, data.length - 1)} /></Line>

import type { ReactNode } from "react";
import { colors, fontVars } from "./tokens";
import { DAY_NAMES, dayOf, hourLabel } from "@/lib/config";

export { colors as chartColors } from "./tokens";
export { hourLabel } from "@/lib/config";

// Horizontal gridlines only, line color, no chart border.
export const gridProps = { vertical: false, stroke: colors.line } as const;

export const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 11, fill: colors["ink-muted"], fontFamily: fontVars.mono },
} as const;

// Ticks every 3 hours between two horizon hours (inclusive): 12a 3a 6a …
export function hourTicks(from: number, to: number): number[] {
  const ticks: number[] = [];
  for (let h = Math.ceil(from / 3) * 3; h <= to; h += 3) ticks.push(h);
  return ticks;
}

// "Mon 4 PM" for tooltips.
export function hourTitle(h: number): string {
  const c = h % 24;
  const clock = `${c % 12 === 0 ? 12 : c % 12} ${c < 12 ? "AM" : "PM"}`;
  return `${DAY_NAMES[dayOf(h) % 7]} ${clock}`;
}

// Peak band: ReferenceArea filled peak-wash with "Peak 2–6 PM" at the top. endHour is exclusive.
export function peakBandProps(startHour: number, endHour: number, label = "Peak 2–6 PM") {
  return {
    x1: startHour,
    x2: endHour,
    fill: colors["peak-wash"],
    fillOpacity: 1,
    stroke: "none",
    label: { value: label, position: "insideTop" as const, fill: colors.peak, fontSize: 11, fontFamily: fontVars.mono },
  };
}

// Thin divider where the day changes, labeled "Mon".
export function dayDividerProps(hour: number) {
  return {
    x: hour,
    stroke: colors.line,
    label: { value: DAY_NAMES[dayOf(hour) % 7], position: "insideTopLeft" as const, fill: colors["ink-muted"], fontSize: 11 },
  };
}

// Direct label at the right end of a line, instead of a legend. Use inside <LabelList content={…} />.
export function endLabel(text: string, color: string, lastIndex: number) {
  // eslint-disable-next-line react/display-name
  return (props: { x?: number | string; y?: number | string; index?: number }) => {
    if (props.index !== lastIndex) return null;
    return (
      <text x={Number(props.x) + 6} y={Number(props.y)} dy={4} fill={color} fontSize={11} fontWeight={600}>
        {text}
      </text>
    );
  };
}

interface TooltipRow {
  name?: ReactNode;
  value?: number | string | (number | string)[];
  color?: string;
  stroke?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipRow[];
  label?: number | string;
  unit?: string; // "kW", "MW"
  titleFormatter?: (label: number | string) => string; // default: "Mon 4 PM"
}

// White, line border, Plex Mono numbers, time as the title.
export function ChartTooltip({ active, payload, label, unit = "", titleFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length || label === undefined) return null;
  const title = titleFormatter ? titleFormatter(label) : hourTitle(Number(label));
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 text-caption shadow-popover">
      <div className="mb-1 font-medium text-ink">{title}</div>
      {payload.map((row, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-ink-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: row.stroke ?? row.color }} />
            {row.name}
          </span>
          <span className="font-mono text-ink">
            {typeof row.value === "number" ? row.value.toLocaleString("en-US", { maximumFractionDigits: 1 }) : row.value} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export { hourLabel as hourTickFormatter };
