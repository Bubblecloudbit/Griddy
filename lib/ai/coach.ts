// lib/ai/coach.ts — Natural-language energy coach (owner: D)
// Turns a message like "charge my car by 7 AM, I'm away Thursday to Saturday" into
// FlexTasks and Trips the user confirms. The rule-based coach in lib/ai/rules.ts is the
// default and needs no API key.
import type { FlexTask, LoadFlag, Trip } from "@/lib/types";
import { ruleBasedCoach } from "@/lib/ai/rules";

export interface CoachResult {
  reply: string;
  tasks?: FlexTask[];
  trips?: Trip[]; // v2: 7-day outlook only (PLAN.md §6)
  flags?: LoadFlag[];
}

export async function coach(message: string): Promise<CoachResult> {
  // TODO (D4, optional): Claude layer. Use it only when ANTHROPIC_API_KEY is set, return
  // this same shape, and fall back to ruleBasedCoach on any error.
  return ruleBasedCoach(message);
}
