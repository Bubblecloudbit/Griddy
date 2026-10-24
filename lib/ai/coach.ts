// lib/ai/coach.ts — STUB (owner: D, P1)
// Natural-language energy coach. MUST have a rule-based fallback so the demo
// never depends on an API key. Real implementation lands in P1.
import type { FlexTask, LoadFlag } from "@/lib/types";

export interface CoachResult {
  reply: string;
  tasks?: FlexTask[];
  flags?: LoadFlag[];
}

export async function coach(message: string): Promise<CoachResult> {
  // TODO (D): call the Claude API with tool calling into the optimizer,
  // and fall back to keyword rules when no key is set or a call fails.
  return {
    reply: `Coach stub received: "${message}". Rule-based fallback + Claude land in P1.`,
  };
}
