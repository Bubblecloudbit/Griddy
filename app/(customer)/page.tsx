// app/(customer)/page.tsx — customer app (owner: B). DESIGN.md §5 + PHASE4.md §6.
// Tabs: Today (ribbon, value card, settlement) · Plan (appliance cards) · Week (setup, routine, trips) · Rewards.
"use client";

import { useEffect, useState } from "react";
import type { CustomerSetup, FlexEvent, FlexTask, MyStatus, RatePlan, ScheduledTask, Trip, WeeklyRoutine } from "@/lib/types";
import { Nav, useToast } from "@/components/ui";
import { MOCK_HOUSEHOLD, MOCK_ROUTINE } from "@/lib/mock";
import { optimize, commitPlan, getEvents, getMe, getRates } from "@/components/customer/client";
import { AppShell, type Tab } from "@/components/customer/AppShell";
import { DayRibbon } from "@/components/customer/DayRibbon";
import { BestTime } from "@/components/customer/TodaySummary";
import { PlanTab } from "@/components/customer/PlanTab";
import { WeekTab } from "@/components/customer/WeekTab";
import { FlexEventBanner } from "@/components/customer/FlexEventBanner";
import { CommandBar } from "@/components/customer/CommandBar";
import { RewardsTab } from "@/components/customer/RewardsTab";
import { SetupCard, toSetup, type SetupChoice } from "@/components/customer/SetupCard";
import { ValueCard } from "@/components/customer/ValueCard";
import { SettlementCard } from "@/components/customer/SettlementCard";
import { CardSkeleton } from "@/components/customer/Skeleton";
import { DEMO_NOW } from "@/components/customer/hours";

const POLL_MS = 5000; // Flex Events and Jordan's status (settlement runs on the AEP side)

// A coach-proposed setup ({ rate: "flat" }) merged into the card's choices.
function mergeSetup(choice: Partial<SetupChoice>, s: Partial<CustomerSetup>): Partial<SetupChoice> {
  return { ...choice, ...(s.rate && { rate: s.rate }), ...(s.verification && { measure: s.verification }) };
}

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
  const [committed, setCommitted] = useState(false);
  const [events, setEvents] = useState<FlexEvent[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [setupChoice, setSetupChoice] = useState<Partial<SetupChoice>>({});
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [status, setStatus] = useState<MyStatus | null>(null);
  const { showToast, toast } = useToast();

  useEffect(() => {
    getRates()
      .then(setRate)
      .catch((e) => setRateError(e instanceof Error ? e.message : "Could not load rates."));
  }, []);

  // Poll Flex Events and Jordan's own status. A failed poll just keeps the last value.
  useEffect(() => {
    const load = () => {
      getEvents().then(setEvents).catch(() => {});
      getMe().then(setStatus).catch(() => {});
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Newest event that hasn't ended yet on the demo clock.
  const upcomingEvent = events.filter((e) => e.endHour > DEMO_NOW).at(-1) ?? null;
  const choiceComplete = setupChoice.rate !== undefined && setupChoice.measure !== undefined;
  const setup = choiceComplete ? toSetup(setupChoice as SetupChoice) : status?.setup;
  const showSetupPrompt = !setup && !setupDismissed;

  // Any edit to the task list makes the current schedule stale.
  function changeTasks(next: FlexTask[]) {
    setTasks(next);
    setSchedule(null);
    setError(null);
    setCommitted(false);
  }

  function changeSetup(next: Partial<SetupChoice>) {
    setSetupChoice(next);
    setCommitted(false);
  }

  // Items the user confirmed from the command bar.
  function addFromCoach(newTasks: FlexTask[], newTrips: Trip[], newSetup?: Partial<CustomerSetup>) {
    if (newTasks.length) changeTasks([...tasks, ...newTasks]);
    if (newTrips.length) {
      setTrips([...trips, ...newTrips]);
      setCommitted(false);
    }
    if (newSetup) changeSetup(mergeSetup(setupChoice, newSetup));
    const parts = [
      newTasks.length && `${newTasks.length} appliance${newTasks.length > 1 ? "s" : ""}`,
      newTrips.length && `${newTrips.length} trip${newTrips.length > 1 ? "s" : ""}`,
      newSetup && "your setup",
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
      const res = await commitPlan({ tasks, trips, routine, eventIds: joinedIds, setup: choiceComplete ? setup : undefined });
      const pending = res.lines.filter((l) => l.status === "pending").reduce((s, l) => s + l.points, 0);
      showToast(`Plan committed · +${res.earned} GridPoints${pending ? ` · ${pending} pending` : ""}`);
      setCommitted(true);
      setStatus(await getMe());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not commit plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Nav />
      <AppShell tab={tab} onTab={setTab} points={status?.points ?? MOCK_HOUSEHOLD.points}>
        {tab === "today" && showSetupPrompt && (
          <SetupCard choice={setupChoice} onChange={changeSetup} onDismiss={() => setSetupDismissed(true)} />
        )}
        {tab === "today" && <CommandBar onConfirm={addFromCoach} />}
        {tab === "today" &&
          (rate ? (
            <>
              <BestTime rate={rate} />
              <DayRibbon rate={rate} schedule={schedule ?? []} />
              <ValueCard setup={setup} status={status} schedule={schedule ?? []} />
              {status?.settlement && <SettlementCard settlement={status.settlement} />}
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
            setup={setupChoice}
            onRoutineChange={(r) => {
              setRoutine(r);
              setCommitted(false);
            }}
            onTripsChange={(t) => {
              setTrips(t);
              setCommitted(false);
            }}
            onSetupChange={changeSetup}
          />
        )}

        {tab === "rewards" && <RewardsTab status={status} onPlan={() => setTab("plan")} />}
      </AppShell>
      {toast}
    </>
  );
}
