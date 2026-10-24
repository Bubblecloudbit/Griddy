# Agent instructions — GridShift (HackOHI/O 2026)

Copy this file to `AGENTS.md` too so non-Claude agents read the same rules.

## Context
24-hour hackathon prototype. Read `PLAN.md` first. It defines scope, interfaces, and folder ownership. The detailed spec (written with Kiro) is in `.kiro/specs/gridshift/`: `requirements.md`, `design.md`, `tasks.md`. Follow `design.md` for interfaces and algorithms. If it conflicts with PLAN.md, stop and ask the human. Optimize for a demo that works reliably, not for production. **Before calling another person's code or the API, read PLAN.md §13 (status & integration guide).**

## Stack
Next.js (App Router), TypeScript, Tailwind, Recharts. No other libraries without asking the human (only Person A installs packages).

## Who you're working for
Four people (A, B, C, D) share this repo. The human should tell you which person they are at the start of the session (see the kickoff prompts in PLAN.md §8). **If they haven't, ask before editing anything**, then stay within that person's folders.

## Hard rules
- Only edit files in the folders your human owns (see PLAN.md §8). If a change elsewhere is needed, stop and tell the human what to ask for.
- Do not change `lib/types.ts` or API route shapes unless the human confirms the team agreed. Other teammates' code depends on them.
- Do not modify `package.json` or the lockfile unless you are working for Person A.
- No test suites, CI, Docker, or auth. Keep it a prototype.
- Every price, profile, and savings number shown in the UI must be labeled "illustrative" or "simulated."
- The utility view must only display aggregates of 5 or more homes. Never show individual households there.
- The AI coach must work without an API key (rule-based fallback).
- Keep functions small and readable. A teammate must be able to explain any part to a judge.

## Before you finish a task
Run `npm run dev`, check that the page you touched renders without console errors, and summarize what changed in 2–3 lines.
