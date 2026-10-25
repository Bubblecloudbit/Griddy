// components/utility/TopBar.tsx — thin context bar above every dashboard page (DESIGN.md §6, owner: C)
import { CalendarDays, Users } from "lucide-react";
import { PLAN_DAY, dayLabel } from "@/lib/config";
import { NEIGHBORHOODS } from "@/lib/community";
import { Tag } from "@/components/ui";

export function TopBar() {
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-x-6 gap-y-1 whitespace-nowrap border-b border-line bg-surface px-8 py-2 text-caption text-ink-muted">
      <span className="inline-flex items-center gap-2">
        <Users size={14} strokeWidth={1.75} aria-hidden />
        Demo community · {NEIGHBORHOODS.length} areas
        <Tag kind="SIMULATED" />
      </span>
      <span className="inline-flex items-center gap-2">
        <CalendarDays size={14} strokeWidth={1.75} aria-hidden />
        Plan date <span className="font-semibold text-ink">{dayLabel(PLAN_DAY)}</span>
      </span>
    </div>
  );
}
