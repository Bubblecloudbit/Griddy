// lib/routines.ts — weekly routine presets (owner: A)
// Browser-safe: B's Week tab imports ROUTINE_PRESETS; the community generator uses the same ones.
import type { Hour, WeeklyRoutine } from "@/lib/types";
import { weekdayOf } from "@/lib/config";

const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon–Fri

export const ROUTINE_PRESETS: Record<WeeklyRoutine["preset"], { label: string; summary: string; routine: WeeklyRoutine }> = {
  early_shift: {
    label: "Early shift",
    summary: "Away weekdays 6 AM – 3 PM, car plugged in at 4 PM",
    routine: { preset: "early_shift", awayBlocks: [{ days: WEEKDAYS, start: 6, end: 15 }], plugInHour: 16 },
  },
  commuter: {
    label: "Commuter",
    summary: "Away weekdays 8 AM – 5 PM, car plugged in at 5 PM",
    routine: { preset: "commuter", awayBlocks: [{ days: WEEKDAYS, start: 8, end: 17 }], plugInHour: 17 },
  },
  home_all_day: {
    label: "Home all day",
    summary: "Home most of the day, car plugged in at 2 PM",
    routine: { preset: "home_all_day", awayBlocks: [], plugInHour: 14 },
  },
  night_shift: {
    label: "Night shift",
    summary: "Away weeknights 9 PM – 7 AM, car plugged in at 3 PM",
    routine: {
      preset: "night_shift",
      awayBlocks: [{ days: WEEKDAYS, start: 0, end: 7 }, { days: [0, 1, 2, 3, 4], start: 21, end: 24 }],
      plugInHour: 15,
    },
  },
  custom: {
    label: "Custom",
    summary: "Set your own away hours and plug-in time",
    routine: { preset: "custom", awayBlocks: [{ days: WEEKDAYS, start: 8, end: 17 }], plugInHour: 17 },
  },
};

// True if the routine says the home is empty at horizon hour h.
export function isAwayAt(routine: WeeklyRoutine, h: Hour): boolean {
  const day = weekdayOf(h);
  const clock = h % 24;
  return routine.awayBlocks.some((b) => b.days.includes(day) && clock >= b.start && clock < b.end);
}
