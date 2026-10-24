// components/utility/TopBar.tsx — thin context bar above every dashboard page (DESIGN.md §6, owner: C)
import { PLAN_DAY, dayLabel } from "@/lib/config";
import { Tag } from "@/components/ui";

export function TopBar() {
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-x-2 gap-y-1 whitespace-nowrap border-b border-line bg-surface px-6 py-2 text-caption text-ink-muted">
      <span className="text-ink">Residential flexibility</span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-2">
        Demo community (simulated) <Tag kind="SIMULATED" />
      </span>
      <span aria-hidden>·</span>
      <span>
        Plan date <span className="font-mono text-ink">{dayLabel(PLAN_DAY)}</span>
      </span>
    </div>
  );
}
