// components/customer/hours.ts — display helpers for the 72-hour horizon (owner: B)
// Hour 0 = midnight Sun Oct 25 (DEMO_DAY_0); 24–47 = Mon; 48–71 = Tue; 72 = midnight ending Tue.
import type { Hour } from "@/lib/types";
import { DAY_NAMES, DEMO_DAY_0, HORIZON_HOURS, OUTLOOK_DAYS, dayLabel, dayOf } from "@/lib/config";

export { HORIZON_HOURS };

// The demo is fixed in time: Jordan opens the app Sunday evening (PLAN.md §3).
export const DEMO_NOW: Hour = 19; // Sun 7 PM

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

// Clock hours [14, 15, 16, 17] → "2–6 PM"; [22, 23, 0] style wraps aren't needed for AEP windows.
export function windowLabel(clockHours: number[]): string {
  const start = Math.min(...clockHours);
  const end = Math.max(...clockHours) + 1;
  const [startNum, startAmPm] = clockLabel(start).split(" ");
  const endLabel = clockLabel(end);
  return startAmPm === endLabel.split(" ")[1] ? `${startNum}–${endLabel}` : `${clockLabel(start)}–${endLabel}`;
}

export function hourOptions(from: Hour, to: Hour): { value: number; label: string }[] {
  const options = [];
  for (let h = from; h <= to; h++) options.push({ value: h, label: hourLabel(h) });
  return options;
}

// The 7-day outlook as ISO dates: ["2026-10-25", …, "2026-10-31"].
export function outlookDates(): string[] {
  return Array.from({ length: OUTLOOK_DAYS }, (_, d) => {
    const date = new Date(`${DEMO_DAY_0}T12:00:00`);
    date.setDate(date.getDate() + d);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${mm}-${dd}`;
  });
}

// "2026-10-29" → "Thu Oct 29"
export function dateLabel(iso: string): string {
  return dayLabel(outlookDates().indexOf(iso));
}

export function money(n: number): string {
  return `$${n.toFixed(2)}`;
}
