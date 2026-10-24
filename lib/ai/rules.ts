// lib/ai/rules.ts — Rule-based coach (owner: D)
// Keyword parsing that turns plain English into FlexTasks and LoadFlags.
// No API key, no network: this is what keeps the coach working in the demo.
import type { FlexTask, Hour, LoadFlag } from "@/lib/types";
import { MOCK_RATE } from "@/lib/mock";
import type { CoachResult } from "@/lib/ai/coach";

// ---------------------------------------------------------------------------
// Appliance catalog — simulated energy numbers, matching lib/mock.ts
// ---------------------------------------------------------------------------
interface Appliance {
  label: string;
  kWh: number;
  powerKW: number;
  pattern: RegExp;
}

const APPLIANCES: Appliance[] = [
  { label: "EV Charging", kWh: 10, powerKW: 7.2, pattern: /\b(ev|car|tesla|vehicle|charg(e|ing))\b/ },
  { label: "Dishwasher", kWh: 1.2, powerKW: 1.5, pattern: /\bdish(es|washer)?\b/ },
  { label: "Washer", kWh: 1.0, powerKW: 0.5, pattern: /\b(washer|washing machine|laundry)\b/ },
  { label: "Dryer", kWh: 1.5, powerKW: 3.0, pattern: /\b(dryer|dry)\b/ },
  { label: "Water Heater", kWh: 2.0, powerKW: 4.5, pattern: /\bwater heater\b/ },
];

const AWAY_PATTERN = /\b(away|vacation|out of town|traveling|trip)\b/;
const HIGH_LOAD_PATTERN = /\b(guests|party|hosting|project|space heater|company)\b/;

const AWAY_DELTA_KW = -0.5; // simulated, matches PLAN.md §13
const HIGH_LOAD_DELTA_KW = 2.0; // simulated: extra load for guests or a big project

const HORIZON_END: Hour = 48; // exclusive end of the 48-hour horizon, like deadline and flag endHour

// ---------------------------------------------------------------------------
// Time helpers (Hour 0 = midnight today, 24–47 = tomorrow)
// ---------------------------------------------------------------------------
function toClockHour(num: number, suffix?: string): number {
  if (suffix === "pm" && num < 12) return num + 12;
  if (suffix === "am" && num === 12) return 0;
  return num % 24;
}

// First Hour at or after `from` whose clock hour matches.
function nextHourAtOrAfter(clockHour: number, from: Hour): Hour {
  return clockHour >= from ? clockHour : clockHour + 24;
}

// Finds "<keyword> 7 am", "<keyword> 19:00", "<keyword> noon" and returns the clock hour.
function findClockHour(clause: string, keywords: string): number | null {
  const named = clause.match(new RegExp(`\\b(${keywords})\\s+(noon|midnight)\\b`));
  if (named) return named[2] === "noon" ? 12 : 0;
  const m = clause.match(new RegExp(`\\b(${keywords})\\s+(\\d{1,2})(?::\\d{2})?\\s*(am|pm)?\\b`));
  if (!m) return null;
  return toClockHour(Number(m[2]), m[3]);
}

export function formatHour(h: Hour): string {
  if (h >= HORIZON_END) return "the end of tomorrow";
  const clock = h % 24;
  const label = clock === 0 ? "12 AM" : clock === 12 ? "12 PM" : clock < 12 ? `${clock} AM` : `${clock - 12} PM`;
  return h >= 24 ? `${label} tomorrow` : label;
}

function peakWindowText(): string {
  const peak = MOCK_RATE.peakHours;
  return `${formatHour(Math.min(...peak))}–${formatHour(Math.max(...peak) + 1)}`;
}

// ---------------------------------------------------------------------------
// Clause parsers
// ---------------------------------------------------------------------------
function durationHours(a: Appliance): number {
  return Math.ceil(a.kWh / a.powerKW);
}

