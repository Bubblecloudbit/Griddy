# GridShift — Design

> Interfaces are the contract. Change only with full-team agreement.

## 0. Time convention (team decision)

- The horizon is 48 hourly slots. **Hour 0 = midnight today.** Hours 0–23 are today, 24–47 are tomorrow.
- Clock hour of any slot = `h % 24`. Display it with `h % 24` (plus "tomorrow" when `h >= 24`).
- `RatePlan.peakHours` lists **clock hours** (0–23). An hour is on-peak when `peakHours.includes(h % 24)`, so the peak window applies on both days.
- `deadline` is the hour the task must be **finished by** (exclusive end). "Full by 7 AM tomorrow" → `deadline: 31`.

---

## 1. TypeScript Interfaces (`lib/types.ts`)

```ts
// Primitive alias
type Hour = number; // 0..47, hour 0 = midnight today (0–23 today, 24–47 tomorrow); clock hour = h % 24

interface RatePlan {
  name: string;
  offPeak: number;        // $/kWh, illustrative
  onPeak: number;         // $/kWh, illustrative
  peakHours: Hour[];      // clock hours 0..23, e.g. [16,17,18,19,20]; applies to both days (check h % 24)
  illustrative: true;     // literal — forces every consumer to acknowledge this is not real AEP pricing
}

interface FlexTask {
  id: string;
  label: string;
  kWh: number;
  powerKW: number;
  earliestStart: Hour;
  deadline: Hour;
}

interface ScheduledTask extends FlexTask {
  start: Hour;
  cost: number;           // illustrative $
  baselineCost: number;   // illustrative $ if run at earliestStart
}

interface LoadFlag {
  id: string;
  type: "away" | "high_load";
  startHour: Hour;
  endHour: Hour;
  deltaKW: number;        // negative for away, positive for high_load
}

interface Household {
  id: string;
  neighborhoodId: string;
  baselineKW: number[];   // length 48
  tasks: FlexTask[];
  flags: LoadFlag[];
  points: number;
}

interface Neighborhood {
  id: string;
  name: string;
  transformerCapacityKW: number;
  homeIds: string[];
}

interface Forecast {
  neighborhoodId: string | "region";
  baselineKW: number[];   // length 48
  plannedKW: number[];    // length 48
  capacityKW: number;
  homeCount: number;      // must be >= 5 to display in utility view
}

interface FlexEvent {
  id: string;
  startHour: Hour;
  endHour: Hour;
  multiplier: number;     // e.g. 2 for 2× GridPoints
  message: string;
}

// Added for region reference chart (real public data snapshot)
interface RegionReference {
  label: string;          // e.g. "PJM AEP Zone — Tue Oct 15 2024"
  source: string;         // e.g. "PJM Data Miner 2"
  date: string;           // ISO date of snapshot
  demandMW: number[];     // length 24 or 48
  forecastMW?: number[];  // official day-ahead forecast if available
  priceUSDperMWh?: number[]; // wholesale price, shown as grid-stress context only
}
```

---

## 2. Optimizer (`lib/optimizer.ts`) — pseudocode

```
price(hour)      = ratePlan.peakHours.includes(hour % 24) ? ratePlan.onPeak : ratePlan.offPeak
duration(task)   = ceil(task.kWh / task.powerKW)

// kWh drawn in the i-th run hour. Full power every hour except the last,
// which only draws what's left (10 kWh at 7.2 kW → [7.2, 2.8], not [7.2, 7.2]).
kwhInRunHour(task, i) = min(task.powerKW, task.kWh - i * task.powerKW)

// Real (illustrative) $ cost of running the task starting at hour s. Shown to the customer.
energyCost(task, s) = sum over i in [0 .. duration-1]:
  price(s + i) * kwhInRunHour(task, i)

// Penalty for crowded hours. Used ONLY to choose the start; never shown as $.
congestion(task, s, sharedLoad, capacity) = sum over i in [0 .. duration-1]:
  (sharedLoad[s + i] / capacity)^2          // index by each run hour, not the start hour

function optimize(tasks, neighborhoodLoad, capacity, ratePlan, lambda):
  sort tasks by flexibility ascending        // least flexible goes first
    flexibility = deadline - earliestStart - duration(task)

  schedule = []
  sharedLoad = copy(neighborhoodLoad)        // 48 floats, kW

  for task in tasks:
    lastStart = task.deadline - duration(task)   // must finish by deadline (exclusive end)
    if lastStart < task.earliestStart:
      return error "No feasible window for <label>"   // R1 acceptance criterion 3

    bestStart = task.earliestStart
    bestScore = Infinity
    for s in [task.earliestStart .. lastStart]:           // inclusive
      score = energyCost(task, s) + lambda * congestion(task, s, sharedLoad, capacity)
      if score < bestScore:                               // strict <, so ties keep the earliest start
        bestScore = score
        bestStart = s

    for i in [0 .. duration-1]:
      sharedLoad[bestStart + i] += kwhInRunHour(task, i)  // kWh in a 1-hour slot = average kW

    schedule.push({
      ...task,
      start: bestStart,
      cost: energyCost(task, bestStart),                  // $ only, no congestion term
      baselineCost: energyCost(task, task.earliestStart), // "run it now" = start at plug-in time
    })

  return schedule

// Uncoordinated:  lambda = 0  → everyone picks cheapest hour → spike (P2 demo)
// Coordinated:    lambda > 0  → later tasks avoid crowded hours → flat
// Tuning: one off-peak EV hour costs ~$0.50 and a full transformer adds ~1.0 per hour,
// so start with lambda ≈ 1–3 and adjust until the planned curve looks sensible.
```

