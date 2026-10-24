// lib/ai/rules.ts — Rule-based coach (owner: D)
// Keyword parsing that turns plain English into FlexTasks, Trips, and LoadFlags.
// No API key, no network: this is what keeps the coach working in the demo.
//
// Clock (PLAN.md §6): hour 0 = midnight Sun Oct 25, horizon 72 h (Sun–Tue). Tasks are planned
// for Monday (PLAN_DAY), so "charge my car by 7 AM" = plug in Mon 4 PM (h40), ready Tue 7 AM (h55).
// Trips are dates inside the 7-day outlook (Oct 25–31), not flags.
import type { Appliance as ApplianceId, FlexTask, Hour, LoadFlag, Trip } from "@/lib/types";
import { DAY_NAMES, DEMO_DAY_0, HORIZON_HOURS, OUTLOOK_DAYS, PLAN_DAY, dayLabel, weekdayOf } from "@/lib/config";
import { MOCK_ROUTINE } from "@/lib/mock";
import tou from "@/data/real/aep_tou.json";
import type { CoachResult } from "@/lib/ai/coach";

// ---------------------------------------------------------------------------
// Appliance catalog — simulated energy numbers, matching lib/mock.ts
// ---------------------------------------------------------------------------
interface Appliance {
  id: ApplianceId;
  label: string;
  kWh: number;
  powerKW: number;
  pattern: RegExp;
}

const APPLIANCES: Appliance[] = [
  { id: "ev", label: "EV Charging", kWh: 10, powerKW: 7.2, pattern: /\b(ev|car|tesla|vehicle|charg(e|ing))\b/ },
  { id: "dishwasher", label: "Dishwasher", kWh: 1.2, powerKW: 1.5, pattern: /\bdish(es|washer)?\b/ },
  { id: "other", label: "Washer", kWh: 1.0, powerKW: 0.5, pattern: /\b(washer|washing machine|laundry)\b/ },
  { id: "dryer", label: "Dryer", kWh: 1.5, powerKW: 3.0, pattern: /\b(dryer|dry)\b/ },
  { id: "water_heater", label: "Water Heater", kWh: 2.0, powerKW: 4.5, pattern: /\bwater heater\b/ },
];

const AWAY_PATTERN = /\b(away|vacation|out of town|traveling|travelling|trip)\b/;
const HIGH_LOAD_PATTERN = /\b(guests|party|hosting|project|space heater|company)\b/;
const TIME_PATTERN = /\b(after|from|starting|by|before|until)\s+(\d|noon|midnight)/;

const HIGH_LOAD_DELTA_KW = 2.0; // simulated: extra load for guests or a big project
const PLAN_DAY_START: Hour = PLAN_DAY * 24; // Mon 12 AM
const DEFAULT_PLUG_IN = MOCK_ROUTINE.plugInHour; // 4 PM, the demo routine (Early shift)
const SUNDAY_EVENING: Hour = 18; // the demo opens Sun 6 PM ("tonight" starts here)

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------
function toClockHour(num: number, suffix?: string): number {
  if (suffix === "pm" && num < 12) return num + 12;
  if (suffix === "am" && num === 12) return 0;
  return num % 24;
}

// First horizon hour at or after `from` whose clock hour matches.
function nextHourAtOrAfter(clockHour: number, from: Hour): Hour {
  let h = Math.floor(from / 24) * 24 + clockHour;
  while (h < from) h += 24;
  return h;
}

// Finds "<keyword> 7 am", "<keyword> 3:30 pm", "<keyword> noon". With roundUp, 3:30 → 4.
function findClockHour(clause: string, keywords: string, roundUp = false): number | null {
  const named = clause.match(new RegExp(`\\b(${keywords})\\s+(noon|midnight)\\b`));
  if (named) return named[2] === "noon" ? 12 : 0;
  const m = clause.match(new RegExp(`\\b(${keywords})\\s+(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?\\b`));
  if (!m) return null;
  const clock = toClockHour(Number(m[2]), m[4]);
  return roundUp && Number(m[3] ?? 0) > 0 ? (clock + 1) % 24 : clock;
}

