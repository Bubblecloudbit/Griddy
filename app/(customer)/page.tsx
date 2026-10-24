// app/(customer)/page.tsx — customer app (owner: B). DESIGN.md §5.
// Tabs: Today (ribbon, B2–B3) · Plan (appliance cards, B4–B5) · Week (B6) · Rewards (B9).
"use client";

import { useState } from "react";
import type { FlexTask, ScheduledTask } from "@/lib/types";
import { Nav } from "@/components/ui/Nav";
import { MOCK_HOUSEHOLD } from "@/lib/mock";
import { optimize, commitPlan } from "@/components/customer/client";
import { AppShell, type Tab } from "@/components/customer/AppShell";
import { TaskForm } from "@/components/customer/TaskForm";
import { TaskList } from "@/components/customer/TaskList";
import { ScheduleTimeline } from "@/components/customer/ScheduleTimeline";
import { SavingsCard } from "@/components/customer/SavingsCard";

// Demo story (PLAN.md §3): Jordan plugs in Mon 4 PM (h40) and needs the car full by Tue 7 AM (h55).
const DEMO_TASKS: FlexTask[] = [
  { id: "t-ev", label: "EV charging", appliance: "ev", kWh: 10, powerKW: 7.2, earliestStart: 40, deadline: 55 },
];

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-[10px] border border-[#E4E1D8] bg-white p-4">
      <h2 className="text-[15px] font-semibold leading-5">{title}</h2>
      <p className="mt-1 text-xs text-[#5B6474]">{text}</p>
    </section>
  );
}

export default function CustomerPage() {
  const [tab, setTab] = useState<Tab>("today");
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
      setError(e instanceof Error ? e.message : "Could not find times.");
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    setBusy(true);
    try {
      const earned = await commitPlan(tasks, []);
      setPoints((p) => p + earned);
      setCommittedMsg(`Plan committed · +${earned} GridPoints`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not commit plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Nav />
      <AppShell tab={tab} onTab={setTab} points={points}>
        {tab === "today" && (
          <Placeholder title="Today" text="Peak and off-peak hours for the day will show here." />
        )}

        {tab === "plan" && (
          <>
            <TaskForm onAdd={(t) => changeTasks([...tasks, t])} />
            <TaskList tasks={tasks} onRemove={(id) => changeTasks(tasks.filter((t) => t.id !== id))} />
            <button
              onClick={runOptimize}
              disabled={busy || tasks.length === 0}
              className="rounded-[8px] bg-[#14213D] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {busy && !schedule ? "Finding times…" : "Find best times"}
            </button>
            {error && (
              <p role="alert" className="text-sm text-[#B42318]">
                {error}
              </p>
            )}
            {schedule && (
              <>
                <ScheduleTimeline schedule={schedule} />
                <SavingsCard schedule={schedule} />
                <button
                  onClick={runCommit}
                  disabled={busy || committedMsg !== null}
                  className="rounded-[8px] bg-[#14213D] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  {committedMsg ? "Committed" : "Commit plan"}
                </button>
                {committedMsg && <p className="text-sm text-[#0F766E]">{committedMsg}</p>}
              </>
            )}
          </>
        )}

        {tab === "week" && (
          <Placeholder title="Your week" text="Routine and trips will show here." />
        )}

        {tab === "rewards" && (
          <Placeholder title="Rewards" text={`You have ${points} GridPoints.`} />
        )}
      </AppShell>
    </>
  );
}
