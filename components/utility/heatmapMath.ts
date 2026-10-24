// components/utility/heatmapMath.ts — colors and takeaway lines for the heat maps (owner: C)
// Pure functions, no React, so they're easy to explain to a judge.
import { formatPct, heatChange, heatLoad } from "@/components/ui";
import type { Heatmap } from "@/lib/types";

export type Grid = (number | null)[][];

// ---------------------------------------------------------------- colors

// Load: 5 even steps from 0 to the largest cell.
export function loadColor(value: number, max: number): string {
  const step = max > 0 ? Math.min(4, Math.floor((value / max) * 5)) : 0;
  return heatLoad[step];
}

// Change: diverging around 0. Teal = load moved away, amber = load added.
// `span` is where the colors max out; the neutral middle covers ±10% of it (±5% at a 50% span),
// so a real −8% trip dip still reads as teal.
export function changeColor(value: number, span: number): string {
  const t = span > 0 ? value / span : 0; // ≤ -1 … ≥ 1
  if (t <= -0.6) return heatChange[0];
  if (t <= -0.1) return heatChange[1];
  if (t < 0.1) return heatChange[2];
  if (t < 0.6) return heatChange[3];
  return heatChange[4];
}

export function maxLoad(grid: Grid): number {
  return Math.max(0, ...grid.flat().filter((v): v is number => v !== null));
}

// Colors saturate at ±50%: overnight EV charging can add +100–190% to a quiet hour, and letting
// that set the scale would wash out the −20% to −40% peak shifts that matter. Min 10 so a
// near-flat grid doesn't look dramatic.
export const CHANGE_CAP = 50;

export function changeSpan(grid: Grid): number {
  const largest = Math.max(0, ...grid.flat().filter((v): v is number => v !== null).map(Math.abs));
  return Math.min(CHANGE_CAP, Math.max(10, largest));
}

export function isCapped(grid: Grid): boolean {
  return grid.flat().some((v) => v !== null && Math.abs(v) > CHANGE_CAP);
}

export function cellColor(metric: Heatmap["metric"], value: number, load: Grid, change: Grid): string {
  return metric === "load" ? loadColor(value, maxLoad(load)) : changeColor(value, changeSpan(change));
}

// ---------------------------------------------------------------- baseline from the two grids

// The API gives planned kW and % change; baseline = planned / (1 + change/100).
function baselineOf(planned: number, pct: number): number {
  return pct <= -100 ? 0 : planned / (1 + pct / 100);
}

// % change of a block of cells, weighted by load (not an average of percentages).
export function blockChange(load: Grid, change: Grid, rows: number[], cols: number[]): number | null {
  let planned = 0;
  let baseline = 0;
  for (const r of rows) {
    for (const c of cols) {
      const p = load[r]?.[c];
      const pct = change[r]?.[c];
      if (p == null || pct == null) continue;
      planned += p;
      baseline += baselineOf(p, pct);
    }
  }
  return baseline > 0 ? ((planned - baseline) / baseline) * 100 : null;
}

// ---------------------------------------------------------------- takeaways

const WINDOW = 2; // hours: "4–6 PM"

// "Biggest shift: Riverside, 4–6 PM, −31% vs. baseline" — the 2-hour block with the biggest drop.
export function biggestShift(load: Grid, change: Grid, rowNames: string[], clock: (c: number) => string) {
  let best: { row: number; col: number; pct: number } | null = null;
  for (let r = 0; r < rowNames.length; r++) {
    for (let c = 0; c + WINDOW <= 24; c++) {
      const pct = blockChange(load, change, [r], [c, c + 1]);
      if (pct !== null && (best === null || pct < best.pct)) best = { row: r, col: c, pct };
    }
  }
  if (!best || best.pct > -1) return null;
  return `Biggest shift: ${rowNames[best.row]}, ${clock(best.col)}–${clock(best.col + WINDOW)}, ${formatPct(best.pct)} vs. baseline`;
}

// "Thu–Sat: −9% residential load (planned trips)" for rows 4–6 of the week view.
export function tripTakeaway(load: Grid, change: Grid, firstRow: number, lastRow: number, label: string) {
  const rows = Array.from({ length: lastRow - firstRow + 1 }, (_, i) => firstRow + i);
  const cols = Array.from({ length: 24 }, (_, c) => c);
  const pct = blockChange(load, change, rows, cols);
  if (pct === null) return null;
  return `${label}: ${formatPct(pct)} residential load (planned trips)`;
}
