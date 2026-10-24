# GridShift — Team Plan (HackOHI/O 2026)

> Working name. This is the single source of truth. If you change scope, ownership, or an interface, update this file and push it.

## 1. The one-sentence pitch
**GridShift helps households pick the cheapest times to run big appliances, and turns those plans into a forward-looking demand forecast the utility can actually use.** Customers save money, and the utility sees tomorrow's load before it happens.

## 2. The problem (both sides)
- **Customers** don't know when power is cheap, or what shifting "charge my car" or "run the dryer" is worth.
- **The utility (AEP)** sees usage in near real time, but not *intent*. It doesn't know what customers plan to do tomorrow, or when they'll be away or running something big.
- **The trap:** if everyone shifts to the same cheap hour, you create a *new* peak. Price signals alone don't coordinate a neighborhood. GridShift does.

## 3. Demo story (what judges see, ~2 min)
1. **Customer (Jordan, EV owner):** "When should I charge my car so it's full by 7 AM?" → GridShift recommends a window and shows estimated savings vs. charging at plug-in time.
2. Jordan adds the dishwasher and dryer, plus **"Away Thu–Sun"** (lower load). Taps **Commit plan** and earns GridPoints.
3. **Switch to the AEP view:** the community forecast updates. Committed load by hour, baseline vs. planned, per neighborhood.
4. *(Deferred to P2 — build only if ahead.)* **The punchline:** toggle **Uncoordinated → Coordinated.** Uncoordinated: everyone starts charging right when off-peak begins, and the transformer line is crossed. Coordinated: loads are staggered and the peak flattens. *The judge changes one input* (e.g., EV adoption %) and watches it update.
5. **AEP sends a Flex Event** ("reduce load 5–7 PM tomorrow, earn 2× points"). It appears on the customer side.
6. **Trust panel:** opt-in only, utility sees neighborhood aggregates (minimum 5 homes), all prices and profiles labeled illustrative.

## 4. Scope

### P0 — Must work end to end (target: ~7:30 PM)
- **Customer planner:** add flexible tasks (appliance, energy, earliest start, deadline). The optimizer recommends start times. Show cost and savings vs. a "run it now" baseline.
- **Commit plan:** saves to the shared store with neighborhood ID.
- **AEP dashboard:** hourly chart of baseline vs. committed/planned load for a neighborhood and the region, with a transformer capacity line.
- **Seeded synthetic community:** about 120 homes in 3 neighborhoods, reproducible (seeded random).

### P1 — Strong additions (7:30–10:00 PM)
- **Away / high-load flags** ("vacation," "big project") that shift the forecast.
- **GridPoints:** incentive for committing, and bonus points for Flex Event participation.
- **Flex Event:** AEP creates one, customers see a banner and can opt in.
- **AI energy coach:** natural-language input ("charge my Tesla by 7 AM," "I'm away this weekend"). It turns into structured tasks or flags and explains *why* a time was chosen. **Must have a rule-based fallback** so the demo never depends on the API.

### P2 — Only if ahead
- **Coordination toggle + EV-adoption slider** (`/api/simulate`): uncoordinated vs. coordinated scheduling across the synthetic community. The optimizer still supports λ in P0; only the toggle UI and simulate route are deferred.
- Neighborhood map, AI-written forecast summary for AEP, simulated "actual vs. planned" adherence, deployment.

### Explicitly out of scope (say these in the pitch as "Next steps")
Real customer accounts, live meter data, real-time pricing feeds, smart-home or device-meter integrations, other utilities. **Future:** verify plan adherence with existing smart meter (AMI) interval data.

## 5. Honesty rules (put in the UI and the video)
- Rates are **illustrative**, modeled on a time-of-use structure with a configurable peak window. Do not claim real AEP prices or real dollar savings.
- Household profiles and the community are **synthetic**.
- The utility view shows **aggregates only, minimum 5 homes per group**. No individual addresses.

## 6. Architecture (keep it boring)
- **Next.js (App Router) + TypeScript + Tailwind + Recharts**, one repo, one app.
  - `/` → customer app. `/utility` → AEP dashboard.
