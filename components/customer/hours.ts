// components/customer/hours.ts — display helpers for the 72-hour horizon (owner: B)
// Hour 0 = midnight Sun Oct 25 (DEMO_DAY_0); 24–47 = Mon; 48–71 = Tue; 72 = midnight ending Tue.
import type { Hour, RatePlan } from "@/lib/types";
import { DAY_NAMES, HORIZON_HOURS, dayOf, isWeekend } from "@/lib/config";
import { isPeak } from "@/lib/rates";

export { HORIZON_HOURS };

// "4 PM"
export function clockLabel(h: Hour): string {
  const hour = h % 24;
  const ampm = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${ampm}`;
}

// "Mon 4 PM"
export function hourLabel(h: Hour): string {
  return `${DAY_NAMES[dayOf(h) % 7]} ${clockLabel(h)}`;
}

export function hourOptions(from: Hour, to: Hour): { value: number; label: string }[] {
  const options = [];
  for (let h = from; h <= to; h++) options.push({ value: h, label: hourLabel(h) });
  return options;
}

// Peak = the rate plan's clock window, on weekdays only when the plan says so.
// (Safe to keep once lib/rates isPeak checks weekdays itself.)
export function isPeakHour(rate: RatePlan, h: Hour): boolean {
  return isPeak(rate, h) && !(rate.weekdaysOnly && isWeekend(h));
}

export function money(n: number): string {
  return `$${n.toFixed(2)}`;
}
