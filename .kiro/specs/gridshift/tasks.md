# GridShift — Scaffold Tasks

> Scaffold only. Goal: `npm run dev` runs, both pages render, four people can build in parallel against mock data.
> No optimizer, no community generator, no AI coach, no real UI, no tests.

---

## Task 1 — Init Next.js project [A]
Create a new Next.js 14 App Router project with TypeScript and Tailwind inside the repo root.
Install Recharts. Confirm `npm run dev` starts without errors.
Commit: `scaffold: init next.js + tailwind + recharts`

## Task 2 — Create folder skeleton [A]
Create empty placeholder files (or `// TODO` stubs) for every folder in design.md §6:
`lib/`, `lib/ai/`, `lib/realdata/`, `app/api/`, `app/(customer)/`, `components/customer/`,
`app/utility/`, `components/utility/`, `components/ui/`, `data/real/`, `scripts/`.
Commit: `scaffold: folder structure`

## Task 3 — `lib/types.ts` [A]
Paste every interface and the `Hour` alias from design.md §1 verbatim.
Export all. No logic, no imports.
Commit: `scaffold: types`

## Task 4 — `lib/mock.ts` [A]
Export realistic mock values matching the types:
- `MOCK_RATE: RatePlan` (illustrative TOU, peakHours 16–20)
- `MOCK_TASKS: ScheduledTask[]` (3–4 tasks: EV, dryer, dishwasher with plausible numbers)
- `MOCK_NEIGHBORHOOD_FORECAST: Forecast` (scope `n1`, homeCount 40)
- `MOCK_REGION_FORECAST: Forecast` (scope `region`, homeCount 120)
- `MOCK_REGION_REFERENCE: RegionReference` (label/source/date filled in, 48 hourly demandMW values)
- `MOCK_FLEX_EVENT: FlexEvent`
Commit: `scaffold: mock data`

## Task 5 — Stub API routes [A]
Each route handler imports from `lib/mock.ts` and returns the matching mock shape.
Routes: `/api/optimize`, `/api/plan`, `/api/forecast`, `/api/simulate`, `/api/events`, `/api/coach`.
Every response is valid JSON matching the types. No logic.
Commit: `scaffold: stub api routes`

## Task 6 — Stub `lib/realdata/index.ts` [D]
```ts
export async function getRegionReference(): Promise<RegionReference> {
  return MOCK_REGION_REFERENCE; // replace with real JSON loader in Task D
}
```
Commit: `scaffold: realdata stub`

## Task 7 — Customer page `/` [B]
`app/(customer)/page.tsx` renders:
- Page heading "GridShift — Your Energy Planner"
- A table or list of `MOCK_TASKS` (label, start hour, cost, baselineCost)
- "illustrative" label next to every cost figure
- A "Commit Plan" button (calls POST `/api/plan` with mock body, logs response)
- Nav link to `/utility`
No styling required beyond Tailwind utility classes to make it readable.
Commit: `scaffold: customer page`

## Task 8 — Utility page `/utility` [C]
`app/utility/page.tsx` renders:
- Page heading "AEP Grid View"
- A Recharts `LineChart` with `MOCK_NEIGHBORHOOD_FORECAST.baselineKW` and `.plannedKW`
- A horizontal `ReferenceLine` at `capacityKW` labeled "Transformer limit"
- "Aggregated view — [homeCount] homes" label (honesty rule)
- Nav link to `/`
No coordination toggle or region chart yet — those are C's real build tasks.
Commit: `scaffold: utility page`

## Task 9 — `.env.local.example` and `.gitignore` [A]
`.env.local.example`:
```
ANTHROPIC_API_KEY=
```
`.gitignore` additions (append, don't replace):
```
.env.local
data/raw/
```
Commit: `scaffold: env example + gitignore`

---

## Done when
- [ ] `npm run dev` starts with no TypeScript errors
- [ ] `http://localhost:3000` renders the customer page with mock tasks
- [ ] `http://localhost:3000/utility` renders the utility page with a chart
- [ ] Both pages have a working nav link to each other
- [ ] All four teammates can `git pull` and run the app immediately
