// components/customer/ApplianceCard.tsx — one appliance on the Plan tab (owner: B)
// DESIGN.md §5.2: energy, earliest-start and deadline pickers (labels per appliance:
// only a car is "plugged in"); after "Find best times", the
// recommended start, tier tag, savings, and the reason behind an InfoTip.
"use client";

import { X } from "lucide-react";
import type { FlexTask, RatePlan, ScheduledTask } from "@/lib/types";
import { isPeak } from "@/lib/rates";
import { InfoTip, Tag } from "@/components/ui";
import { durationHours } from "./client";
import { timeLabels } from "./appliances";
import { HORIZON_HOURS, clockLabel, hourLabel, hourOptions, money } from "./hours";

interface Props {
  task: FlexTask;
  rate: RatePlan;
  result?: ScheduledTask;
  onChange: (task: FlexTask) => void;
  onRemove: () => void;
}

const selectClass =
  "rounded-control border border-line bg-surface px-2.5 py-1.5 text-body text-ink hover:border-ink-muted focus:border-brand focus:outline-none";

export function ApplianceCard({ task, rate, result, onChange, onRemove }: Props) {
  const hours = durationHours(task);
  const fits = task.deadline - task.earliestStart >= hours;
  const labels = timeLabels(task);

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-h2 text-ink">{task.label}</h2>
          <p className="mt-0.5 text-caption text-ink-muted">
            {task.kWh} kWh · {task.powerKW} kW · runs {hours} h
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${task.label}`}
          className="text-ink-muted transition-colors duration-fast hover:text-ink"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </header>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-caption text-ink-muted">
          {labels.start}
          <select
            className={selectClass}
            value={task.earliestStart}
            onChange={(e) => onChange({ ...task, earliestStart: Number(e.target.value) })}
          >
            {hourOptions(24, HORIZON_HOURS - 1).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-caption text-ink-muted">
          {labels.end}
          <select
            className={selectClass}
            value={task.deadline}
            onChange={(e) => onChange({ ...task, deadline: Number(e.target.value) })}
          >
            {hourOptions(25, HORIZON_HOURS).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {!fits && (
        <p role="alert" className="mt-2 text-caption text-danger">
          Needs {hours} h between “{labels.start.toLowerCase()}” and “{labels.end.toLowerCase()}”.
        </p>
      )}

      {result && <Recommendation result={result} rate={rate} />}
    </section>
  );
}

function Recommendation({ result, rate }: { result: ScheduledTask; rate: RatePlan }) {
  const end = result.start + durationHours(result);
  const peak = Array.from({ length: durationHours(result) }, (_, i) => result.start + i).some((h) => isPeak(rate, h));
  const saved = result.baselineCost - result.cost;

  return (
    <div className="mt-4 space-y-1.5 rounded-control bg-brand-wash/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-body font-semibold text-ink">
          Start {hourLabel(result.start)} → done {clockLabel(end)}
        </span>
        <Tag kind={peak ? "PEAK" : "OFF-PEAK"} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption text-plan">
          {saved > 0.005
            ? `Saves ${money(saved)} vs. starting at ${clockLabel(result.earliestStart)}`
            : "Same cost as starting right away"}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {saved > 0.005 && <Tag kind="ILLUSTRATIVE" />}
          {result.reason && <InfoTip label="Why this time?">{result.reason}</InfoTip>}
        </span>
      </div>
    </div>
  );
}