function parseTask(clause: string, now: Hour): FlexTask | string | null {
  const appliance = APPLIANCES.find((a) => a.pattern.test(clause));
  if (!appliance) return null;

  const after = findClockHour(clause, "after|from|starting");
  const by = findClockHour(clause, "by|before|until");
  const earliestStart = after === null ? now : nextHourAtOrAfter(after, now);
  const deadline = by === null ? Math.min(earliestStart + 24, HORIZON_END) : nextHourAtOrAfter(by, earliestStart + 1);

  const needed = durationHours(appliance);
  if (deadline - earliestStart < needed) {
    return `${appliance.label} needs about ${needed} h, which doesn't fit between ${formatHour(earliestStart)} and ${formatHour(deadline)}.`;
  }

  return {
    id: crypto.randomUUID(),
    label: appliance.label,
    kWh: appliance.kWh,
    powerKW: appliance.powerKW,
    earliestStart,
    deadline,
  };
}

// [startHour, endHour) — endHour is exclusive, as in lib/forecast.ts.
function flagWindow(clause: string, now: Hour): [Hour, Hour] {
  if (/\btomorrow\b/.test(clause)) return [24, HORIZON_END];
  if (/\btonight\b/.test(clause)) return [now, 24];
  return [now, HORIZON_END]; // "this weekend", "for a few days": cover the whole 48 h horizon
}

function parseFlag(clause: string, now: Hour): LoadFlag | null {
  const type = AWAY_PATTERN.test(clause) ? "away" : HIGH_LOAD_PATTERN.test(clause) ? "high_load" : null;
  if (!type) return null;

  const [startHour, endHour] = flagWindow(clause, now);
  const deltaKW = type === "away" ? AWAY_DELTA_KW : HIGH_LOAD_DELTA_KW;
  return { id: crypto.randomUUID(), type, startHour, endHour, deltaKW };
}

// ---------------------------------------------------------------------------
// Reply text
// ---------------------------------------------------------------------------
function describeTask(t: FlexTask): string {
  return `• ${t.label} (${t.kWh} kWh, simulated): any time from ${formatHour(t.earliestStart)} to ${formatHour(t.deadline)}.`;
}

function describeFlag(f: LoadFlag): string {
  const what = f.type === "away" ? "Away" : "Extra load";
  const sign = f.deltaKW > 0 ? "+" : "";
  return `• ${what} from ${formatHour(f.startHour)} until ${formatHour(f.endHour)}: forecast ${sign}${f.deltaKW} kW (simulated).`;
}

const HELP_REPLY =
  "I can plan your big appliances. Try: \"Charge my car by 7 AM\", \"Run the dishwasher after 9 PM\", " +
  "or \"I'm away tomorrow\".";

function buildReply(tasks: FlexTask[], flags: LoadFlag[], problems: string[]): string {
  if (tasks.length === 0 && flags.length === 0) {
    return problems.length > 0 ? problems.join(" ") : HELP_REPLY;
  }
  const lines = ["Got it:", ...tasks.map(describeTask), ...flags.map(describeFlag), ...problems];
  if (tasks.length > 0) {
    lines.push(
      `Peak hours (${peakWindowText()}) cost more on the illustrative rate, so the planner will pick cheaper hours inside each window.`
    );
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
function splitClauses(message: string): string[] {
  const normalized = message.toLowerCase().replace(/a\.m\./g, "am").replace(/p\.m\./g, "pm");
  return normalized
    .split(/[,;.!?]|\band\b|\bthen\b|\balso\b/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export function ruleBasedCoach(message: string, now: Hour = new Date().getHours()): CoachResult {
  const tasks: FlexTask[] = [];
  const flags: LoadFlag[] = [];
  const problems: string[] = [];

  for (const clause of splitClauses(message)) {
    const task = parseTask(clause, now);
    if (typeof task === "string") problems.push(task);
    else if (task) tasks.push(task);

    const flag = parseFlag(clause, now);
    if (flag) flags.push(flag);
  }

  return {
    reply: buildReply(tasks, flags, problems),
    tasks: tasks.length > 0 ? tasks : undefined,
    flags: flags.length > 0 ? flags : undefined,
  };
}
