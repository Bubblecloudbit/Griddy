# GridShift — Design

> Interfaces are the contract. Change only with full-team agreement.

---

## 1. TypeScript Interfaces (`lib/types.ts`)

```ts
// Primitive alias
type Hour = number; // 0..47, offset from horizon start (hour 0 = now-rounded-to-next-hour)

interface RatePlan {
  name: string;
  offPeak: number;        // $/kWh, illustrative
  onPeak: number;         // $/kWh, illustrative
  peakHours: Hour[];      // e.g. [16,17,18,19,20] weekday
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
function optimize(tasks, neighborhoodLoad, ratePlan, lambda):
  sort tasks by flexibility ascending
    flexibility = deadline - earliestStart - durationHours
  
  schedule = []
  sharedLoad = copy(neighborhoodLoad)   // 48 floats
  
  for task in tasks:
    durationHours = ceil(task.kWh / task.powerKW)
    bestStart = null
    bestScore = Infinity
    
    for h in [task.earliestStart .. task.deadline - durationHours]:
      energyCost = sum over [h .. h+durationHours-1]:
        ratePlan.price(hour) * task.powerKW
      
      congestion = lambda * sum over [h .. h+durationHours-1]:
        (sharedLoad[h] / neighborhoodCapacity)^2
      
      score = energyCost + congestion
      if score < bestScore:
        bestScore = score
        bestStart = h
    
    place task at bestStart
    add task.powerKW to sharedLoad[bestStart .. bestStart+durationHours-1]
    schedule.push({ ...task, start: bestStart, cost: bestScore, baselineCost: costAt(task.earliestStart) })
  
  return schedule

// Uncoordinated:  lambda = 0  → everyone picks cheapest hour → spike
// Coordinated:    lambda > 0  → later tasks avoid crowded hours → flat
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
  peakHours: [16, 17, 18, 19, 20],  // configurable weekday window
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

### POST `/api/simulate`
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

## 6. Folder Layout & Ownership

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
