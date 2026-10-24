# GridShift — Build Guide (step by step)

> How to use this: find your section, paste your **kickoff prompt** into a fresh Claude Code session, then work the steps **in order**. Each step has a "done when" line. Tick it, commit, push, post one line in chat. Shapes are in PLAN.md §7; looks are in DESIGN.md; data is in DATA.md.

## Shared kickoff (everyone, once, 4:00 PM)
1. `git pull --rebase` → copy the v2 docs into the repo root (PLAN.md, DESIGN.md, DATA.md, BUILD.md, CLAUDE.md, AGENTS.md).
2. Read PLAN.md §1–§5 (5 min). Look at DESIGN.md §5–§6 wireframes for your screens.
3. Decide nothing new without updating PLAN.md.

## Working rhythm
- One Claude session per step; clear the session between steps.
- Anything bigger than one file: "plan first, then build."
- When Claude says it's done: **open the page yourself**, check it matches DESIGN.md, then commit → `git pull --rebase` → push → one line in chat.
- Blocked on another person's piece? Build against `lib/mock.ts` and keep going.

---

## A — Engine, API, integration
**Kickoff prompt:**
> I am Person A (engine, API, integration) per PLAN.md §8. Read PLAN.md (v2), BUILD.md §A, DESIGN.md §4, and .kiro/specs/gridshift/design.md. v2 changes the scope; PLAN.md wins on conflicts. Work through BUILD.md §A steps in order, one step per commit. Only edit my folders. Keep the API shapes exactly as PLAN.md §7.

| # | Step | Done when |
|---|---|---|
| A1 | **Contract first (by 4:30).** In `lib/types.ts`, add the v2 fields exactly as PLAN.md §7 (all additive; rename nothing). Add `lib/config.ts` with `DEMO_DAY_0 = "2026-10-25"` and `DAY_NAMES`. In `lib/rates.ts` set `HORIZON_HOURS = 72` (every file already imports it). Make `parseTasks` in `lib/validate.ts` keep the optional `appliance` field. Extend `lib/mock.ts` with v2 mocks: rate plan with the 2–6 PM window, 3–4 `ScheduledTask`s with `reason` + `peakKWhAvoided`, a 72-hour region `Forecast` with the peak kWh fields, both `Heatmap`s (12×24 and 7×24), a `Summary`, a `Trip`, a `WeeklyRoutine`, a `FlexEvent` with `optedIn`, and a 12-entry neighborhood list. Add stub routes `GET /api/rates`, `/api/summary`, `/api/heatmap` returning mocks. Delete `app/api/simulate/`. Install `lucide-react`. | `npx tsc --noEmit` passes (add `declare module "*.css";` in a `global.d.ts` if the globals.css import error appears); `npm run dev` runs. Push + post "v2 contract pushed." |
| A2 | **Rate plan from real windows.** `DEFAULT_RATE` in `lib/rates.ts`: `peakHours: [14,15,16,17]` (AEP Ohio summer, DATA.md §1), `weekdaysOnly: true`, `source`/`sourceUrl`, illustrative prices (e.g., on-peak $0.22, off-peak $0.11) unless D verifies tariff numbers. `isPeak(rate, h)` checks clock hour **and** weekday (day index from `DEMO_DAY_0`: 0 = Sun, 1 = Mon, 2 = Tue). `GET /api/rates` returns `DEFAULT_RATE`. | Hours 0–23 (Sun) are never peak; hours 38–41 (Mon 2–6 PM) and 62–65 (Tue) are. |
| A3 | **12-area community** (`lib/community.ts`). Extend `NEIGHBORHOODS` to n1–n12, 40 homes each (480), seed 42, names from the list below. **Put the flexible tasks on Monday** (the "tomorrow" every chart shows): plug-in hours drawn Mon 2–8 PM (h38–44) so a real share of baseline load lands in the 2–6 PM peak; EV ready by Tue 7 AM (h55); dryer/dishwasher deadlines within Mon–Tue. Each home gets a routine preset (≈30% early shift, 35% commuter, 25% home all day, 10% night shift). About 60% `enrolled: true`. About 12% get a seeded Thu Oct 29–Sat Oct 31 trip. `h-jordan` stays in n1, `enrolled: false`, no tasks, 150 points. **In `lib/forecast.ts`:** only enrolled homes' tasks are optimized in `plannedKW`; non-enrolled tasks run at `earliestStart` in both curves. `commitPlan` sets `enrolled = true`. | `GET /api/forecast?scope=region` shows a clear Mon 2–6 PM gap between baseline and planned, and Jordan's commit moves it. |
| A4 | **Optimizer v2** (`lib/optimizer.ts`). Keep `COORDINATED_LAMBDA` as the default. Add `peakKWhAvoided` (peak kWh at `earliestStart` minus peak kWh at the chosen start) and a short `reason` string to each `ScheduledTask` ("Off-peak after 6 PM; spreads EV charging in your area"). | Jordan's EV (plug-in Mon 4 PM = h40, ready Tue 7 AM = h55) returns a start outside 2–6 PM with savings > 0. |
| A5 | **Forecast + summary.** Add `peakKWhBaseline` / `peakKWhPlanned` (Monday peak window) to `Forecast`. `GET /api/summary` → enrolled homes, committed flex kWh, peak reduction %, kWh shifted, homes away this week (from trips), next event. | Numbers change right after a commit to `/api/plan`. |
| A6 | **Heat map A (area × hour).** Rows = 12 areas, cols = Monday 12a–11p (hours 24–47). `metric=load` → planned kW; `metric=change` → (planned − baseline) / baseline in %. `null` for groups under 5 homes. | C's grid renders; Mon 2–6 PM cells are teal (negative) under `change`. |
| A7 | **Integration (6:30).** Run Checklist 1 below. Fix or stub whatever blocks the demo. | `git tag demo-v1` |
| A8 | **Phase 2 engine.** `/api/plan` accepts `trips`, `routine`, `eventIds` (joining multiplies that commit's points by the event's multiplier and increments `optedIn`). Heat map B (day × hour, Oct 25–31): days 0–1 (Sun, Mon) from the 72-hour forecast, days 2–6 projected from routines + trips (matches PLAN.md §6 and the `PROJECTED` tags in DESIGN.md §6.2) (traveling home → baseline × 0.35, no flexible tasks). | Adding a Thu–Sat trip for Jordan visibly adds to n1's cooler Thu–Sat cells. |
| A9 | **Demo reset.** `POST /api/reset` (and a small hidden link on `/utility`) restores the exact seeded state by clearing `globalThis.__gridshiftStore`. | Two demo run-throughs in a row look identical. |

