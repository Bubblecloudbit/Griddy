// components/utility/hours.ts — hour formatting for the AEP view (owner: C)
// Hour convention (PLAN.md §7): 0..47, hour 0 = midnight today, 24–47 = tomorrow.

export function clockLabel(h: number): string {
  const hour = h % 24;
  const ampm = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${ampm}`;
}

export function dayLabel(h: number): string {
  return h < 24 ? "Today" : "Tomorrow";
}

// "Tomorrow 5 PM"
export function fullHourLabel(h: number): string {
  return `${dayLabel(h)} ${clockLabel(h)}`;
}

// Short axis tick: "12 AM", "6 AM"... with a day marker at midnight.
export function axisTick(h: number): string {
  if (h % 24 === 0) return h === 0 ? "Today" : "Tmrw";
  return clockLabel(h);
}

// Every hour 0..47, for <select> options.
export const ALL_HOURS: number[] = Array.from({ length: 48 }, (_, i) => i);
