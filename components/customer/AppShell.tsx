// components/customer/AppShell.tsx — phone-width frame, header, bottom tabs (owner: B)
// DESIGN.md §5.
"use client";

import type { LucideIcon } from "lucide-react";
import { Award, CalendarDays, Clock, ListChecks } from "lucide-react";
import { BrandMark } from "@/components/ui";
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
    <div className="py-0 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-[420px] flex-col overflow-hidden border-x border-line bg-paper text-ink sm:min-h-[calc(100vh-120px)] sm:rounded-[20px] sm:border">
        <header className="border-b border-line bg-surface px-5 pb-5 pt-4">
          <div className="flex items-center justify-between">
            <BrandMark size="sm" />
            <span className="flex items-center gap-1.5 rounded-full bg-brand-wash px-2.5 py-1 text-caption font-semibold text-brand">
              <Award size={14} strokeWidth={1.75} aria-hidden />
              {points} pts
            </span>
          </div>
          <p className="eyebrow mt-5">Your plan</p>
          <h1 className="mt-0.5 text-h1">{planDayTitle()}</h1>
        </header>

        <main className="flex-1 space-y-4 px-4 py-5">{children}</main>

        <nav className="sticky bottom-0 grid grid-cols-4 border-t border-line bg-surface">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`flex flex-col items-center gap-1 border-t-[3px] pb-2.5 pt-2 text-[12px] transition-colors duration-fast ${
                tab === id ? "border-brand font-semibold text-brand" : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
