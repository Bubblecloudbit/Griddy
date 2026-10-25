// components/ui/Card.tsx — the one card style (DESIGN.md §3, owner: C)
// White, 1 px line border, 6 px radius, no shadow. `tone` gives the pastel info panels.
import type { ReactNode } from "react";

export type CardTone = "default" | "brand" | "real" | "peak";

const TONES: Record<CardTone, string> = {
  default: "border-line bg-surface",
  brand: "border-transparent bg-brand-wash",
  real: "border-transparent bg-real-wash",
  peak: "border-transparent bg-peak-wash",
};

interface Props {
  title?: ReactNode;
  eyebrow?: ReactNode; // small uppercase label above the title
  explainer?: ReactNode; // one sentence: "what am I looking at?"
  action?: ReactNode; // right side of the title row: Tag, InfoTip, Segmented…
  footer?: ReactNode; // usually a SourceNote
  tone?: CardTone;
  children?: ReactNode;
  className?: string;
}

export function Card({ title, eyebrow, explainer, action, footer, tone = "default", children, className = "" }: Props) {
  const hasHeader = title || eyebrow || explainer || action;
  return (
    <section className={`rounded-card border p-5 ${TONES[tone]} ${className}`}>
      {hasHeader && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            {title && <h2 className="text-h2 text-ink">{title}</h2>}
            {explainer && <p className="mt-1 max-w-[68ch] text-caption text-ink-muted">{explainer}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      {children}
      {footer && <footer className="mt-4 border-t border-line pt-3">{footer}</footer>}
    </section>
  );
}
