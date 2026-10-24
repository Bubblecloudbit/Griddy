# GridShift — Team Plan v2 (HackOHI/O 2026)

> **v2, Sat 4:00 PM.** This replaces v1. Scope changed: no transformer demo; added routines, trips, 7-day outlook, and heat maps.
> Read with: **DESIGN.md** (how it looks), **DATA.md** (real data), **BUILD.md** (step-by-step tasks).
> This is the single source of truth. If you change scope, ownership, or an interface, update this file and push it.

---

## 1. Pitch (say this in the first 10 seconds)
**GridShift tells households the cheapest time to run their big appliances, and turns their plans into a load forecast AEP can't get anywhere else.**
Customers see peak vs. off-peak and save money. AEP sees tomorrow's and next week's residential load *before* it happens: by area, by hour, including who's away.

## 2. The problem
| Who | Today | With GridShift |
|---|---|---|
| **Customer** | Doesn't know when power is cheap or what shifting the EV charge is worth. | Sees peak hours at a glance, gets a recommended time per appliance, sees estimated savings. |
| **AEP** | Sees usage in near real time, but not customer *intent*: tomorrow's EV charging, next week's trips. | Gets an opt-in, aggregated projection of residential load by area and hour, 1–7 days out. |

## 3. Demo story (~2 min, every step on screen)
1. **Jordan opens GridShift on Sunday evening.** The day ribbon shows tomorrow (Mon): peak 2–6 PM shaded, with "Best time to run things: after 6 PM and overnight."
2. **Jordan picks a routine:** "Early shift, home by 3:30 PM, car plugged in at 4 PM." (Plugging in at 4 PM lands inside the peak, which is exactly what GridShift fixes.)
3. **Adds appliances:** EV ready by 7 AM, dryer, dishwasher. GridShift places each one on the ribbon outside the peak and shows **"Saves $X this week (illustrative)"** and **"Y kWh moved out of peak hours."**
4. **Adds a trip:** "Away Thu–Sat." Commits the plan and earns GridPoints.
5. **Switch to AEP.** The KPI strip updates. The **projected load graph** shows baseline vs. planned for tomorrow, with the peak band and a callout: **"Peak-hour load −Z% (simulated)."** Beside it, the **real PJM AEP-zone forecast** for context, with its source.
6. **Heat maps:** *Area × hour* shows where load moved out of the peak. *Day × hour* (7 days) shows Thursday–Saturday cooling where trips are planned.
7. **AEP creates a Flex Event** ("Mon 4–6 PM, 2× points"). It appears on Jordan's screen, Jordan opts in, points go up.
8. **Methodology:** what's real (PJM, EIA, AEP rate windows), what's simulated, privacy rule (aggregates of 5+ homes only).

## 4. Scope

### Phase 1 — Core loop (target 7:30 PM, tag `demo-v1`)
- **Customer · Today:** day ribbon with peak/off-peak (AEP Ohio time-of-use windows), headline recommendation.
- **Customer · Plan:** appliance cards → optimize → recommended start on the ribbon → per-task and total savings + kWh moved out of peak → Commit.
- **AEP · Overview:** KPI strip + projected load graph (baseline vs. planned, peak band, % reduction) + real AEP-zone reference chart.
- **AEP · Heat map A:** area × hour for tomorrow, metric = planned load or change vs. baseline.
- **Engine:** 12 synthetic areas, coordinated scheduling on by default, `/api/summary`, `/api/heatmap`, `/api/rates`.

### Phase 2 — Planning ahead (target 9:30 PM)
- **Customer · Routine:** weekly routine presets (Early shift, Commuter, Home all day, Night shift, Custom) that set plug-in hours and away blocks.
- **Customer · Trips:** date-range trips (option **a**: stored as dates, used only in the 7-day outlook; the optimizer stays at its 72 h horizon).
- **AEP · Heat map B:** day × hour for the next 7 days (projected from routines + trips).
- **Flex Events:** AEP creates → customer banner → opt in → bonus points.
- **Coach:** command bar on the customer side ("charge my car by 7 AM, I'm away Thursday to Saturday") → proposed cards/trips the user confirms. Rule-based fallback required.

### Phase 3 — Polish (until feature freeze, 3 AM)
- Methodology page, empty and loading states, number formatting, copy pass, demo-scenario seeding, optional "cleanest hours" badge (DATA.md §5).

