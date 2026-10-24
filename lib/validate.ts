// lib/validate.ts — request body checks for API routes (owner: A)
// Each parser returns the clean value, or throws BadRequest with a message for the UI.
import { NextResponse } from "next/server";
import type { FlexTask, LoadFlag } from "@/lib/types";
import { HORIZON_HOURS } from "@/lib/rates";

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
    return { id: t.id, label: t.label, kWh: t.kWh, powerKW: t.powerKW, earliestStart: t.earliestStart, deadline: t.deadline };
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
