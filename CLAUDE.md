# Agent instructions — GridShift (HackOHI/O 2026)

Keep `AGENTS.md` identical to this file so non-Claude agents read the same rules.

## Context
24-hour hackathon prototype. **Docs v2 (Sat 4 PM) changed the scope.** Read in this order:
1. `PLAN.md`: scope, interfaces (§7), ownership (§8). **Source of truth.**
2. `BUILD.md`: your person's steps, in order, with "done when" checks.
3. `DESIGN.md`: tokens, components, wireframes, copy rules. Build screens from `components/ui`; don't invent new colors, fonts, or card styles.
4. `DATA.md`: real data sources and rules.
5. `.kiro/specs/gridshift/`: the v1 spec. Where it conflicts with PLAN.md v2 (transformer line, coordination toggle, `/api/simulate`, 3 areas, 48 h horizon, 4–9 PM peak), **PLAN.md wins.** Anything else that conflicts: stop and ask the human.

Optimize for a polished demo that works every time, not for production.

## Stack
Next.js (App Router), TypeScript, Tailwind, Recharts, lucide-react. Heat maps are CSS grid. No other libraries without asking the human (only Person A installs packages).

## Who you're working for
Four people (A, B, C, D) share this repo. The human should paste their kickoff prompt from `BUILD.md`. **If they haven't said which person they are, ask before editing anything**, then stay within that person's folders.

## Hard rules
- Only edit files in the folders your human owns (PLAN.md §8). If a change elsewhere is needed, stop and tell the human what to ask for.
- Do not change `lib/types.ts` or API shapes unless you're working for Person A and the human confirms the team agreed.
- Do not modify `package.json` or the lockfile unless you are working for Person A.
- No test suites, CI, Docker, or auth.
- **Provenance:** every number and chart carries a tag: `REAL`, `SIMULATED`, `ILLUSTRATIVE`, or `PROJECTED` (DESIGN.md §4). Real data shows source, link, and date.
- **Privacy:** the AEP view only shows aggregates of 5+ homes. Never individual households or addresses.
- **Units:** our community = kW/kWh; PJM/EIA = MW/MWh. Never on one axis.
- The coach must work without an API key (rule-based fallback). Never call it "AI-powered" in the UI.
- Design: no gradients, glows, purple, emoji, chat bubbles, or boxed legends. Follow DESIGN.md §1.
- Keep functions small and readable. A teammate must be able to explain any part to a judge.

## Before you finish a task
Run `npm run dev`, open the page you touched, check it against the DESIGN.md wireframe and the step's "done when" line in BUILD.md, confirm no console errors, and summarize what changed in 2–3 lines.
