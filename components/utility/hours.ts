// components/utility/hours.ts — hour formatting for the AEP view (owner: C)
// v2 clock (lib/config.ts): hour 0 = midnight Sun Oct 25; 72 h horizon (Sun, Mon, Tue).
import { DAY_NAMES, HORIZON_HOURS, dayOf } from "@/lib/config";

export function clockLabel(h: number): string {
  const hour = h % 24;
  const ampm = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${ampm}`;
}

export function dayLabel(h: number): string {
  return DAY_NAMES[dayOf(h) % 7];
}

// "Mon 5 PM"
export function fullHourLabel(h: number): string {
  return `${dayLabel(h)} ${clockLabel(h)}`;
}

// Short axis tick: "6 AM", with the day name at each midnight.
export function axisTick(h: number): string {
  return h % 24 === 0 ? dayLabel(h) : clockLabel(h);
}

export const LAST_HOUR = HORIZON_HOURS - 1;

// Every hour in the horizon, for <select> options.
export const ALL_HOURS: number[] = Array.from({ length: HORIZON_HOURS }, (_, i) => i);

// "Mon 4–6 PM" (or "Mon 11 PM–1 AM" across noon/midnight). endHour is exclusive.
export function rangeLabel(start: number, end: number): string {
  const s = clockLabel(start);
  const e = clockLabel(end);
  const sameHalf = s.slice(-2) === e.slice(-2);
  return `${dayLabel(start)} ${sameHalf ? s.slice(0, -3) : s}–${e}`;
}
