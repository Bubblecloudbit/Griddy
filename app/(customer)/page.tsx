// app/(customer)/page.tsx — customer app (owner: B). DESIGN.md §5.
// Tabs: Today (ribbon, B2–B3) · Plan (appliance cards, B4–B5) · Week (B6) · Rewards (B9).
"use client";

import { useEffect, useState } from "react";
import type { FlexEvent, FlexTask, RatePlan, ScheduledTask, Trip, WeeklyRoutine } from "@/lib/types";
import { Nav, useToast } from "@/components/ui";
import { MOCK_HOUSEHOLD, MOCK_ROUTINE } from "@/lib/mock";
import { optimize, commitPlan, getEvents, getRates } from "@/components/customer/client";
import { AppShell, type Tab } from "@/components/customer/AppShell";
import { DayRibbon } from "@/components/customer/DayRibbon";
import { BestTime, PlanStats } from "@/components/customer/TodaySummary";
import { PlanTab } from "@/components/customer/PlanTab";
import { WeekTab } from "@/components/customer/WeekTab";
import { FlexEventBanner } from "@/components/customer/FlexEventBanner";
import { CommandBar } from "@/components/customer/CommandBar";
import { RewardsTab, type PointsEntry } from "@/components/customer/RewardsTab";
import { CardSkeleton } from "@/components/customer/Skeleton";
import { DEMO_NOW, eventLabel } from "@/components/customer/hours";

const EVENT_POLL_MS = 5000;

export default function CustomerPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [rate, setRate] = useState<RatePlan | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  // Demo story (PLAN.md §3): early shift, car plugged in at 4 PM.
  const [routine, setRoutine] = useState<WeeklyRoutine>(MOCK_ROUTINE);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tasks, setTasks] = useState<FlexTask[]>([]);
  const [schedule, setSchedule] = useState<ScheduledTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [points, setPoints] = useState(MOCK_HOUSEHOLD.points);
  const [committed, setCommitted] = useState(false);
  const [events, setEvents] = useState<FlexEvent[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [countedIds, setCountedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<PointsEntry[]>([]);
  const { showToast, toast } = useToast();

  useEffect(() => {
    getRates()
      .then(setRate)
      .catch((e) => setRateError(e instanceof Error ? e.message : "Could not load rates."));
  }, []);

  // Poll for Flex Events created on the AEP side. A failed poll just keeps the last list.
  useEffect(() => {
    const load = () => getEvents().then(setEvents).catch(() => {});
    load();
    const id = setInterval(load, EVENT_POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Newest event that hasn't ended yet on the demo clock.
  const upcomingEvent = events.filter((e) => e.endHour > DEMO_NOW).at(-1) ?? null;
  // A joined event earns its bonus on the first commit after joining (the engine skips repeats).
  const newEvent = events.find((e) => joinedIds.includes(e.id) && !countedIds.includes(e.id)) ?? null;

  // Any edit to the task list makes the current schedule stale.
  function changeTasks(next: FlexTask[]) {
    setTasks(next);
    setSchedule(null);
    setError(null);
    setCommitted(false);
  }

  // Items the user confirmed from the command bar.
  function addFromCoach(newTasks: FlexTask[], newTrips: Trip[]) {
    if (newTasks.length) changeTasks([...tasks, ...newTasks]);
    if (newTrips.length) {
      setTrips([...trips, ...newTrips]);
      setCommitted(false);
    }
    const parts = [
      newTasks.length && `${newTasks.length} appliance${newTasks.length > 1 ? "s" : ""}`,
      newTrips.length && `${newTrips.length} trip${newTrips.length > 1 ? "s" : ""}`,
    ].filter(Boolean);
    if (parts.length) showToast(`Added ${parts.join(" and ")} · see Plan and Week`);
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
      const { points: total, earned } = await commitPlan({ tasks, trips, routine, eventIds: joinedIds });
      const bonus = newEvent ? ` (${newEvent.multiplier}× Flex Event)` : "";
      showToast(`Plan committed · +${earned} GridPoints${bonus}`);
      setCountedIds(joinedIds);
      const label = newEvent
        ? `Committed plan · Flex Event ${eventLabel(newEvent)} (${newEvent.multiplier}×)`
        : "Committed plan";
      setHistory((h) => [...h, { id: `p-${Date.now()}`, label, points: earned }]);
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
        {tab === "today" && <CommandBar onConfirm={addFromCoach} />}
        {tab === "today" &&
          (rate ? (
            <>
              <BestTime rate={rate} />
              <DayRibbon rate={rate} schedule={schedule ?? []} />
              <PlanStats schedule={schedule ?? []} />
              {upcomingEvent && (
                <FlexEventBanner
                  event={upcomingEvent}
                  joined={joinedIds.includes(upcomingEvent.id)}
                  onJoin={() => {
                    setJoinedIds((ids) => [...ids, upcomingEvent.id]);
                    setCommitted(false);
                  }}
                />
              )}
            </>
          ) : rateError ? (
            <p role="alert" className="text-body text-danger">Couldn&apos;t load peak hours: {rateError}</p>
          ) : (
            <>
              <CardSkeleton lines={2} />
              <CardSkeleton lines={4} />
            </>
          ))}

        {tab === "plan" && !rate && <CardSkeleton />}
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
          <WeekTab
            routine={routine}
            trips={trips}
            onRoutineChange={(r) => {
              setRoutine(r);
              setCommitted(false);
            }}
            onTripsChange={(t) => {
              setTrips(t);
              setCommitted(false);
            }}
          />
        )}

        {tab === "rewards" && (
          <RewardsTab points={points} history={history} onPlan={() => setTab("plan")} />
        )}
      </AppShell>
      {toast}
    </>
  );
}
