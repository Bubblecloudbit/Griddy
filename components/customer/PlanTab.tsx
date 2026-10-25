// components/customer/PlanTab.tsx — add appliances, find best times, commit (owner: B)
// DESIGN.md §5.2. State lives in the page; this renders it.
"use client";

import { Plus, Plug } from "lucide-react";
import type { FlexTask, RatePlan, ScheduledTask } from "@/lib/types";
import { Button, EmptyState, Tag } from "@/components/ui";
import { ApplianceCard } from "./ApplianceCard";
import { APPLIANCE_CHIPS, newTask } from "./appliances";
import { money } from "./hours";
import { kWh, planTotals } from "./totals";

interface Props {
  rate: RatePlan;
  tasks: FlexTask[];
  schedule: ScheduledTask[] | null;
  plugInHour: number; // clock hour from the routine
  busy: boolean;
  error: string | null;
  committed: boolean;
  onTasksChange: (tasks: FlexTask[]) => void;
  onOptimize: () => void;
  onCommit: () => void;
}

export function PlanTab(props: Props) {
  const { rate, tasks, schedule, plugInHour, busy, error, committed, onTasksChange } = props;
  const resultFor = (id: string) => schedule?.find((s) => s.id === id);

  function replace(task: FlexTask) {
    onTasksChange(tasks.map((t) => (t.id === task.id ? task : t)));
  }

  return (
    <>
      <p className="text-body text-ink-muted">
        Add what you&apos;ll run. We&apos;ll find the cheapest time that still fits.
      </p>

      <div className="flex flex-wrap gap-2">
        {APPLIANCE_CHIPS.map((c) => (
          <Button
            key={c.kind}
            variant="secondary"
            className="rounded-full px-3 py-1 text-caption"
            onClick={() => onTasksChange([...tasks, newTask(c.kind, plugInHour)])}
          >
            <Plus size={14} strokeWidth={1.5} aria-hidden />
            {c.label}
          </Button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={Plug} message="Add an appliance to plan around the peak." />
      ) : (
        tasks.map((t) => (
          <ApplianceCard
            key={t.id}
            task={t}
            rate={rate}
            result={resultFor(t.id)}
            onChange={replace}
            onRemove={() => onTasksChange(tasks.filter((x) => x.id !== t.id))}
          />
        ))
      )}

      {schedule && <TotalRow schedule={schedule} />}

      {error && (
        <p role="alert" className="text-body text-danger">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant={schedule ? "secondary" : "primary"} onClick={props.onOptimize} disabled={busy || tasks.length === 0}>
          {busy && !schedule ? "Finding times…" : "Find best times"}
        </Button>
        <Button onClick={props.onCommit} disabled={busy || !schedule || committed}>
          {committed ? "Committed" : "Commit plan"}
        </Button>
      </div>
      <p className="text-caption text-ink-muted">
        Committing shares your plan with AEP as part of an area total (5+ homes). Opt-in only.
      </p>
    </>
  );
}

function TotalRow({ schedule }: { schedule: ScheduledTask[] }) {
  const { saved, peakKWhAvoided } = planTotals(schedule);
  return (
    <div className="flex items-center justify-between gap-2 rounded-card border border-line bg-surface px-5 py-4">
      <span className="text-body text-ink">
        Total <span className="font-display text-h2 text-plan">{money(saved)}</span> saved ·{" "}
        <span className="font-semibold">{kWh(peakKWhAvoided)}</span> out of peak
      </span>
      <Tag kind="ILLUSTRATIVE" />
    </div>
  );
}