**Why 72 hours (A1):** v1 used 0–47 (Sun–Mon). The demo's key moment, Monday 4 PM plug-in "ready by Tuesday 7 AM," needs hour 55, and Sunday has no peak, so the demo has to plan for Monday. `HORIZON_HOURS` is already used by `community`, `forecast`, `optimizer`, and `validate`, so it's one constant, but hardcoded `48`s in `lib/mock.ts` (`residentialBaseline`) must change too. Charts still show Monday (hours 24–47) as "tomorrow."

**Area names (all synthetic; say so).** Keep the three that exist, add nine: Oak Hill (n1), Riverside (n2), Eastside (n3), Maple Park, Cedar Ridge, Lakeview, Birchwood, Stonebrook, Willow Creek, Elm Court, Pine Terrace, Meadow Lane (n4–n12).

---

## B — Customer app
**Kickoff prompt:**
> I am Person B (customer app) per PLAN.md §8. Read PLAN.md (v2), DESIGN.md §1–§5 and §8, and BUILD.md §B. Build the phone-width customer app exactly as DESIGN.md §5 describes, using components from components/ui and v2 mocks from lib/mock.ts first. All API calls go through one file, components/customer/client.ts (already exists from v1). Only edit my folders. Work through BUILD.md §B steps in order.

