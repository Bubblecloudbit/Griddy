// components/customer/AppShell.tsx — phone-width frame, header, bottom tabs (owner: B)
// DESIGN.md §5.
"use client";

import type { LucideIcon } from "lucide-react";
import { Award, CalendarDays, Clock, ListChecks } from "lucide-react";
import { DEMO_DAY_0, PLAN_DAY } from "@/lib/config";

export type Tab = "today" | "plan" | "week" | "rewards";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "today", label: "Today", icon: Clock },
  { id: "plan", label: "Plan", icon: ListChecks },
  { id: "week", label: "Week", icon: CalendarDays },
  { id: "rewards", label: "Rewards", icon: Award },
];

// "Monday, Oct 26"
function planDayTitle(): string {
  const date = new Date(`${DEMO_DAY_0}T12:00:00`);
  date.setDate(date.getDate() + PLAN_DAY);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

interface Props {
  tab: Tab;
  onTab: (tab: Tab) => void;
  points: number;
  children: React.ReactNode;
}

export function AppShell({ tab, onTab, points, children }: Props) {
  return (
    <div className="bg-paper py-0 sm:py-6">
      <div className="mx-auto flex max-w-[420px] flex-col border-x border-line bg-paper text-ink min-h-[calc(100vh-49px)] sm:min-h-[calc(100vh-97px)] sm:border">
        <header className="px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-h2 tracking-tight">GridShift</span>
            <span className="flex items-center gap-1.5 rounded-tag border border-line bg-surface px-2 py-0.5 font-mono text-caption tabular-nums">
              <span className="h-1.5 w-1.5 rounded-full bg-plan" aria-hidden />
              {points} pts
            </span>
          </div>
          <h1 className="mt-1 text-h1">Plan for {planDayTitle()}</h1>
        </header>

        <main className="flex-1 space-y-4 px-4 pb-6">{children}</main>

        <nav className="sticky bottom-0 grid grid-cols-4 border-t border-line bg-surface">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-xs transition-colors duration-fast ${
                tab === id ? "font-semibold text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
