// components/customer/hours.ts — display helpers for the 48-hour horizon (owner: B)
// Hour 0 = midnight today, 24–47 = tomorrow, 48 = midnight at the end of tomorrow.

export function clockLabel(h: number): string {
  const hour = h % 24;
  const ampm = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${ampm}`;
}

export function hourLabel(h: number): string {
  if (h >= 48) return "12 AM (day after)";
  return `${clockLabel(h)} ${h >= 24 ? "tomorrow" : "today"}`;
}

export function hourOptions(from: number, to: number): { value: number; label: string }[] {
  const options = [];
  for (let h = from; h <= to; h++) options.push({ value: h, label: hourLabel(h) });
  return options;
}

export function money(n: number): string {
  return `$${n.toFixed(2)}`;
}
