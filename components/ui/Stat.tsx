// components/ui/Stat.tsx — one KPI: label, big number, delta, provenance tag (DESIGN.md §3, owner: C)
// `bare` drops the card chrome so several Stats can sit in one divided band (AEP Overview).
import type { ReactNode } from "react";
import { Tag, type TagKind } from "./Tag";

export type DeltaTone = "plan" | "peak" | "muted"; // plan = good/decrease, peak = increase

const TONE: Record<DeltaTone, string> = {
  plan: "text-plan",
  peak: "text-peak",
  muted: "text-ink-muted",
};

interface Props {
  label: ReactNode;
  value: ReactNode; // pre-formatted: "1,900 kWh", "−18%"
  delta?: ReactNode; // "−18% vs. baseline"
  deltaTone?: DeltaTone;
  tag?: TagKind;
  bare?: boolean;
  className?: string;
}

export function Stat({ label, value, delta, deltaTone = "muted", tag, bare = false, className = "" }: Props) {
  const chrome = bare ? "" : "rounded-card border border-line bg-surface";
  return (
    <div className={`flex flex-col p-5 ${chrome} ${className}`}>
      {/* flex-wrap: on narrow cards the tag drops under the label instead of squeezing it. */}
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
        <span className="eyebrow">{label}</span>
        {tag && <Tag kind={tag} />}
      </div>
      {/* mt-auto: values line up across a row even when one label wraps. */}
      <div className="mt-auto pt-3 font-display text-display text-ink">{value}</div>
      {delta && <div className={`mt-1 text-caption ${TONE[deltaTone]}`}>{delta}</div>}
    </div>
  );
}