| # | Step | Done when |
|---|---|---|
| B1 | **Shell.** Replace the placeholder table in `app/(customer)/page.tsx` (keep its commit call as a reference). Phone-width frame (max 420 px), header (wordmark, "Plan for Monday, Oct 26," points chip), bottom tabs Today · Plan · Week · Rewards. Use C's tokens; until they land, use plain Tailwind with the DESIGN.md hex values. | Tabs switch; looks like DESIGN.md §5. |
| B2 | **Day ribbon (the centerpiece).** 24-cell grid for the selected day from `/api/rates` (mock first); peak cells amber, off-peak teal wash; "now" marker; day chips Sun–Tue; Sunday shows "No peak hours on weekends." Under it: `Peak 2–6 PM weekdays · AEP Ohio` + `REAL` tag + `SourceNote`, and "Prices are illustrative." | Hover/tap any hour shows time, tier, and illustrative price. |
| B3 | **Headline + stats.** "Best time to run things: after 6 PM and overnight" (computed from the rate plan, not hardcoded). Two `Stat`s: "$X saved this week" `ILLUSTRATIVE`, "Y kWh moved out of peak." | Values come from the latest optimize result (0 before planning). |
| B4 | **Plan tab: appliance cards.** Add chips → cards with energy, plug-in time, ready-by time (prefilled from routine/defaults). "Find best times" → `/api/optimize` → each card shows start/end, `OFF-PEAK` tag, savings, and the `reason` behind an `InfoTip`. Planned blocks appear under the Today ribbon. Total row at the bottom. | Jordan's EV (plug-in 4 PM, ready 7 AM) moves out of the peak with savings > 0. API errors show inline. |
| B5 | **Commit.** `/api/plan` → Toast "Plan committed · +10 GridPoints" → points chip updates. | Points go 150 → 160; AEP view changes within 5 s. |
| — | **Integration 6:30** (Checklist 1) | |
| B6 | **Week tab.** Routine presets (Early shift, Commuter, Home all day, Night shift, Custom) with editable away block and plug-in hour; mini week strip; trips list + "Add trip" (start/end date pickers limited to Oct 25–31). Sent with the next commit. | Adding Thu–Sat shows ✈ on the strip; commit includes `trips` and `routine`. |
| B7 | **Flex Event banner.** Poll `/api/events` every 5 s; show the newest upcoming event on Today with "Join"; joining adds `eventIds` on commit and shows the bonus in the toast. | Event created on AEP appears within 5 s; joining gives multiplied points. |
| B8 | **Coach command bar.** Input at the top of Today → `/api/coach` → show proposed items as confirmable chips ("EV · ready 7 AM ✓", "Trip Thu–Sat ✓") → confirm adds them to Plan/Week. No chat bubbles. | Works with no API key (D's fallback) for the two demo sentences. |
| B9 | **Rewards tab + polish.** Points history; empty states; loading skeletons; copy pass against DESIGN.md §8. | Nothing says "AI-powered"; every $ is tagged `ILLUSTRATIVE`. |

---

## C — Design system + AEP dashboard
**Kickoff prompt:**
> I am Person C (design system + AEP dashboard) per PLAN.md §8. Read PLAN.md (v2), DESIGN.md (all), and BUILD.md §C. First build the tokens and components/ui exactly as DESIGN.md §2–§4 specify, then the AEP dashboard per DESIGN.md §6 using v2 mocks from lib/mock.ts. Only edit my folders. Work through BUILD.md §C steps in order.

| # | Step | Done when |
|---|---|---|
| C1 | **Tokens (by 4:45, top priority, everyone waits on this).** Colors, heat map scales, IBM Plex Sans/Mono via `next/font`, tabular numbers, radii, spacing in `tailwind.config` + `globals.css`. | Push + post "tokens pushed." |
| C2 | **`components/ui`.** `Card`, `Stat`, `Tag` (REAL, SIMULATED, ILLUSTRATIVE, PEAK, OFF-PEAK, PROJECTED), `SourceNote`, `InfoTip`, `ChartFrame` (with the shared Recharts axis/grid/tooltip styles), `Segmented`, `Button`, `Toast`, `EmptyState`. | A `/utility/kit` scratch page shows each one (delete before demo). |
| C3 | **Dashboard shell.** Replace the placeholder `Nav` with a small app switcher ("Customer app · AEP dashboard · Methodology") styled per DESIGN.md. Left sidebar (Overview, Heat maps, Flex events, Methodology), top bar "Residential flexibility · Demo community (simulated) · Plan date Mon Oct 26." | Navigation works; looks like DESIGN.md §6. |
| C4 | **KPI strip** from `/api/summary` (mock first): enrolled homes, flexible load committed, peak-hour load %, homes away this week. Each with a tag. | Poll every 5 s; numbers animate on change (300 ms). |
| C5 | **Projected load chart (the proof).** Rebuild `components/utility/ForecastChart.tsx`: **remove the transformer `ReferenceLine` and the boxed `Legend`**, slice hours 24–47 (Mon), baseline dashed gray vs. planned teal area, peak band 2–6 PM, direct line labels, area picker (All, n1–n12; 403 → "Hidden for privacy"). Callout: "Peak-hour load −X% (Y kWh moved)." | After Jordan commits, the callout changes within 5 s. |
| C6 | **Zone context card.** `getRegionReference()` from `lib/realdata` → slate-blue line, MW, `REAL`, `SourceNote`, explainer from DESIGN.md §6.1. Separate from C5 (different units). | Shows D's real data with source and date (mock until D delivers). |
| — | **Integration 6:30** (Checklist 1) | |
| C7 | **Heat map A (area × hour).** CSS grid, 12 rows × 24 cols, Load/Change segmented control (default Change), diverging scale, peak columns outlined, hatched null cells, hover tooltip, legend, auto takeaway line ("Biggest shift: …"). | Matches DESIGN.md §6.2. |
| C8 | **Heat map B (day × hour)** with the Area × hour / Day × hour switch; days 2–6 tagged `PROJECTED`; takeaway "Thu–Sat: −X% (planned trips)." | Jordan's trip visibly contributes after commit. |
| C9 | **Flex events page.** Form (day, start, end, multiplier chips, message) with live banner preview; list with opted-in homes. | Event appears on the customer app within 5 s. |
| C10 | **Polish.** Empty/loading states, number formats, responsive down to 1024 px, delete the kit page. | Copy pass against DESIGN.md §8. |

---

## D — Real data, coach, methodology, pitch
**Kickoff prompt:**
> I am Person D (real data, coach, methodology, pitch) per PLAN.md §8. Read PLAN.md (v2), DATA.md, DESIGN.md §4 and §7, and BUILD.md §D. Work through BUILD.md §D steps in order. Real data is committed as small JSON snapshots only. Only edit my folders.

| # | Step | Done when |
|---|---|---|
| D1 | **AEP time-of-use windows (by 4:30).** Verify on the AEP Ohio page; commit `data/real/aep_tou.json` (DATA.md §1); tell A, B, C. Optional 20-min tariff ¢/kWh check. | Posted in chat with the URL. |
| D2 | **PJM 7-day AEP-zone forecast** (DATA.md §2) → `scripts/` converter → `data/real/pjm_aep_forecast_7d.json` → `lib/realdata/index.ts` returns it as `RegionReference`. | C's zone card shows real MW with source and date. |
| D3 | **PJM last-week metered load** (DATA.md §3), or EIA backup (§4) if PJM fights you past 30 min. | Second view on the zone card. |
| D4 | **Coach** (`lib/ai/`, `app/api/coach/`). Rule-based parser first: appliances (EV/car/Tesla, dryer, dishwasher, water heater), "ready/full by <time>," "away/trip <day> to <day>," "home by <time>." Then optional Claude API call with tool output in the same shape, falling back on any error. Output must pass `/api/optimize` validation. | "Charge my car by 7 AM and I'm away Thursday to Saturday" → EV task + Thu–Sat trip, with no API key. |
| D5 | **`/methodology` page** (DESIGN.md §7): how-it-works diagram, sources table (DATA.md), assumptions, privacy, limitations. Uses C's components. | Linked from both apps. |
| D6 | **Demo script + shot list** (PLAN.md §3), timed to 2:00. Who clicks what, which state to start from (A9 reset). | Team read-through at 10 PM. |
| D7 | **Stretch data** (DATA.md §5) only if D1–D5 are done by 9 PM: LMP line on the ribbon → cleanest hours → NREL baseline shape. | — |
| D8 | **Submission:** description, "what's real vs. simulated," built-with list, screenshots, judge Q&A (PLAN.md §11). Record final video 7–9 AM. | Submitted before 10:00 AM. |

---

## Checklist 1 — Integration (6:30 PM, A runs it) → `demo-v1`
1. Everyone pushes; A pulls; `npm run dev`; no console errors on `/` or `/utility`.
2. Customer Today: ribbon shows Monday peak 2–6 PM with AEP source; Sunday says no peak.
3. Plan: EV plug-in 4 PM, ready 7 AM → Find best times → start outside peak, savings > 0, `ILLUSTRATIVE` tag.
4. Commit → toast → points 150 → 160.
5. AEP Overview within 5 s: KPI numbers change; projected chart callout changes.
6. Zone context card shows source and date (real or clearly labeled sample).
7. Heat map A renders all 12 areas with Change metric.
→ `git tag demo-v1 && git push --tags`

## Checklist 2 — Phase 2 (9:30 PM)
1. Week: Early shift routine + Thu–Sat trip → commit.
2. Heat map B: n1 and overall Thu–Sat cooler; takeaway line mentions trips.
3. AEP creates Flex Event Mon 4–6 PM 2× → banner on customer within 5 s → Join → multiplied points → opted-in count rises.
4. Coach: the demo sentence fills the Plan and Week with no API key.
5. `/methodology` lists every source with dates.

## Checklist 3 — Demo-ready (11:30 PM) → `demo-v2`
1. `resetDemo()` → full PLAN.md §3 run-through in under 2:15, twice, identical.
2. Every number has a provenance tag; every chart has an explainer; no "AI-powered" anywhere.
3. Screens checked at 1440 px (AEP) and phone width (customer).
4. Nothing reads "lorem," "TODO," "undefined," or "NaN."
→ `git tag demo-v2 && git push --tags`
