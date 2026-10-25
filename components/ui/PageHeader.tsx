// components/ui/PageHeader.tsx — eyebrow + page title + one-line lead, optional right-side actions (owner: C)
import type { ReactNode } from "react";

interface Props {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, lead, action }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5 text-brand">{eyebrow}</p>}
        <h1 className="text-h1 text-ink">{title}</h1>
        {lead && <p className="mt-1.5 max-w-[72ch] text-body text-ink-muted">{lead}</p>}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </header>
  );
}
