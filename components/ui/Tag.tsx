// components/ui/Tag.tsx — provenance and status pills (DESIGN.md §3–§4, owner: C)
// Every number and chart carries one of these. That's how "honest" shows visually.

export type TagKind = "REAL" | "SIMULATED" | "ILLUSTRATIVE" | "PEAK" | "OFF-PEAK" | "PROJECTED";

const STYLES: Record<TagKind, string> = {
  REAL: "bg-real-wash text-real border-transparent",
  SIMULATED: "bg-paper text-ink-muted border-line",
  ILLUSTRATIVE: "bg-surface text-peak border-peak/60",
  PEAK: "bg-peak-wash text-peak border-transparent",
  "OFF-PEAK": "bg-plan-wash text-plan border-transparent",
  PROJECTED: "bg-surface text-ink-muted border-ink-muted/50 border-dashed",
};

// Small dot so the tag reads as a status, not a button.
const DOT: Partial<Record<TagKind, string>> = {
  REAL: "bg-real",
  PEAK: "bg-peak",
  "OFF-PEAK": "bg-plan",
};

// What each tag means, shown on hover so a judge can ask the page itself.
const MEANING: Record<TagKind, string> = {
  REAL: "Real public data (PJM, EIA, AEP rate windows)",
  SIMULATED: "From our synthetic demo community",
  ILLUSTRATIVE: "Illustrative rate or savings, not a real AEP price",
  PEAK: "Peak hours",
  "OFF-PEAK": "Off-peak hours",
  PROJECTED: "Projection for a future day",
};

export function Tag({ kind, className = "" }: { kind: TagKind; className?: string }) {
  const dot = DOT[kind];
  return (
    <span
      title={MEANING[kind]}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-tag border px-2 py-0.5 text-tag uppercase ${STYLES[kind]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />}
      {kind}
    </span>
  );
}