### Removed (v1 → v2)
Transformer capacity line, coordination toggle, EV-adoption slider, `/api/simulate`. The `transformerCapacityKW` / `capacityKW` fields stay in the types as an internal normalizer, but no UI shows them. **Coordination stays in the optimizer** (`coordinated: true` is the default) so planned curves never form a new spike at 6 PM. Don't mention it in the demo unless a judge asks; then it's our best technical answer.

### Next steps (pitch only, not built)
Real accounts, smart meter (AMI) verification of plans, live pricing, smart-home/device-meter integrations, other utilities.

## 5. Honesty rules (UI + video)
- **Real:** AEP Ohio time-of-use *peak windows*; PJM/EIA AEP-zone load and forecast; PJM prices (context only). Each shows **source + date** on screen.
- **Illustrative:** ¢/kWh rates and all dollar savings (unless D verifies tariff rates, DATA.md §3).
- **Simulated:** the 12 areas, ~480 households, their routines, trips, and plans.
- **Privacy:** AEP sees aggregates of **≥ 5 homes** only. No addresses, no individual households.
- **Units:** our community = **kW / kWh**. PJM/EIA zone = **MW / MWh**. Never on one axis.

## 6. Architecture
- **Next.js (App Router) + TypeScript + Tailwind + Recharts.** Heat maps are plain CSS grid (no library).
- Routes: `/` customer (phone-width app, in `app/(customer)/`), `/utility` AEP (wide dashboard), `/methodology`.
- **Store:** in-memory (`lib/store.ts`), seeded on startup with seed 42. Restarting the server resets it.
- **Demo clock (fixed):** `lib/config.ts` → `DEMO_DAY_0 = "2026-10-25"` (Sunday), `HORIZON = 72`. Hour 0 = midnight Sun Oct 25; hours 24–47 = **Mon Oct 26** (a weekday, so the peak applies; this is "tomorrow" on every chart); 48–71 = Tue, so overnight tasks can finish Tuesday morning. The 7-day outlook = Oct 25–31, all under AEP's summer schedule (2–6 PM weekdays; winter starts Nov 1). Fixing the date keeps the demo identical no matter when it runs.

### Engine (unchanged math)
```
score(s) = Σ price[h] × kWh drawn in h   +   λ × Σ (areaLoad[h] / transformerCapacityKW)²
           └── $ cost shown to customer ┘    └── spreading term, only picks the start ┘
```
- Tasks are scheduled least-flexible first. Each placed task adds to its area's load.
- `λ > 0` always (`COORDINATED_LAMBDA` in `lib/optimizer.ts`). `transformerCapacityKW` is kept only as an internal normalizer; it is never displayed.
- **Peak rule:** a clock hour is peak if the rate plan says so **and** the day is a weekday. Sunday Oct 25 has no peak.

### 7-day outlook (option a)
- Days 0–1: from the optimizer (actual scheduled plans).
- Days 2–6: **projected** from each home's routine (weekday/weekend shape) and trips (home away → baseline × 0.35, flexible tasks removed). Label "projected from routines and trips."
- About 12% of seeded homes get a seeded trip so the Thu–Sat dip is visible.

## 7. Interfaces (v2 contract; A owns `lib/types.ts`)
**Every v2 change is additive to the existing `lib/types.ts`.** No existing field is renamed or removed, so code already written against v1 keeps compiling. New fields are marked `// v2`.

