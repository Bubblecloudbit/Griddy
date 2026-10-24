// components/utility/HeatmapLegend.tsx — 5-step scale + hidden-cell swatch (DESIGN.md §6.2, owner: C)
import { formatInt, formatPct, heatChange, heatLoad } from "@/components/ui";
import { type Grid, changeSpan, isCapped, maxLoad } from "./heatmapMath";

function Swatches({ colors }: { colors: readonly string[] }) {
  return (
    <span className="inline-flex">
      {colors.map((c) => (
        <span key={c} className="h-3 w-6 first:rounded-l-tag last:rounded-r-tag" style={{ background: c }} />
      ))}
    </span>
  );
}

export function HeatmapLegend({ metric, load, change }: { metric: "load" | "change"; load: Grid; change: Grid }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-caption text-ink-muted">
      {metric === "load" ? (
        <span className="inline-flex items-center gap-2">
          <span className="font-mono">0</span>
          <Swatches colors={heatLoad} />
          <span className="font-mono">{formatInt(maxLoad(load))} kW</span>
          <span>planned</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <span>Load moved away</span>
          <span className="font-mono">
            {isCapped(change) && "≤"}
            {formatPct(-changeSpan(change))}
          </span>
          <Swatches colors={heatChange} />
          <span className="font-mono">
            {isCapped(change) && "≥"}
            {formatPct(changeSpan(change))}
          </span>
          <span>Load added</span>
        </span>
      )}
      <span className="inline-flex items-center gap-2">
        <span className="hatch-hidden h-3 w-6 rounded-tag border border-line" />
        Hidden for privacy (fewer than 5 homes)
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-6 rounded-tag border-2 border-peak" />
        Peak 2–6 PM
      </span>
    </div>
  );
}