- **Backend:** Next.js API routes. **Store:** in-memory module behind a small interface (`lib/store.ts`), seeded on startup. Swappable later.
- **Demo runs locally** (one machine). Deployment is P2. In-memory state doesn't share across serverless instances.
- **AI:** `lib/ai/coach.ts` calls the Claude API (Anthropic key, or Bedrock via the AWS sandbox), using tool calling into the optimizer. Falls back to keyword rules when no key is set or a call fails.

### Core engine (the technical heart)
Hourly slots over a 24–48 h horizon. Each task needs `durationHours = ceil(kWh / powerKW)` within `[earliestStart, deadline]`.
For each candidate start hour, score:

```
score(s) = Σ over run hours h [ price[h] × kWh drawn in h ]  +  λ × Σ over run hours h ( neighborhoodLoad[h] / capacity )²
           └──────────── $ cost (shown to customer) ────────┘     └──── congestion penalty (only picks the start) ────┘
```

- **Uncoordinated:** λ = 0. Everyone picks the cheapest window, so they all start at the same hour → spike.
- **Coordinated:** λ > 0. Tasks are scheduled in order (least flexible first), each one adds to the shared load, and later tasks avoid crowded hours → flat.
- This is simple, explainable, and is exactly what the demo shows. Under a flat off-peak price, price alone *can't* spread people out. The congestion term does.

## 7. Interfaces (contract — change only with team agreement)
See `lib/types.ts` once scaffolded. Core shapes:

```ts
type Hour = number;                // 0..47, hour 0 = midnight today (24–47 = tomorrow); clock hour = h % 24
interface RatePlan { name: string; offPeak: number; onPeak: number; peakHours: Hour[]; illustrative: true } // peakHours = clock hours, check h % 24
interface FlexTask { id: string; label: string; kWh: number; powerKW: number; earliestStart: Hour; deadline: Hour }
interface ScheduledTask extends FlexTask { start: Hour; cost: number; baselineCost: number }
interface LoadFlag { id: string; type: "away" | "high_load"; startHour: Hour; endHour: Hour; deltaKW: number }
interface Household { id: string; neighborhoodId: string; baselineKW: number[]; tasks: FlexTask[]; flags: LoadFlag[]; points: number }
interface Neighborhood { id: string; name: string; transformerCapacityKW: number; homeIds: string[] }
interface Forecast { neighborhoodId: string | "region"; baselineKW: number[]; plannedKW: number[]; capacityKW: number; homeCount: number }
interface FlexEvent { id: string; startHour: Hour; endHour: Hour; multiplier: number; message: string }
```

