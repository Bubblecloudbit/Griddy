// components/ui/Card.tsx — the one card style (DESIGN.md §3, owner: C)
// White, 1 px line border, 10 px radius, no shadow.
import type { ReactNode } from "react";

interface Props {
  title?: ReactNode;
  explainer?: ReactNode; // one sentence: "what am I looking at?"
  action?: ReactNode; // right side of the title row: Tag, InfoTip, Segmented…
  footer?: ReactNode; // usually a SourceNote
  children?: ReactNode;
  className?: string;
}

export function Card({ title, explainer, action, footer, children, className = "" }: Props) {
  const hasHeader = title || explainer || action;
  return (
    <section className={`rounded-card border border-line bg-surface p-4 ${className}`}>
      {hasHeader && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-h2 text-ink">{title}</h2>}
            {explainer && <p className="mt-1 text-caption text-ink-muted">{explainer}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      {children}
      {footer && <footer className="mt-3 border-t border-line pt-3">{footer}</footer>}
    </section>
  );
}
