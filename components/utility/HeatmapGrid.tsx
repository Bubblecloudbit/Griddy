// components/utility/HeatmapGrid.tsx — CSS-grid heat map (DESIGN.md §6.2, owner: C)
// Rows = areas or days, 24 hour columns. Peak columns get a thin amber outline,
// hidden cells (< 5 homes) are hatched, hover shows the cell's numbers.
"use client";

import { useRef, useState } from "react";
import { Tag, formatInt, formatPct } from "@/components/ui";
import { type Grid, cellColor } from "./heatmapMath";
import { clockLabel } from "./hours";

const PRIVACY = "Hidden for privacy (fewer than 5 homes)";

export interface PeakOutline {
  cols: [number, number]; // first and last peak column (inclusive)
  rows: [number, number]; // first and last row the peak applies to (inclusive)
}

interface Props {
  metric: "load" | "change";
  rows: string[];
  cols: string[];
  load: Grid; // planned kW per cell
  change: Grid; // % vs. baseline per cell
  projectedFrom?: number; // rows at or after this index get a PROJECTED tag
  peak: PeakOutline | null;
  tooltipRowLabel: (row: number) => string; // "Riverside · Mon" or "Thu Oct 29"
}

interface Hover {
  row: number;
  col: number;
  x: number;
  y: number;
}

function TooltipBody({ label, load, change }: { label: string; load: number | null; change: number | null }) {
  if (load === null || change === null) return <>{`${label} · ${PRIVACY}`}</>;
  return (
    <>
      <span className="text-ink">{label}</span> · <span className="font-mono">{formatInt(load)} kW</span> planned ·{" "}
      <span className={`font-mono ${change < 0 ? "text-plan" : change > 0 ? "text-peak" : ""}`}>{formatPct(change)}</span> vs.
      baseline
    </>
  );
}

export function HeatmapGrid({ metric, rows, cols, load, change, projectedFrom, peak, tooltipRowLabel }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const values = metric === "load" ? load : change;

  function onEnter(row: number, col: number, el: HTMLElement) {
    const box = wrap.current?.getBoundingClientRect();
    const cell = el.getBoundingClientRect();
    if (!box) return;
    setHover({ row, col, x: cell.left - box.left + cell.width / 2, y: cell.top - box.top });
  }

  return (
    <div ref={wrap} className="relative" onMouseLeave={() => setHover(null)}>
      <div
        role="grid"
        className="grid gap-px"
        style={{ gridTemplateColumns: `minmax(132px, auto) repeat(${cols.length}, minmax(0, 1fr))` }}
      >
        {/* header row */}
        <div style={{ gridColumn: 1, gridRow: 1 }} />
        {cols.map((c, i) => (
          <div key={c} style={{ gridColumn: i + 2, gridRow: 1 }} className="pb-1 text-center font-mono text-[10px] text-ink-muted">
            {c}
          </div>
        ))}

        {rows.map((name, r) => (
          <RowCells
            key={name}
            name={name}
            r={r}
            values={values[r] ?? []}
            projected={projectedFrom !== undefined && r >= projectedFrom}
            color={(v) => cellColor(metric, v, load, change)}
            onEnter={onEnter}
          />
        ))}

        {peak && (
          <div
            aria-hidden
            className="pointer-events-none z-10 rounded-tag border-2 border-peak"
            style={{ gridColumn: `${peak.cols[0] + 2} / ${peak.cols[1] + 3}`, gridRow: `${peak.rows[0] + 2} / ${peak.rows[1] + 3}` }}
          />
        )}
      </div>

      {hover && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-control border border-line bg-surface px-3 py-2 text-caption text-ink-muted shadow-popover"
          style={{ left: hover.x, top: hover.y - 6 }}
        >
          <TooltipBody
            label={`${tooltipRowLabel(hover.row)} ${clockLabel(hover.col)}`}
            load={load[hover.row]?.[hover.col] ?? null}
            change={change[hover.row]?.[hover.col] ?? null}
          />
        </div>
      )}
    </div>
  );
}

interface RowProps {
  name: string;
  r: number;
  values: (number | null)[];
  projected: boolean;
  color: (v: number) => string;
  onEnter: (row: number, col: number, el: HTMLElement) => void;
}

function RowCells({ name, r, values, projected, color, onEnter }: RowProps) {
  const gridRow = r + 2;
  return (
    <>
      <div style={{ gridColumn: 1, gridRow }} className="flex items-center gap-2 pr-3 text-caption text-ink">
        <span className="truncate">{name}</span>
        {projected && <Tag kind="PROJECTED" />}
      </div>
      {values.map((v, c) => (
        <div
          key={c}
          role="gridcell"
          aria-label={v === null ? PRIVACY : String(v)}
          onMouseEnter={(e) => onEnter(r, c, e.currentTarget)}
          style={{ gridColumn: c + 2, gridRow, background: v === null ? undefined : color(v) }}
          className={`h-7 rounded-[2px] transition-colors duration-chart ${v === null ? "hatch-hidden" : ""}`}
        />
      ))}
    </>
  );
}
