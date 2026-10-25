// components/ui/BrandMark.tsx — Griddy logo (owner: C)
// The mark is a 4×4 grid whose lit cells spell a pixel "G". The G's crossbar tip is the
// "spark" cell: a block of load dropping into a better slot. It drops in on load and
// replays on hover. In the wordmark, the dot on the "i" is a small square grid cell.
import { colors } from "./tokens";

const CELL = 5;
const GAP = 1.5;
const OFFSET = (32 - (4 * CELL + 3 * GAP)) / 2; // 3.75: centers the grid in the tile

// [row, col] of the lit cells that spell the G (the spark cell is drawn separately).
const G_CELLS: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3],
  [1, 0],
  [2, 0], [2, 2],
  [3, 0], [3, 1], [3, 2], [3, 3],
];
const SPARK: [number, number] = [2, 3];

const at = (i: number) => OFFSET + i * (CELL + GAP);

function Cell({ r, c, fill, opacity = 1, className }: { r: number; c: number; fill: string; opacity?: number; className?: string }) {
  return <rect x={at(c)} y={at(r)} width={CELL} height={CELL} rx={1.25} fill={fill} opacity={opacity} className={className} />;
}

// The square mark on its own (also the favicon, app/icon.svg).
export function GriddyMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="griddy-mark shrink-0">
      <rect width="32" height="32" rx="8" fill={colors.brand} />
      {/* The empty grid shows faintly, so the G reads as cells lit in a grid. */}
      {[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => <Cell key={`${r}${c}`} r={r} c={c} fill="#FFFFFF" opacity={0.16} />))}
      {G_CELLS.map(([r, c]) => (
        <Cell key={`g${r}${c}`} r={r} c={c} fill="#FFFFFF" />
      ))}
      <Cell r={SPARK[0]} c={SPARK[1]} fill={colors["brand-spark"]} className="griddy-spark" />
    </svg>
  );
}

interface Props {
  suffix?: string; // e.g. "for AEP"
  size?: "sm" | "md";
}

export function BrandMark({ suffix, size = "md" }: Props) {
  const mark = size === "sm" ? 28 : 34;
  const text = size === "sm" ? "text-[22px]" : "text-[26px]";
  return (
    <span role="img" aria-label="Griddy" className="group inline-flex items-center gap-2">
      <GriddyMark size={mark} />
      <span aria-hidden className={`whitespace-nowrap font-display ${text} font-bold leading-none tracking-[-0.02em] text-ink`}>
        Gr
        {/* A drawn i: stem at x-height plus a square dot, so the dot is a grid cell. */}
        <span className="relative mx-[0.055em] inline-block h-[0.5em] w-[0.115em] bg-ink">
          <span className="absolute bottom-full left-1/2 mb-[0.075em] h-[0.17em] w-[0.17em] -translate-x-1/2 rounded-[0.03em] bg-brand" />
        </span>
        ddy
        {suffix && <span className="ml-1.5 font-semibold tracking-normal text-ink-muted">{suffix}</span>}
      </span>
    </span>
  );
}
