// components/ui/Stat.tsx — one KPI: label, big number, delta, provenance tag (DESIGN.md §3, owner: C)
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
  className?: string;
}

export function Stat({ label, value, delta, deltaTone = "muted", tag, className = "" }: Props) {
  return (
    <div className={`rounded-card border border-line bg-surface p-4 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-caption text-ink-muted">{label}</span>
        {tag && <Tag kind={tag} />}
      </div>
      <div className="mt-2 font-mono text-display text-ink">{value}</div>
      {delta && <div className={`mt-1 text-caption ${TONE[deltaTone]}`}>{delta}</div>}
    </div>
  );
}
