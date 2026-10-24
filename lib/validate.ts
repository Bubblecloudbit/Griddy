// lib/validate.ts — request body checks for API routes (owner: A)
// Each parser returns the clean value, or throws BadRequest with a message for the UI.
import { NextResponse } from "next/server";
import type { Appliance, FlexTask, LoadFlag, Trip, WeeklyRoutine } from "@/lib/types";
import { HORIZON_HOURS } from "@/lib/rates";

const APPLIANCES: Appliance[] = ["ev", "dryer", "dishwasher", "water_heater", "other"];

export class BadRequest extends Error {}

// Every API error uses this shape: { error: string } with a 4xx status.
export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isNum(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function isHour(x: unknown): x is number {
  return isNum(x) && Number.isInteger(x) && x >= 0 && x <= HORIZON_HOURS;
}

// Accepts FlexTask or ScheduledTask objects; keeps only the FlexTask fields.
export function parseTasks(raw: unknown): FlexTask[] {
  if (!Array.isArray(raw)) throw new BadRequest("tasks must be an array");
  return raw.map((t, i) => {
    if (typeof t?.id !== "string" || typeof t?.label !== "string") throw new BadRequest(`task ${i}: id and label are required`);
    if (!isNum(t.kWh) || t.kWh <= 0 || !isNum(t.powerKW) || t.powerKW <= 0) throw new BadRequest(`"${t.label}": kWh and powerKW must be positive`);
    if (!isHour(t.earliestStart) || !isHour(t.deadline)) throw new BadRequest(`"${t.label}": earliestStart and deadline must be whole hours 0–${HORIZON_HOURS}`);
    if (t.appliance !== undefined && !APPLIANCES.includes(t.appliance)) throw new BadRequest(`"${t.label}": appliance must be one of ${APPLIANCES.join(", ")}`);
    const task: FlexTask = { id: t.id, label: t.label, kWh: t.kWh, powerKW: t.powerKW, earliestStart: t.earliestStart, deadline: t.deadline };
    if (t.appliance !== undefined) task.appliance = t.appliance;
    return task;
  });
}

export function parseFlags(raw: unknown): LoadFlag[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new BadRequest("flags must be an array");
  return raw.map((f, i) => {
    if (typeof f?.id !== "string" || (f.type !== "away" && f.type !== "high_load")) throw new BadRequest(`flag ${i}: id and type ("away" | "high_load") are required`);
    if (!isHour(f.startHour) || !isHour(f.endHour) || f.endHour <= f.startHour) throw new BadRequest(`flag ${i}: needs startHour < endHour within 0–${HORIZON_HOURS}`);
    if (!isNum(f.deltaKW)) throw new BadRequest(`flag ${i}: deltaKW must be a number`);
    return { id: f.id, type: f.type, startHour: f.startHour, endHour: f.endHour, deltaKW: f.deltaKW };
  });
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Optional on /api/plan: undefined means "keep what the household already has".
export function parseTrips(raw: unknown): Trip[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) throw new BadRequest("trips must be an array");
  return raw.map((t, i) => {
    if (typeof t?.id !== "string" || typeof t?.label !== "string") throw new BadRequest(`trip ${i}: id and label are required`);
    if (!ISO_DATE.test(t.startDate) || !ISO_DATE.test(t.endDate) || t.endDate < t.startDate) {
      throw new BadRequest(`trip "${t.label}": needs startDate ≤ endDate as YYYY-MM-DD`);
    }
    return { id: t.id, label: t.label, startDate: t.startDate, endDate: t.endDate };
  });
}

const PRESETS: WeeklyRoutine["preset"][] = ["early_shift", "commuter", "home_all_day", "night_shift", "custom"];

function isClock(x: unknown, max: number): x is number {
  return isNum(x) && Number.isInteger(x) && x >= 0 && x <= max;
}

export function parseRoutine(raw: any): WeeklyRoutine | undefined {
  if (raw === undefined) return undefined;
  if (!PRESETS.includes(raw?.preset)) throw new BadRequest(`routine.preset must be one of ${PRESETS.join(", ")}`);
  if (!isClock(raw.plugInHour, 23)) throw new BadRequest("routine.plugInHour must be a clock hour 0–23");
  if (!Array.isArray(raw.awayBlocks)) throw new BadRequest("routine.awayBlocks must be an array");
  const awayBlocks = raw.awayBlocks.map((b: any, i: number) => {
    const days = Array.isArray(b?.days) ? b.days : [];
    if (!days.every((d: unknown) => isClock(d, 6)) || !isClock(b.start, 23) || !isClock(b.end, 24) || b.end <= b.start) {
      throw new BadRequest(`routine.awayBlocks[${i}]: needs days 0–6 and clock hours start < end`);
    }
    return { days, start: b.start, end: b.end };
  });
  return { preset: raw.preset, awayBlocks, plugInHour: raw.plugInHour };
}

export function parseEventIds(raw: unknown): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || !raw.every((id) => typeof id === "string")) throw new BadRequest("eventIds must be an array of strings");
  return raw;
}

export function parseEvent(raw: any) {
  if (!isHour(raw?.startHour) || !isHour(raw?.endHour) || raw.endHour <= raw.startHour) throw new BadRequest(`needs startHour < endHour within 0–${HORIZON_HOURS}`);
  if (!isNum(raw.multiplier) || raw.multiplier <= 0) throw new BadRequest("multiplier must be a positive number");
  if (typeof raw.message !== "string" || !raw.message.trim()) throw new BadRequest("message is required");
  return { startHour: raw.startHour, endHour: raw.endHour, multiplier: raw.multiplier, message: raw.message.trim() };
}

export async function readJson(req: Request): Promise<any> {
  try {
    return await req.json();
  } catch {
    throw new BadRequest("request body must be JSON");
  }
}
