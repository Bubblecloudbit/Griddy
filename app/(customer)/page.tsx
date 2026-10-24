// app/(customer)/page.tsx — customer planner (owner: B)
// Flow: add tasks → Optimize → review timeline + savings → Commit plan.
"use client";

import { useState } from "react";
import type { FlexTask, ScheduledTask } from "@/lib/types";
import { Nav } from "@/components/ui/Nav";
import { MOCK_HOUSEHOLD } from "@/lib/mock";
import { optimize, commitPlan } from "@/components/customer/client";
import { TaskForm } from "@/components/customer/TaskForm";
import { TaskList } from "@/components/customer/TaskList";
import { ScheduleTimeline } from "@/components/customer/ScheduleTimeline";
import { SavingsCard } from "@/components/customer/SavingsCard";

// Demo story (PLAN.md §3): Jordan plugs in at 6 PM and needs the car full by 7 AM tomorrow.
const DEMO_TASKS: FlexTask[] = [
  { id: "t-ev", label: "EV Charging", kWh: 10, powerKW: 7.2, earliestStart: 18, deadline: 31 },
];

export default function CustomerPage() {
  const [tasks, setTasks] = useState<FlexTask[]>(DEMO_TASKS);
  const [schedule, setSchedule] = useState<ScheduledTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [points, setPoints] = useState(MOCK_HOUSEHOLD.points);
  const [committedMsg, setCommittedMsg] = useState<string | null>(null);

  // Any edit to the task list makes the current schedule stale.
  function changeTasks(next: FlexTask[]) {
    setTasks(next);
    setSchedule(null);
    setError(null);
    setCommittedMsg(null);
  }

  async function runOptimize() {
    setBusy(true);
    setError(null);
    try {
      setSchedule(await optimize(tasks));
    } catch (e) {
      setSchedule(null);
      setError(e instanceof Error ? e.message : "Could not optimize.");
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    setBusy(true);
    try {
      const earned = await commitPlan(tasks, []);
      setPoints((p) => p + earned);
      setCommittedMsg(`Plan committed! +${earned} GridPoints`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not commit plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">GridShift — Your Energy Planner</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tell us what you need to run and when it must be done. We find the cheapest time.
              All costs are <span className="font-medium text-amber-700">illustrative</span>.
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-right">
            <div className="text-xs text-blue-700">GridPoints</div>
            <div className="text-xl font-bold text-blue-800">{points}</div>
          </div>
        </header>

        <TaskForm onAdd={(t) => changeTasks([...tasks, t])} />

        <section className="space-y-3">
          <h2 className="font-semibold text-slate-900">Your tasks</h2>
          <TaskList tasks={tasks} onRemove={(id) => changeTasks(tasks.filter((t) => t.id !== id))} />
          <button
            onClick={runOptimize}
            disabled={busy || tasks.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {busy && !schedule ? "Optimizing…" : "Optimize"}
          </button>
          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>

        {schedule && (
          <>
            <ScheduleTimeline schedule={schedule} />
            <SavingsCard schedule={schedule} />
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={runCommit}
                disabled={busy || committedMsg !== null}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
              >
                {committedMsg ? "Committed" : "Commit plan"}
              </button>
              {committedMsg && <span className="text-sm font-medium text-green-700">{committedMsg}</span>}
              {!committedMsg && (
                <span className="text-xs text-slate-500">
                  Shares your plan with the utility as a neighborhood aggregate (5+ homes). Opt-in only.
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
