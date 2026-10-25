// lib/quiet.ts — quiet hours for noisy appliances (owner: A)
// Nobody runs a dryer at 5 AM: it's loud, and fire-safety advice says not to run one while
// asleep. Dishwashers stay allowed overnight (they're quiet; utilities recommend it).
// TO TURN OFF: set QUIET_APPLIANCES = [].
import type { Appliance, FlexTask, Hour } from "@/lib/types";

export const QUIET_APPLIANCES: Appliance[] = ["dryer"];
export const QUIET_FROM = 22; // 10 PM
export const QUIET_TO = 7; // 7 AM (exclusive)

function isQuietClock(h: Hour): boolean {
  const c = h % 24;
  return c >= QUIET_FROM || c < QUIET_TO;
}

// True if running `task` for `hours` from `start` would break its quiet hours.
export function breaksQuietHours(task: FlexTask, start: Hour, hours: number): boolean {
  if (!task.appliance || !QUIET_APPLIANCES.includes(task.appliance)) return false;
  for (let i = 0; i < hours; i++) if (isQuietClock(start + i)) return true;
  return false;
}