// "4 PM Mon", "7 AM Tue"
export function formatHour(h: Hour): string {
  if (h >= HORIZON_HOURS) return `the end of ${DAY_NAMES[weekdayOf(HORIZON_HOURS - 1)]}`;
  const clock = h % 24;
  const label = clock === 0 ? "12 AM" : clock === 12 ? "12 PM" : clock < 12 ? `${clock} AM` : `${clock - 12} PM`;
  return `${label} ${DAY_NAMES[weekdayOf(h)]}`;
}

function clockText(clock: number): string {
  if (clock === 0) return "12 AM";
  if (clock === 12) return "12 PM";
  return clock < 12 ? `${clock} AM` : `${clock - 12} PM`;
}

// The real AEP Ohio window for our demo week (summer schedule, weekdays): "2 PM–6 PM".
function peakWindowText(): string {
  const peak = tou.summer.peakClockHours;
  return `${clockText(Math.min(...peak))}–${clockText(Math.max(...peak) + 1)}`;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
function durationHours(a: Appliance): number {
  return Math.ceil(a.kWh / a.powerKW);
}

// `plugIn` is the default earliest start: "home by …" if the message says so, else the routine.
function parseTask(clause: string, plugIn: Hour): FlexTask | string | null {
  const appliance = APPLIANCES.find((a) => a.pattern.test(clause));
  if (!appliance) return null;

  const after = findClockHour(clause, "after|from|starting");
  const by = findClockHour(clause, "by|before|until");
  const earliestStart = after === null ? plugIn : nextHourAtOrAfter(after, PLAN_DAY_START);
  const deadline =
    by === null ? Math.min(earliestStart + 24, HORIZON_HOURS) : nextHourAtOrAfter(by, earliestStart + 1);

  const needed = durationHours(appliance);
  if (deadline > HORIZON_HOURS) {
    return `${appliance.label}: plans can run until ${formatHour(HORIZON_HOURS)}. Try an earlier ready-by time.`;
  }
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
    appliance: appliance.id,
  };
}

// "dryer and dishwasher after 9 PM": a clause with an appliance but no time borrows the
// time words of the next appliance clause that has them.
function withSharedTimes(clauses: string[]): string[] {
  return clauses.map((clause, i) => {
    if (!APPLIANCES.some((a) => a.pattern.test(clause)) || TIME_PATTERN.test(clause)) return clause;
    const next = clauses.slice(i + 1).find((c) => TIME_PATTERN.test(c) && APPLIANCES.some((a) => a.pattern.test(c)));
    const times = next?.match(/\b(after|from|starting|by|before|until)\s+\S+(\s*(am|pm))?/g);
    return times ? `${clause} ${times.join(" ")}` : clause;
  });
}

// ---------------------------------------------------------------------------
// Trips (7-day outlook, Oct 25–31)
// ---------------------------------------------------------------------------
const DAY_PATTERNS = [
  /\b(sun|sunday)\b/, /\b(mon|monday)\b/, /\b(tue|tues|tuesday)\b/, /\b(wed|wednesday)\b/,
  /\b(thu|thur|thurs|thursday)\b/, /\b(fri|friday)\b/, /\b(sat|saturday)\b/,
];

// Day indexes from DEMO_DAY_0, in the order they appear. DEMO_DAY_0 is a Sunday, so weekday = index.
function findDays(clause: string): number[] {
  const found = DAY_PATTERNS.flatMap((p, day) => {
    const m = clause.match(p);
    return m?.index === undefined ? [] : [{ day, at: m.index }];
  });
  if (/\btomorrow\b/.test(clause)) found.push({ day: PLAN_DAY, at: clause.indexOf("tomorrow") });
  if (/\bweekend\b/.test(clause)) found.push({ day: OUTLOOK_DAYS - 1, at: clause.indexOf("weekend") });
  return found.sort((a, b) => a.at - b.at).map((f) => f.day);
}

