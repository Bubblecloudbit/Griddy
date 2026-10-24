// lib/ai/coach.ts — Natural-language energy coach (owner: D)
// Turns a message like "charge my car by 7 AM" into FlexTasks and LoadFlags.
// The rule-based coach in lib/ai/rules.ts is the default and needs no API key.
import type { FlexTask, LoadFlag } from "@/lib/types";
import { ruleBasedCoach } from "@/lib/ai/rules";

export interface CoachResult {
  reply: string;
  tasks?: FlexTask[];
  flags?: LoadFlag[];
}

export async function coach(message: string): Promise<CoachResult> {
  // TODO (D, P1): optional Claude layer. Use it only when ANTHROPIC_API_KEY is set,
  // and fall back to ruleBasedCoach if the call fails.
  return ruleBasedCoach(message);
}
