// lib/outlook.ts — 7-day residential outlook, Sun Oct 25 – Sat Oct 31 (owner: A)
// Days 0–1 (Sun, Mon): the scheduled 72 h forecast. Days 2–6: PROJECTED from each home's
// routine, its Monday tasks repeated on weekdays, and its trips (PLAN.md §6, option a).
// Region-wide totals only (480 homes).
import type { FlexTask, Household } from "@/lib/types";
import { HORIZON_HOURS, OUTLOOK_DAYS, isWeekend, isoDate } from "@/lib/config";
import { duration, kwhInRunHour } from "@/lib/optimizer";
import { planArea } from "@/lib/forecast";
import { listNeighborhoods } from "@/lib/store";

export const WEEK_HOURS = OUTLOOK_DAYS * 24; // 168
const TRIP_FACTOR = 0.35; // a home on a trip still runs the fridge, HVAC setback, standby
const FIRST_PROJECTED_DAY = 2; // Tue; days 0–1 are scheduled, not projected

function onTrip(home: Household, day: number): boolean {
  const date = isoDate(day);
  return (home.trips ?? []).some((t) => t.startDate <= date && date <= t.endDate);
}

// A home's non-flexible load for a day past the 72 h horizon: weekdays look like its
// Monday, weekends like its Sunday (both already shaped by its routine).
function typicalDay(home: Household, day: number): number[] {
  const from = isWeekend(day * 24) ? 0 : 24;
  return home.baselineKW.slice(from, from + 24);
}

// Like addTaskLoad, but safe past the end of the week (late tasks are cut off).
function addTask(load: number[], task: FlexTask, start: number): void {
  for (let i = 0; i < duration(task); i++) {
    if (start + i < load.length) load[start + i] += kwhInRunHour(task, i);
  }
}

export interface WeekOutlook {
  baseline: number[]; // 168 h, kW: no GridShift, no knowledge of trips
  planned: number[]; // 168 h, kW: committed plans, routines, and trips
}

export function weekOutlook(): WeekOutlook {
  const baseline = new Array(WEEK_HOURS).fill(0);
  const planned = new Array(WEEK_HOURS).fill(0);

  for (const n of listNeighborhoods()) {
    const area = planArea(n, true);
    area.baseline.forEach((v, h) => (baseline[h] += v));
    area.planned.forEach((v, h) => (planned[h] += v));

    for (const home of area.homes) {
      // Non-flexible load for the days after the 72 h forecast (Wed–Sat).
      for (let day = HORIZON_HOURS / 24; day < OUTLOOK_DAYS; day++) {
        const away = onTrip(home, day) ? TRIP_FACTOR : 1;
        typicalDay(home, day).forEach((v, c) => {
          baseline[day * 24 + c] += v;
          planned[day * 24 + c] += v * away;
        });
      }
      // Repeat Monday's flexible tasks on Tue–Fri. Traveling homes skip them in the plan.
      for (let day = FIRST_PROJECTED_DAY; day < OUTLOOK_DAYS; day++) {
        if (isWeekend(day * 24)) continue;
        const shift = (day - 1) * 24;
        for (const task of home.tasks) {
          addTask(baseline, task, task.earliestStart + shift);
          if (!onTrip(home, day)) addTask(planned, task, (area.startOf.get(task) ?? task.earliestStart) + shift);
        }
      }
    }
  }
  return { baseline, planned };
}