**API routes**

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/optimize` | `{ tasks, neighborhoodId, coordinated }` → `ScheduledTask[]` (no save) |
| POST | `/api/plan` | Commit a household's tasks and flags → updates store, returns points |
| GET | `/api/forecast?scope=n1\|region&coordinated=true` | `Forecast` (aggregates only) |
| POST | `/api/simulate` | `{ evAdoption, coordinated }` → regenerate community forecast for the toggle **(P2, stub only for now)** |
| GET / POST | `/api/events` | List or create Flex Events |
| POST | `/api/coach` | `{ message }` → `{ reply, tasks?, flags? }` (P1) |

## 8. Ownership (folder = owner; agents stay in their folders)

| Person | Owns | Folders |
|---|---|---|
| **A — Engine & integration** | types, rates, optimizer, synthetic community, store, all API routes. **Owns `package.json` and lockfile.** Merges at integration time. | `lib/` (except `lib/ai/`, `lib/realdata/`), `app/api/` (except `app/api/coach/`) |
| **B — Customer app** | planner UI, task entry, schedule timeline, savings card, commit flow, flags, points, Flex Event banner, coach chat UI | `app/(customer)/`, `components/customer/` |
| **C — AEP dashboard** | forecast charts, neighborhood/region switch, capacity line, Flex Event creator, trust panel (coordination toggle and EV slider: P2) | `app/utility/`, `components/utility/` |
| **D — Real data, AI & pitch** | grid data snapshots (PJM, EIA) → JSON, loader functions, AI coach with fallback, demo script and video, submission writeup, judge Q&A prep | `data/`, `scripts/`, `lib/realdata/`, `lib/ai/`, `app/api/coach/` |
| **Shared** | `components/ui/` (buttons, cards): create early, then avoid editing at the same time | `components/ui/` |

**Demo video:** D owns the script and edit. A explains the engine, B shows the customer flow, C shows the AEP view.

### Real data (owner: D): snapshots only, never live calls in the demo
- **PJM wholesale prices and load:** the Data Miner 2 *website* is public and lets you download CSVs without a login. Only the *API* needs an approved account. Pick 2–3 representative days for the AEP zone (e.g., a hot summer weekday and a mild fall weekday) and convert them to small JSON curves in `data/real/` with a script in `scripts/`.
- **EIA hourly demand + day-ahead demand forecast** for PJM, plus subregion demand if the AEP zone is listed. Source: EIA's Hourly Electric Grid Monitor (CSV download, no key), or the EIA API (free key, instant).
- **How the app uses it:**
  - *Region view:* real regional demand curve and the official day-ahead forecast, next to "committed customer intent." This is the AEP pitch in one chart.
  - *Grid stress context:* the real wholesale price shape, shown as context and as an optional "dynamic price" mode. **Customer bill estimates still use the illustrative time-of-use rate.**
  - *Neighborhood view:* stays synthetic (no public data exists at that level).
- **License caution:** PJM's terms say Data Miner data is for internal use and redistribution needs a license. Keep the repo private, commit only the small derived curves, and cite the source on screen ("Source: PJM Data Miner 2, [date]").
- If PJM API approval arrives, **don't switch to live calls.** Re-export a fresher snapshot instead.
- Fallback if downloads are a pain: EIA data alone is enough for the region chart. Time-box real data to 2 hours.

### Kickoff prompts (paste one to start each Claude Code session)
Each person starts every new session by pasting their line. This tells Claude which folders it owns and what to build first.

- **A:** "I am Person A (engine & integration) per PLAN.md §8. Read PLAN.md, CLAUDE.md, and .kiro/specs/gridshift/design.md. Build in this order: rate config → synthetic community generator → optimizer → in-memory store → replace mock API routes with real ones. One piece per commit. Only edit my folders."
- **B:** "I am Person B (customer app) per PLAN.md §8. Read PLAN.md, CLAUDE.md, and .kiro/specs/gridshift/design.md. Build the customer page against lib/mock.ts first: task entry → schedule timeline → savings card → commit button. Call the API routes through one small client file so switching from mocks is a one-line change. Only edit my folders."
- **C:** "I am Person C (AEP dashboard) per PLAN.md §8. Read PLAN.md, CLAUDE.md, and .kiro/specs/gridshift/design.md. Build /utility against lib/mock.ts first: neighborhood forecast chart with capacity line → neighborhood/region switch → region reference chart → trust panel. (Coordination toggle and EV slider are P2; skip them.) Only edit my folders."
- **D:** "I am Person D (real data, AI & pitch) per PLAN.md §8. Read PLAN.md, CLAUDE.md, and .kiro/specs/gridshift/design.md. First: a script in scripts/ that converts the CSVs I put in data/raw/ into RegionReference JSON in data/real/, and the loader in lib/realdata/. Then: the AI coach in lib/ai/ and app/api/coach/ with a rule-based fallback. Only edit my folders."

### Working rhythm (everyone)
1. One Claude session per feature. Start fresh (clear the session) between features so old context doesn't confuse it.
2. Ask for a plan first on anything bigger than one file, then let it build.
3. When it says it's done: check the page in the browser yourself → commit → `git pull --rebase` → push → post one line in team chat ("B: savings card pushed").
4. Need something from someone else's folder (a new API field, a shared component)? Ask that person in chat. Don't have your Claude edit it.

## 9. Timeline (Sat 2:45 PM → Sun 10:00 AM)

| Time | Goal | Checkpoint |
|---|---|---|
| 2:45–3:30 | A runs the spec prompt **in Kiro** (see SPEC_PROMPT.md), then scaffolds and pushes types, **mock data**, and `.kiro/specs/gridshift/`. B and C sketch screens on paper and collect appliance kWh numbers. D starts downloading PJM/EIA data and drafts the demo script. | Everyone pulls and runs `npm run dev` |
| 3:30–6:00 | Parallel build against mocks. A: optimizer + community + API. B: planner. C: dashboard. D: real-data JSON + loader, then the coach with rule-based fallback. | Each part renders with mock data; real curves in `data/real/` |
| 6:00–6:30 | **Dinner break** | |
| 6:30–7:30 | **Integration:** A merges; B, C, D test. Real region curves go into C's region chart. | ✅ **End-to-end works (ugly is fine).** `git tag demo-v1` |
| 7:30–9:30 | P1: flags, points, Flex Events (A, B, C). D connects the coach to B's chat UI and writes the submission draft. | |
| 9:30–10:00 | Break | |
| 10:00–11:00 | Polish, seed a perfect demo scenario, rough video run-through | `git tag demo-v2` |
| Night | Sleep in shifts. **Feature freeze at 3 AM.** | |
| 7:00–9:30 AM | Final video, submission writeup, prepare for judges' questions | Submit before 10:00 AM |

## 10. Git rules
1. Work on `main` or very short branches (< 1 hour). `git pull --rebase` before every push.
2. Commit and push every 30–60 min, with small messages: `customer: savings card`.
3. **Never edit outside your folders** without saying so in the team chat first.
4. **Only A installs packages.** Ask in chat for a library. (Lockfile conflicts are the #1 time sink.)
5. Merge conflict → ask your agent: "resolve this conflict, keep both sides' intent," then run the app before pushing.
6. Never commit `.env.local` (API keys).
7. Tag known-good states (`demo-v1`, `demo-v2`). If something breaks at 4 AM, demo from the tag.

## 11. Judge prep (questions to have answers for)
- Why would AEP trust plans that aren't verified? → Treat them as forecast signals with confidence that grows with each household's history. Future: AMI adherence checks.
- Doesn't this help customers pay AEP less? → Under time-of-use, the utility *wants* load moved off peak. Lower peaks mean less expensive peak generation and less transformer stress.
- Privacy? → Opt-in, aggregates only, minimum group size, no addresses.
- What's real vs. simulated? → Be precise. Section 5.
- How did you use AI? → Coding with Claude Code; in-app coach for natural-language planning with a rule-based fallback; humans set the model, rates, and assumptions.

## 12. Open questions (resolve early)
- [ ] Which track are we submitting to? Confirm with organizers whether this counts for the AEP track (its brief is about outages) or the general track, and whether general prizes still apply.
- [ ] Anthropic API key or AWS Bedrock for the coach? Who has it?
- [ ] PJM API approval: keep waiting in the background, but plan on website CSV downloads.
- [ ] Final name.
- [ ] **(P1) How does a customer join a Flex Event?** No route exists yet. A's proposal: add optional `eventIds: string[]` to `POST /api/plan`; each joined event multiplies that commit's points by its `multiplier`. Needs B + C + A to agree before 7:30 PM.

## 13. Status & integration guide (keep this updated)

> Read this before switching your part from `lib/mock.ts` to the real API. Owners: update your own row when you push something others depend on.

### Status

| Person | Done | Next |
|---|---|---|
| **A** | Rates, community (120 homes, seed 42), optimizer, store, forecast, real `/api/optimize`, `/api/plan`, `/api/forecast`, `/api/events`. `/api/simulate` is a stub (P2). | Integration at 6:30. Then P1: Flex Event bonus points (see §12). |
| **B** | — | Planner against mocks → switch to the real API (below). |
| **C** | — | Dashboard against mocks → switch to the real API (below). |
| **D** | — | Region JSON + loader, then coach. |

### Rules that apply to every caller
- **Times:** hour 0 = midnight today, 24–47 = tomorrow. Show `h % 24` and add "tomorrow" when `h >= 24`. `deadline` = finished-by hour. "Full by 7 AM tomorrow" → `31`.
- **Errors:** every route can return `{ error: string }` with a 4xx status. Check `res.ok`. The message is written for users; show it as-is.
- **State is in server memory.** Restarting `npm run dev` resets plans, points, and events. Don't restart right before the demo.
- **Demo household:** `h-jordan` in `n1`. Starts with no tasks and 150 points.
- **Units:** our forecasts are **kW** (homes). PJM/EIA reference data is **MW** (whole zone). Never put both on one axis.
- Full request/response shapes: `.kiro/specs/gridshift/design.md` §5.

### B — customer app
Put all calls in one file in your folder (e.g. `components/customer/api.ts`) so the switch from mocks is one place:

```ts
async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error); // show this message in the UI
  return data;
}
// Recommend times (no save). Same order as `tasks`.
export const optimizeTasks = (tasks: FlexTask[]) => post<ScheduledTask[]>("/api/optimize", { tasks, neighborhoodId: "n1", coordinated: true });
// Commit. Pass the ScheduledTask[] straight back in; returns the new points total.
export const commitPlan = (tasks: FlexTask[], flags: LoadFlag[]) => post<{ points: number }>("/api/plan", { householdId: "h-jordan", tasks, flags });
// Flex Event banner: fetch on load and every ~5 s (C creates them from the utility view).
export const getEvents = () => fetch("/api/events").then((r) => r.json() as Promise<FlexEvent[]>);
```

- Task ids only need to be unique within the request (e.g. `crypto.randomUUID()`).
- Savings = `baselineCost - cost` ("run it now" means starting at `earliestStart`). Label it **illustrative**.
- Away flag: `{ type: "away", deltaKW: -0.5 }`; high-load flag: positive `deltaKW` (e.g. `+2`).

### C — AEP dashboard
- Neighborhood picker: `import { NEIGHBORHOODS } from "@/lib/community"` → `[{ id: "n1", name: "Oak Hill", homes: 40 }, …]`. Safe in a `"use client"` page.
- Forecast: ``fetch(`/api/forecast?scope=${id}`)`` where `id` is `n1`/`n2`/`n3`/`region`. Re-fetch every ~5 s, or after a commit, so Jordan's plan shows up live.
- `baselineKW` = every task runs at plug-in time. `plannedKW` = committed plans, scheduled and with flags. Label both **simulated**.
- A 403 response means fewer than 5 homes: show "hidden for privacy" instead of the chart.
- Region reference: `import { getRegionReference } from "@/lib/realdata"` (synchronous; mock until D swaps in the real JSON). Show `source` and `date` on screen.
- Flex Event creator: `POST /api/events` with `{ startHour, endHour, multiplier, message }`. Use tomorrow's hours (e.g. 5–7 PM tomorrow = `41`–`43`).

### D — real data & coach
- Snapshot JSON must match `RegionReference` exactly; swap it into `lib/realdata/index.ts` with a static import (design.md §6).
- The coach's `tasks` must pass the same checks as `/api/optimize`: string `id` and `label`, positive `kWh` and `powerKW`, whole hours 0–48 with hour 0 = midnight today. Then B can send them straight to `/api/optimize`.
- Appliance defaults the engine uses: EV 7.2 kW / ~10 kWh, dryer 3 kW / 1.5 kWh, dishwasher 1.5 kW / 1.2 kWh, water heater 4.5 kW / 2 kWh.

### Integration checklist (6:30 PM, A runs it)
1. Everyone pushes; A pulls and runs `npm run dev`.
2. Customer: add EV (6 PM → 7 AM tomorrow) → Optimize → recommended start appears with illustrative savings → Commit → points go from 150 to 160.
3. AEP view: n1 planned curve changes after the commit. All three neighborhoods and the region load.
4. Create a Flex Event on the AEP view → banner appears on the customer page.
5. Region chart shows the source and date.
6. No console errors on either page → `git tag demo-v1 && git push --tags`.
