// app/(customer)/page.tsx — customer app (owner: B). DESIGN.md §5.
// Tabs: Today (ribbon, B2–B3) · Plan (appliance cards, B4–B5) · Week (B6) · Rewards (B9).
"use client";

import { useEffect, useState } from "react";
import type { FlexTask, RatePlan, ScheduledTask, WeeklyRoutine } from "@/lib/types";
import { Card, Nav, useToast } from "@/components/ui";
import { MOCK_HOUSEHOLD, MOCK_ROUTINE } from "@/lib/mock";
import { optimize, commitPlan, getRates } from "@/components/customer/client";
import { AppShell, type Tab } from "@/components/customer/AppShell";
import { DayRibbon } from "@/components/customer/DayRibbon";
import { BestTime, PlanStats } from "@/components/customer/TodaySummary";
import { PlanTab } from "@/components/customer/PlanTab";

function Placeholder({ title, text }: { title: string; text: string }) {
  return <Card title={title} explainer={text} />;
}

export default function CustomerPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [rate, setRate] = useState<RatePlan | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  // Demo story (PLAN.md §3): early shift, car plugged in at 4 PM. Week tab (B6) edits this.
  const [routine] = useState<WeeklyRoutine>(MOCK_ROUTINE);
  const [tasks, setTasks] = useState<FlexTask[]>([]);
  const [schedule, setSchedule] = useState<ScheduledTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [points, setPoints] = useState(MOCK_HOUSEHOLD.points);
  const [committed, setCommitted] = useState(false);
  const { showToast, toast } = useToast();

  useEffect(() => {
    getRates()
      .then(setRate)
      .catch((e) => setRateError(e instanceof Error ? e.message : "Could not load rates."));
  }, []);

  // Any edit to the task list makes the current schedule stale.
  function changeTasks(next: FlexTask[]) {
    setTasks(next);
    setSchedule(null);
    setError(null);
    setCommitted(false);
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
      const total = await commitPlan(tasks, []);
      showToast(`Plan committed · +${total - points} GridPoints`);
      setPoints(total);
      setCommitted(true);
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
        {tab === "today" &&
          (rate ? (
            <>
              <BestTime rate={rate} />
              <DayRibbon rate={rate} schedule={schedule ?? []} />
              <PlanStats schedule={schedule ?? []} />
            </>
          ) : rateError ? (
            <p role="alert" className="text-body text-danger">{rateError}</p>
          ) : (
            <Card title="Peak and off-peak hours" explainer="Loading rates…" />
          ))}

        {tab === "plan" && rate && (
          <PlanTab
            rate={rate}
            tasks={tasks}
            schedule={schedule}
            plugInHour={routine.plugInHour}
            busy={busy}
            error={error}
            committed={committed}
            onTasksChange={changeTasks}
            onOptimize={runOptimize}
            onCommit={runCommit}
          />
        )}

        {tab === "week" && (
          <Placeholder title="Your week" text="Routine and trips will show here." />
        )}

        {tab === "rewards" && (
          <Placeholder title="Rewards" text={`You have ${points} GridPoints.`} />
        )}
      </AppShell>
      {toast}
    </>
  );
}