```ts
type Hour = number;               // 0..71 from DEMO_DAY_0 midnight (Sun–Tue); clock hour = h % 24; day = floor(h / 24)   // v2: was 0..47
type ISODate = string;            // "2026-10-29"                                                                       // v2

interface RatePlan {               // GET /api/rates
  name: string; offPeak: number; onPeak: number;   // $/kWh, illustrative unless D verifies tariff numbers
  peakHours: Hour[];                // clock hours 0..23, now AEP Ohio summer window [14,15,16,17] = 2–6 PM
  illustrative: true;               // prices are illustrative; the WINDOW is real
  weekdaysOnly?: boolean;           // v2: true → no peak on Sat/Sun
  source?: string; sourceUrl?: string;                                                                // v2
}
interface FlexTask { id: string; label: string; kWh: number; powerKW: number; earliestStart: Hour; deadline: Hour;
                     appliance?: "ev"|"dryer"|"dishwasher"|"water_heater"|"other" }                    // v2 (optional; parseTasks must keep it)
interface ScheduledTask extends FlexTask {
  start: Hour; cost: number; baselineCost: number;
  peakKWhAvoided?: number;          // v2: kWh that would have run in peak at baseline but don't now
  reason?: string;                  // v2: "Off-peak after 6 PM; spreads load in your area"
}
interface LoadFlag { id: string; type: "away"|"high_load"; startHour: Hour; endHour: Hour; deltaKW: number }  // within the 72 h horizon
interface Trip { id: string; label: string; startDate: ISODate; endDate: ISODate }                             // v2, 7-day outlook only
interface AwayBlock { days: number[]; start: number; end: number }   // v2; days 0=Sun..6=Sat, clock hours
interface WeeklyRoutine { preset: "early_shift"|"commuter"|"home_all_day"|"night_shift"|"custom";
                          awayBlocks: AwayBlock[]; plugInHour: number }                                  // v2

interface Household { id: string; neighborhoodId: string; baselineKW: number[]; tasks: FlexTask[]; flags: LoadFlag[]; points: number;
                      enrolled?: boolean;   // v2: only enrolled homes' tasks are optimized in plannedKW; others run at earliestStart
                      trips?: Trip[]; routine?: WeeklyRoutine; eventIds?: string[] }                     // v2
interface Neighborhood { id: string; name: string; transformerCapacityKW: number; homeIds: string[] }
                      // shown in UI as "service area"; transformerCapacityKW is now an INTERNAL normalizer only, never displayed
interface Forecast { neighborhoodId: string | "region"; baselineKW: number[]; plannedKW: number[]; capacityKW: number; homeCount: number;
                     peakKWhBaseline?: number; peakKWhPlanned?: number }   // v2 fields; arrays are 72 long; charts show Mon (24–47); capacityKW never displayed
interface Heatmap { view: "area_hour"|"day_hour"; metric: "load"|"change";                               // v2
                    rows: string[]; cols: string[]; values: (number|null)[][];   // null = hidden (< 5 homes)
                    unit: "kW"|"%"; label: string }
interface Summary { enrolledHomes: number; committedFlexKWh: number; peakReductionPct: number;            // v2
                    peakKWhShifted: number; homesAwayThisWeek: number; nextEvent: FlexEvent | null }
interface FlexEvent { id: string; startHour: Hour; endHour: Hour; multiplier: number; message: string;
                      optedIn?: number }                                                                 // v2
interface RegionReference { label: string; source: string; date: string; demandMW: number[]; forecastMW?: number[]; priceUSDperMWh?: number[];
                            sourceUrl?: string; unit?: "MW"; hours?: string[] }                          // v2: hours = ISO timestamps, same length as demandMW
```

### API routes (v2)
| Method | Route | Body / query → response | Phase |
|---|---|---|---|
| GET | `/api/rates` | → `RatePlan` | 1 |
| POST | `/api/optimize` | `{ tasks, neighborhoodId }` → `ScheduledTask[]` (coordinated by default) | 1 |
| POST | `/api/plan` | `{ householdId, tasks, flags?, trips?, routine?, eventIds? }` → `{ points }` | 1 (+2 fields) |
| GET | `/api/forecast?scope=n1…n12\|region` | → `Forecast` (403 if < 5 homes). `coordinated` param still accepted, defaults true | 1 |
| GET | `/api/summary` | → `Summary` | 1 |
| GET | `/api/heatmap?view=area_hour\|day_hour&metric=load\|change` | → `Heatmap` | 1 / 2 |
| GET / POST | `/api/events` | list / `{ startHour, endHour, multiplier, message }` → `FlexEvent` | 2 |
| POST | `/api/coach` | `{ message }` → `{ reply, tasks?, trips?, flags? }` | 2 |
| ~~POST~~ | ~~`/api/simulate`~~ | removed (delete the stub route) | — |

## 8. Ownership