---

## 3. Synthetic Community (`lib/community.ts`)

- **Size:** ~120 homes across 3 neighborhoods (`n1` Oak Hill, `n2` Riverside, `n3` Eastside).
- **Seed:** `generateCommunity(seed: number)` uses a seeded PRNG (e.g. mulberry32). Same seed → same data.
- **Baseline curve:** illustrative residential shape — trough overnight, morning bump ~7–9 AM, evening bump ~6–9 PM (total ~30 kWh/day for an average home).
- **Flexible appliances per home (sampled probabilistically):**
  - EV charger: ~7 kW, 10 kWh, availability controlled by `evAdoption` parameter
  - Dryer: ~3 kW, 1.5 kWh
  - Dishwasher: ~1.5 kW, 1.2 kWh
  - Water heater: ~4.5 kW, 2 kWh
- **EV adoption:** 0–100 % parameter → fraction of homes that have an EV task.
- **Transformer capacity:** 200 kW per neighborhood (roughly 40 homes × 5 kW peak).

---

## 4. Rate Config (`lib/rates.ts`)

```ts
// Illustrative time-of-use rate — not real AEP pricing
const DEFAULT_RATE: RatePlan = {
  name: "Illustrative TOU",
  offPeak: 0.07,    // $/kWh
  onPeak:  0.22,    // $/kWh
  peakHours: [16, 17, 18, 19, 20],  // clock hours; on-peak when peakHours.includes(h % 24)
  illustrative: true,
};
```

---

## 5. API Routes

All routes live in `app/api/`. Request and response shapes:

### POST `/api/optimize`
Request: `{ tasks: FlexTask[], neighborhoodId: string, coordinated: boolean }`
Response: `ScheduledTask[]`

### POST `/api/plan`
Request: `{ householdId: string, tasks: FlexTask[], flags: LoadFlag[] }`
Response: `{ points: number }`

### GET `/api/forecast`
Query: `scope=<neighborhoodId|"region">`, `coordinated=<true|false>`
Response: `Forecast`

### POST `/api/simulate` *(P2 — deferred, stub only)*
Request: `{ evAdoption: number, coordinated: boolean }`
Response: `Forecast` (region-level, regenerated community)

### GET `/api/events`
Response: `FlexEvent[]`

### POST `/api/events`
Request: `{ startHour: Hour, endHour: Hour, multiplier: number, message: string }`
Response: `FlexEvent`

### POST `/api/coach` *(P1 — stub only at scaffold)*
Request: `{ message: string }`
Response: `{ reply: string, tasks?: FlexTask[], flags?: LoadFlag[] }`

---

## 6. Region Reference Data (real PJM/EIA snapshot)

No API route. The data reaches the region chart through a static JSON import:

```
data/raw/*.csv                      (D downloads; gitignored)
   │  scripts/convert.mjs           (D, run by hand)
   ▼
data/real/<name>.json               (D commits; shape = RegionReference)
   │  static import
   ▼
lib/realdata/index.ts               (D) export function getRegionReference(): RegionReference
   │  direct call (synchronous, browser-safe)
   ▼
app/utility + components/utility    (C) region chart
```

- `getRegionReference()` is **synchronous** and must stay browser-safe: no `fs`, no `fetch`, no live PJM/EIA calls. It returns `MOCK_REGION_REFERENCE` until D swaps in the snapshot import, so C can build against it now and nothing changes for C when the real data lands.
- The JSON matches `RegionReference` exactly. `demandMW` is in **MW** (whole PJM/AEP zone) while `Forecast` is in **kW** (our homes). C shows them on separate axes or side-by-side charts, never on one axis.
- C displays `source` and `date` on screen (R4 acceptance criterion 3).

---

## 7. Folder Layout & Ownership

```
gridshift/
├── app/
│   ├── (customer)/
│   │   ├── page.tsx          [B]
│   │   └── layout.tsx        [B]
│   ├── utility/
│   │   ├── page.tsx          [C]
│   │   └── layout.tsx        [C]
│   └── api/
│       ├── optimize/route.ts [A]
│       ├── plan/route.ts     [A]
│       ├── forecast/route.ts [A]
│       ├── simulate/route.ts [A]
│       ├── events/route.ts   [A]
│       └── coach/route.ts    [D]
├── components/
│   ├── customer/             [B]
│   ├── utility/              [C]
│   └── ui/                   [Shared]
├── lib/
│   ├── types.ts              [A]
│   ├── mock.ts               [A]
│   ├── rates.ts              [A]
│   ├── optimizer.ts          [A]
│   ├── community.ts          [A]
│   ├── store.ts              [A]
│   ├── ai/
│   │   └── coach.ts          [D]
│   └── realdata/
│       └── index.ts          [D]
├── data/
│   ├── real/                 [D]
│   └── raw/                  [D, gitignored]
├── scripts/                  [D]
├── .env.local.example
└── .gitignore
```