function isoDate(day: number): string {
  const date = new Date(`${DEMO_DAY_0}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + day);
  return date.toISOString().slice(0, 10);
}

function parseTrip(clause: string): Trip | string | null {
  if (!AWAY_PATTERN.test(clause)) return null;
  const days = findDays(clause);
  if (days.length === 0) return 'Which days are you away? Try "away Thursday to Saturday."';

  const start = days[0];
  const end = days.length > 1 ? days[days.length - 1] : start;
  if (end < start) return `Trips can be planned through ${dayLabel(OUTLOOK_DAYS - 1)}. Try "away Thursday to Saturday."`;

  const label = start === end ? `Away ${DAY_NAMES[start]}` : `Away ${DAY_NAMES[start]}–${DAY_NAMES[end]}`;
  return { id: crypto.randomUUID(), label, startDate: isoDate(start), endDate: isoDate(end) };
}

// ---------------------------------------------------------------------------
// Extra-load flags (inside the 72 h horizon): [startHour, endHour), endHour exclusive
// ---------------------------------------------------------------------------
function parseFlag(clause: string): LoadFlag | null {
  if (!HIGH_LOAD_PATTERN.test(clause)) return null;
  const [startHour, endHour] = /\btonight\b/.test(clause)
    ? [SUNDAY_EVENING, PLAN_DAY_START]
    : [PLAN_DAY_START, PLAN_DAY_START + 24];
  return { id: crypto.randomUUID(), type: "high_load", startHour, endHour, deltaKW: HIGH_LOAD_DELTA_KW };
}

// ---------------------------------------------------------------------------
// Reply text
// ---------------------------------------------------------------------------
function describeTask(t: FlexTask): string {
  return `• ${t.label} (${t.kWh} kWh, simulated): any time from ${formatHour(t.earliestStart)} to ${formatHour(t.deadline)}.`;
}

function describeTrip(t: Trip): string {
  const range = t.startDate === t.endDate ? t.startDate : `${t.startDate} to ${t.endDate}`;
  return `• ${t.label} (${range}): your home's load is projected lower those days.`;
}

function describeFlag(f: LoadFlag): string {
  return `• Extra load from ${formatHour(f.startHour)} until ${formatHour(f.endHour)}: forecast +${f.deltaKW} kW (simulated).`;
}

const HELP_REPLY =
  'I can plan your big appliances and trips. Try: "Charge my car by 7 AM", ' +
  '"Run the dishwasher after 9 PM", or "I\'m away Thursday to Saturday".';

function buildReply(tasks: FlexTask[], trips: Trip[], flags: LoadFlag[], problems: string[]): string {
  if (tasks.length === 0 && trips.length === 0 && flags.length === 0) {
    return problems.length > 0 ? problems.join(" ") : HELP_REPLY;
  }
  const lines = ["Got it:", ...tasks.map(describeTask), ...trips.map(describeTrip), ...flags.map(describeFlag), ...problems];
  if (tasks.length > 0) {
    lines.push(
      `Peak hours are ${peakWindowText()} on weekdays (AEP Ohio). The planner picks cheaper hours inside each window.`
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
    .split(/[,;!?]|\.(?!\d)|\band\b|\bthen\b|\balso\b/)
    .map((c) => c.trim())
    .filter(Boolean);
}

// "I'm home by 3:30 PM" → plug in at 4 PM Monday. Otherwise the routine's plug-in hour.
function findPlugIn(clauses: string[]): Hour {
  for (const clause of clauses) {
    const home = findClockHour(clause, "home by|home at|home around|back by|back at|plug(?:ged)? in at", true);
    if (home !== null) return PLAN_DAY_START + home;
  }
  return PLAN_DAY_START + DEFAULT_PLUG_IN;
}

export function ruleBasedCoach(message: string): CoachResult {
  const clauses = withSharedTimes(splitClauses(message));
  const plugIn = findPlugIn(clauses);
  const tasks: FlexTask[] = [];
  const trips: Trip[] = [];
  const flags: LoadFlag[] = [];
  const problems: string[] = [];

  for (const clause of clauses) {
    const trip = parseTrip(clause);
    if (typeof trip === "string") problems.push(trip);
    else if (trip) {
      trips.push(trip);
      continue; // "away Thursday" is never also an appliance
    }

    const task = parseTask(clause, plugIn);
    if (typeof task === "string") problems.push(task);
    else if (task) tasks.push(task);

    const flag = parseFlag(clause);
    if (flag) flags.push(flag);
  }

  return {
    reply: buildReply(tasks, trips, flags, problems),
    tasks: tasks.length > 0 ? tasks : undefined,
    trips: trips.length > 0 ? trips : undefined,
    flags: flags.length > 0 ? flags : undefined,
  };
}
