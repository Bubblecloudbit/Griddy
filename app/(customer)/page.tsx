// app/(customer)/page.tsx — customer app (owner: B). DESIGN.md §5 + PLAN.md §7a
// Tabs: Today (ribbon, value card, settlement) · Plan (appliance cards) · Week (setup, routine, trips) · Rewards.
"use client";

import { useEffect, useRef, useState } from "react";
import type { CustomerSetup, FlexEvent, FlexTask, MyStatus, RatePlan, ScheduledTask, Trip, WeeklyRoutine } from "@/lib/types";
import { Nav, useToast } from "@/components/ui";
import { MOCK_HOUSEHOLD, MOCK_ROUTINE } from "@/lib/mock";
import { optimize, commitPlan, getEvents, getMe, getRates, saveSetup } from "@/components/customer/client";
import { AppShell, type Tab } from "@/components/customer/AppShell";
import { DayRibbon } from "@/components/customer/DayRibbon";
import { BestTime } from "@/components/customer/TodaySummary";
import { PlanTab } from "@/components/customer/PlanTab";
import { WeekTab } from "@/components/customer/WeekTab";
import { FlexEventBanner } from "@/components/customer/FlexEventBanner";
import { CommandBar } from "@/components/customer/CommandBar";
import { RewardsTab } from "@/components/customer/RewardsTab";
import { SetupCard, SetupSummary, fromSetup, toSetup, type SetupChoice } from "@/components/customer/SetupCard";
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
  const [savingSetup, setSavingSetup] = useState(false);
  // Setup saves in flight, the latest one's number, and when the last one finished.
  const setupSaves = useRef({ inFlight: 0, latest: 0, lastDoneAt: 0 });
  const { showToast, toast } = useToast();

  // After a reload, show the setup that's on file instead of an empty card.
  const savedSetup = status?.setup;
  useEffect(() => {
    if (savedSetup) setSetupChoice((c) => (c.rate === undefined && c.measure === undefined ? fromSetup(savedSetup) : c));
  }, [savedSetup]);

  useEffect(() => {
    getRates()
      .then(setRate)
      .catch((e) => setRateError(e instanceof Error ? e.message : "Could not load rates."));
  }, []);

  // Poll Flex Events and Jordan's own status. A failed poll just keeps the last value.
  // A status poll that started before the latest setup save finished is stale: drop it,
  // so it can't overwrite the setup the user just saved.
  useEffect(() => {
    const load = () => {
      getEvents().then(setEvents).catch(() => {});
      const startedAt = Date.now();
      getMe()
        .then((s) => {
          if (setupSaves.current.inFlight === 0 && startedAt > setupSaves.current.lastDoneAt) setStatus(s);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Newest event that hasn't ended yet on the demo clock.
  const upcomingEvent = events.filter((e) => e.endHour > DEMO_NOW).at(-1) ?? null;
  const choiceComplete = setupChoice.rate !== undefined && setupChoice.measure !== undefined;
  const setup = choiceComplete ? toSetup(setupChoice as SetupChoice) : status?.setup;
  // Today's prompt stays until the setup is actually on file (so "Saving…/Saved" and any error show).
  const showSetupPrompt = !savedSetup && !setupDismissed;

  // Any edit to the task list makes the current schedule stale.
  function changeTasks(next: FlexTask[]) {
    setTasks(next);
    setSchedule(null);
    setError(null);
    setCommitted(false);
  }

  // Saves as soon as both answers are picked. If a plan is already committed, the server
  // redoes its pending estimate for the new setup. Only the latest of overlapping saves is
  // applied. Returns false if the save failed. `quiet` skips the toast (the caller shows one).
  async function changeSetup(next: Partial<SetupChoice>, quiet = false): Promise<boolean> {
    setSetupChoice(next);
    if (next.rate === undefined || next.measure === undefined) return true;
    const saves = setupSaves.current;
    const mine = ++saves.latest;
    saves.inFlight += 1;
    setSavingSetup(true);
    try {
      const fresh = await saveSetup(toSetup(next as SetupChoice));
      if (mine === saves.latest) setStatus(fresh);
      if (!quiet) showToast("Setup saved");
      return true;
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not save setup.");
      return false;
    } finally {
      saves.inFlight -= 1;
      saves.lastDoneAt = Date.now();
      if (saves.inFlight === 0) setSavingSetup(false);
    }
  }

  // Items the user confirmed from the command bar. One toast, after the setup save (if any).
  async function addFromCoach(newTasks: FlexTask[], newTrips: Trip[], newSetup?: Partial<CustomerSetup>) {
    if (newTasks.length) changeTasks([...tasks, ...newTasks]);
    if (newTrips.length) {
      setTrips([...trips, ...newTrips]);
      setCommitted(false);
    }
    const setupSaved = newSetup ? await changeSetup(mergeSetup(setupChoice, newSetup), true) : false;
    if (newSetup && !setupSaved) return; // changeSetup already showed the error
    const parts = [
      newTasks.length && `${newTasks.length} appliance${newTasks.length > 1 ? "s" : ""}`,
      newTrips.length && `${newTrips.length} trip${newTrips.length > 1 ? "s" : ""}`,
      setupSaved && "your setup",
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
          <SetupCard choice={setupChoice} onChange={changeSetup} onDismiss={() => setSetupDismissed(true)} saved={savedSetup} saving={savingSetup} />
        )}
        {tab === "today" && savedSetup && <SetupSummary setup={savedSetup} onChange={() => setTab("week")} />}
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
            savedSetup={savedSetup}
            savingSetup={savingSetup}
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
