// lib/ai/coach.ts — Natural-language energy coach (owner: D)
// Turns a message like "charge my car by 7 AM, I'm away Thursday to Saturday, I have a smart
// meter" into FlexTasks, Trips, and a proposed setup the user confirms. The rule-based coach
// in lib/ai/rules.ts is the coach; it needs no API key. (A Claude layer, D4, was dropped:
// PLAN.md §12. It's a next step in the pitch.)
import type { CustomerSetup, FlexTask, LoadFlag, Trip } from "@/lib/types";
import { ruleBasedCoach } from "@/lib/ai/rules";

export interface CoachResult {
  reply: string;
  tasks?: FlexTask[];
  trips?: Trip[]; // v2: 7-day outlook only (PLAN.md §6)
  flags?: LoadFlag[];
  setup?: Partial<CustomerSetup>; // Phase 4: rate and/or how usage is measured, if the message says
}

export async function coach(message: string): Promise<CoachResult> {
  return ruleBasedCoach(message);
}