| Person | Owns | Folders |
|---|---|---|
| **A — Engine, API, integration (you)** | config, types, rates, 12-area community, routines/trips seeding, optimizer, forecast, summary, heat map aggregation, events. **Owns `package.json` + lockfile.** Merges at integration. | `lib/` (except `lib/ai/`, `lib/realdata/`), `app/api/` (except `app/api/coach/`) |
| **B — Customer app** | Today ribbon, Plan (appliance cards), Routine, Trips, savings, commit, points, Flex Event banner, coach command bar UI | `app/(customer)/`, `components/customer/` |
| **C — AEP dashboard + design system** | **Design tokens and shared UI first (by 4:45 PM)**, then KPI strip, projected load graph, zone reference chart, both heat maps, Flex Event composer | `components/ui/` (incl. existing `Nav.tsx`), `app/utility/`, `components/utility/`, `app/layout.tsx` (fonts), `app/globals.css`, `tailwind.config.ts` |
| **D — Real data, coach, methodology, pitch** | DATA.md pulls → JSON, loaders, coach + fallback, `/methodology` page, demo script/video, submission, judge Q&A | `data/`, `scripts/`, `lib/realdata/`, `lib/ai/`, `app/api/coach/`, `app/methodology/` |

## 9. Timeline (from Sat 4:00 PM)
| Time | Goal | Checkpoint |
|---|---|---|
| 4:00–4:45 | **A:** v2 types, config, `/api/rates`, `/api/summary`, `/api/heatmap` stubs + mocks. **C:** tokens + `components/ui` (DESIGN.md §2–3). **B:** ribbon on mocks. **D:** PJM/EIA downloads. | A and C push; everyone pulls |
| 4:45–6:00 | Phase 1 build (BUILD.md) | Each screen renders with mocks |
| 6:00–6:30 | Dinner | |
| 6:30–7:30 | **Integration** (A runs BUILD.md checklist 1) | ✅ `git tag demo-v1` |
| 7:30–9:30 | Phase 2 | Checklist 2 |
| 9:30–10:00 | Break | |
| 10:00–11:30 | Phase 3 polish + seed demo scenario + rough video | ✅ `git tag demo-v2` |
| Night | Sleep in shifts. **Feature freeze 3 AM.** Bug fixes only after. | |
| 7:00–9:30 AM | Final video, submission, judge prep | Submit before 10:00 AM |

## 10. Git rules
1. `main` or branches under 1 hour. `git pull --rebase` before every push. Push every 30–60 min.
2. Never edit outside your folders without saying so in chat first.
3. Only A installs packages.
4. Conflict → "resolve this conflict, keep both sides' intent," run the app, then push.
5. Never commit `.env.local` or `data/raw/`. Keep the repo **private** (PJM terms; DATA.md §6).
6. Tag known-good states. If something breaks at 4 AM, demo from the tag.

## 11. Judge Q&A (D maintains)
- **Why would AEP trust plans?** Forecast signals with confidence that grows with history. Next step: verify against smart meter interval data.
- **Doesn't this cost AEP revenue?** Time-of-use pricing exists so customers move load off peak. Lower peaks mean less expensive peak supply and less grid stress.
- **Why doesn't everyone shift to the same hour?** The optimizer spreads load within each area (§6).
- **What's real?** §5, exactly.
- **Privacy?** Opt-in, aggregates of 5+ homes, no addresses.
- **AI use?** Built with Claude Code and Kiro; in-app coach turns plain language into structured plans that the user confirms; deterministic fallback; humans own the model and assumptions.

## 12. Open questions
- [ ] Track: AEP or general? Ask organizers; confirm general-prize eligibility.
- [ ] Coach: Anthropic key or Bedrock (AWS sandbox)? Who?
- [ ] Final name (GridShift is the working name).
- [ ] D: can we verify real AEP Ohio time-of-use ¢/kWh in 20 min? If not, prices stay illustrative.

## 13. Status (owners update their row when they push)
| Person | Done | Next |
|---|---|---|
| **A** | v1: rates, community (seed 42), optimizer, store, forecast, `/api/optimize`, `/api/plan`, `/api/forecast`, `/api/events`. | v2 changes: BUILD.md §A. |
| **B** | — | BUILD.md §B |
| **C** | — | BUILD.md §C (tokens first) |
| **D** | — | BUILD.md §D (DATA.md pulls first) |

**Integration notes (unchanged from v1 unless stated):** hour 0 = midnight of `DEMO_DAY_0` (Sun Oct 25), horizon 72 h; every route may return `{ error }` with 4xx (show the message as-is); demo household `h-jordan` in `n1` starts with 150 points and is not enrolled; area ids are now `n1`–`n12`; forecast scope for all areas is still **`region`**; `NEIGHBORHOODS` from `@/lib/community` lists all 12.
