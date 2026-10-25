// components/customer/appliances.ts — appliance presets for the Plan tab (owner: B)
// Typical numbers (illustrative). Times are horizon hours: Mon = 24–47, Tue = 48–71.
import type { FlexTask } from "@/lib/types";
import { PLAN_DAY } from "@/lib/config";

export type Appliance = NonNullable<FlexTask["appliance"]>;

interface Preset {
  label: string;
  kWh: number;
  powerKW: number;
  readyBy: number; // clock hour; past midnight means the next morning
  startOffset: number; // hours after the routine's plug-in hour
  startLabel: string; // earliest it can run: only a car is "plugged in"
  endLabel: string; // when it must be finished
}

const PRESETS: Record<Appliance, Preset> = {
  ev: { label: "EV charging", kWh: 10, powerKW: 7.2, readyBy: 24 + 7, startOffset: 0, startLabel: "Plugged in", endLabel: "Ready by" }, // ready Tue 7 AM
  dryer: { label: "Dryer", kWh: 1.5, powerKW: 3, readyBy: 24, startOffset: 0, startLabel: "Loaded at", endLabel: "Done by" }, // done by midnight
  dishwasher: { label: "Dishwasher", kWh: 1.2, powerKW: 1.5, readyBy: 24 + 7, startOffset: 3, startLabel: "Loaded at", endLabel: "Clean by" }, // after dinner, clean by breakfast
  water_heater: { label: "Water heater", kWh: 2, powerKW: 4.5, readyBy: 24 + 6, startOffset: -2, startLabel: "Can start", endLabel: "Hot water by" }, // hot for Tue 6 AM showers
  other: { label: "Other", kWh: 1, powerKW: 1, readyBy: 24, startOffset: 0, startLabel: "Can start", endLabel: "Done by" },
};

// Field labels for a task's earliest start and deadline. Coach tasks without a known
// appliance (e.g. "Washer") get the generic pair.
export function timeLabels(task: FlexTask): { start: string; end: string } {
  const p = PRESETS[task.appliance ?? "other"];
  return { start: p.startLabel, end: p.endLabel };
}

export const APPLIANCE_CHIPS: { kind: Appliance; label: string }[] = [
  { kind: "ev", label: "EV" },
  { kind: "dryer", label: "Dryer" },
  { kind: "dishwasher", label: "Dishwasher" },
  { kind: "water_heater", label: "Water heater" },
  { kind: "other", label: "Other" },
];

// Our sentence-case label for a task, whoever created it ("EV Charging" from the coach → "EV charging").
export function taskLabel(task: FlexTask): string {
  return task.appliance && task.appliance !== "other" ? PRESETS[task.appliance].label : task.label;
}

// A new task on the plan day, starting at the routine's plug-in hour (clock hour, e.g. 16).
export function newTask(kind: Appliance, plugInHour: number): FlexTask {
  const p = PRESETS[kind];
  const dayStart = PLAN_DAY * 24;
  return {
    id: `t-${kind}-${Date.now()}`,
    label: p.label,
    appliance: kind,
    kWh: p.kWh,
    powerKW: p.powerKW,
    earliestStart: dayStart + plugInHour + p.startOffset,
    deadline: dayStart + p.readyBy,
  };
}
