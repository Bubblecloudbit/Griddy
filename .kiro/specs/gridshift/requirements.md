# GridShift — Requirements

> Source of truth for scope: PLAN.md §4 P0. No P1/P2 items here.

## R1 Customer Planner

Users can add flexible appliance tasks (label, kWh, powerKW, earliestStart, deadline).
The optimizer returns recommended start times with cost and savings vs. running right now.

**Acceptance criteria**
1. Adding a task and tapping "Optimize" returns a ScheduledTask with `start`, `cost`, and `baselineCost`.
2. The savings figure is labeled **"illustrative"** on screen.
3. Tasks with no feasible window show a clear error message.

---

## R2 Commit Plan

A household can commit its current schedule to the shared store. The UI confirms and shows GridPoints earned (P0 stub: always +10).

**Acceptance criteria**
1. POST `/api/plan` stores the household's tasks and returns a `points` value.
2. The customer page reflects the updated points after commit.

---

## R3 AEP Forecast Dashboard — Neighborhood View

The utility view shows an hourly chart (Recharts) of baseline vs. committed/planned kW for a selected neighborhood, with a horizontal transformer-capacity line.

**Acceptance criteria**
1. GET `/api/forecast?scope=<neighborhoodId>&coordinated=true` returns a `Forecast` with `baselineKW`, `plannedKW`, `capacityKW`, and `homeCount`.
2. The chart does **not** render if `homeCount < 5` (honesty rule).
3. The capacity line is visually distinct (dashed or red).

---

## R4 AEP Forecast Dashboard — Region View

The utility view includes a region-level chart showing real public grid data (PJM/EIA snapshot) next to committed customer load, with source and date labeled.

**Acceptance criteria**
1. GET `/api/forecast?scope=region` returns a `Forecast` aggregating all neighborhoods.
2. A `RegionReference` object (label, source, date, demandMW[]) appears alongside the forecast.
3. Source and date are displayed on screen ("Source: PJM Data Miner 2, [date]").

---

## R5 Coordination Toggle — DEFERRED (P2)

> Team decision: not part of P0. Build the main features first; only do this if ahead. `/api/simulate` stays a stub until then.

The utility view has a toggle between **Uncoordinated** (λ = 0) and **Coordinated** (λ > 0) scheduling and an EV-adoption % slider.

**Acceptance criteria**
1. POST `/api/simulate` with `{ evAdoption, coordinated }` returns an updated `Forecast`.
2. Uncoordinated: planned load visibly spikes above the capacity line when EV adoption is high.
3. Coordinated: planned load stays below or near capacity at the same adoption level.

---

## R6 Seeded Synthetic Community

The community is ~120 homes in 3 neighborhoods, generated with a seeded random function so results are reproducible across restarts.

**Acceptance criteria**
1. `lib/community.ts` exports a `generateCommunity(seed)` function returning `Household[]` and `Neighborhood[]`.
2. Calling it twice with the same seed returns identical data.
3. All profiles are labeled **"simulated"** wherever shown in the UI.

---

## Honesty Rules (applies to every surface)

- Every price, profile, and savings figure labeled **"illustrative"** or **"simulated"**.
- The utility view only shows aggregates of **5+ homes**; never individual addresses.
- The region reference chart displays its data source and snapshot date.

---

## Open Questions

- [ ] Which hackathon track? AEP track (outage focus) or general track?
- [ ] Anthropic key vs. AWS Bedrock for the AI coach (P1)?
- [ ] PJM API approval arrived? (Plan: website CSV downloads only.)
- [ ] Final product name confirmed?
