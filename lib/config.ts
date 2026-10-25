// lib/config.ts — fixed demo clock (owner: A). See PLAN.md §6.
// Fixing the date keeps the demo identical no matter when it runs.
import type { Hour } from "@/lib/types";

export const DEMO_DAY_0 = "2026-10-25"; // Sunday. Hour 0 = midnight at the start of this day.
export const HORIZON_HOURS = 72; // Sun (0–23), Mon (24–47, "tomorrow" on every chart), Tue (48–71)
export const PLAN_DAY = 1; // Monday Oct 26: the day every chart shows
export const DEMO_NOW = 19; // Sun 7 PM: "now" on the demo clock (matches the customer app)
export const OUTLOOK_DAYS = 7; // Sun Oct 25 – Sat Oct 31

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Day index from DEMO_DAY_0 (0 = Sun Oct 25, 1 = Mon, 2 = Tue, …).
export function dayOf(h: Hour): number {
  return Math.floor(h / 24);
}

// 0 = Sun .. 6 = Sat. DEMO_DAY_0 is a Sunday, so this is just the day index mod 7.
export function weekdayOf(h: Hour): number {
  return dayOf(h) % 7;
}

export function isWeekend(h: Hour): boolean {
  const d = weekdayOf(h);
  return d === 0 || d === 6;
}

// Compact clock-hour label for axes and heat map columns: 0 → "12a", 14 → "2p".
export function hourLabel(h: Hour): string {
  const c = h % 24;
  const suffix = c < 12 ? "a" : "p";
  return `${c % 12 === 0 ? 12 : c % 12}${suffix}`;
}

// "2026-10-29" for a day index from DEMO_DAY_0. Compare with Trip dates as plain strings.
export function isoDate(day: number): string {
  const date = new Date(`${DEMO_DAY_0}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + day);
  return date.toISOString().slice(0, 10);
}

// "Mon Oct 26" for a day index from DEMO_DAY_0.
export function dayLabel(day: number): string {
  const date = new Date(`${DEMO_DAY_0}T12:00:00`);
  date.setDate(date.getDate() + day);
  return `${DAY_NAMES[date.getDay()]} ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
