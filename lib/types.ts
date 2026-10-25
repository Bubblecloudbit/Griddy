// lib/types.ts — Griddy type contract (v2, PLAN.md §7)
// Change only with full-team agreement. Other teammates' code depends on every name here.
// v2 changes are all additive and marked `// v2`; nothing from v1 was renamed or removed.

export type Hour = number; // 0..71 from DEMO_DAY_0 midnight (Sun–Tue); clock hour = h % 24; day = floor(h / 24)  // v2: was 0..47
export type ISODate = string; // "2026-10-29"  // v2

export interface RatePlan {
  name: string;
  offPeak: number; // $/kWh, illustrative
  onPeak: number; // $/kWh, illustrative
  peakHours: Hour[]; // clock hours 0..23, AEP Ohio summer window [14,15,16,17] = 2–6 PM
  illustrative: true; // prices are illustrative; the WINDOW is real
  weekdaysOnly?: boolean; // v2: true → no peak on Sat/Sun
  source?: string; // v2
  sourceUrl?: string; // v2
}

export type Appliance = "ev" | "dryer" | "dishwasher" | "water_heater" | "other"; // v2

export interface FlexTask {
  id: string;
  label: string;
  kWh: number;
  powerKW: number;
  earliestStart: Hour;
  deadline: Hour; // finished-by hour (exclusive end)
  appliance?: Appliance; // v2 (optional)
}

export interface ScheduledTask extends FlexTask {
  start: Hour;
  cost: number; // illustrative $
  baselineCost: number; // illustrative $ if run at earliestStart
  peakKWhAvoided?: number; // v2: kWh that would have run in peak at baseline but don't now
  reason?: string; // v2: "Off-peak after 6 PM; spreads load in your area"
}

export interface LoadFlag {
  id: string;
  type: "away" | "high_load";
  startHour: Hour;
  endHour: Hour; // exclusive; within the 72 h horizon
  deltaKW: number; // negative for away, positive for high_load
}

export interface Trip { // v2, 7-day outlook only
  id: string;
  label: string;
  startDate: ISODate;
  endDate: ISODate; // inclusive
}

export interface AwayBlock { // v2
  days: number[]; // 0 = Sun .. 6 = Sat
  start: number; // clock hour
  end: number; // clock hour, exclusive
}

export interface WeeklyRoutine { // v2
  preset: "early_shift" | "commuter" | "home_all_day" | "night_shift" | "custom";
  awayBlocks: AwayBlock[];
  plugInHour: number; // clock hour the car is usually plugged in
}

export interface Household {
  id: string;
  neighborhoodId: string;
  baselineKW: number[]; // length HORIZON_HOURS (72)
  tasks: FlexTask[];
  flags: LoadFlag[];
  points: number;
  enrolled?: boolean; // v2: only enrolled homes' tasks are optimized in plannedKW
  trips?: Trip[]; // v2
  routine?: WeeklyRoutine; // v2
  eventIds?: string[]; // v2: Flex Events this home joined
}

export interface Neighborhood {
  id: string;
  name: string; // shown in the UI as a "service area"
  transformerCapacityKW: number; // INTERNAL normalizer for the optimizer only; never displayed
  homeIds: string[];
}

export interface Forecast {
  neighborhoodId: string | "region";
  baselineKW: number[]; // length 72; charts show Mon (hours 24–47)
  plannedKW: number[]; // length 72
  capacityKW: number; // never displayed (v2)
  homeCount: number; // must be >= 5 to display in utility view
  peakKWhBaseline?: number; // v2: kWh in the Mon 2–6 PM peak window, baseline
  peakKWhPlanned?: number; // v2: same window, planned
}

export interface Heatmap { // v2
  view: "area_hour" | "day_hour";
  metric: "load" | "change";
  rows: string[]; // area names, or day labels ("Sun Oct 25")
  cols: string[]; // hour labels ("12a" … "11p")
  values: (number | null)[][]; // [row][col]; null = hidden (< 5 homes)
  unit: "kW" | "%";
  label: string;
}

export interface Summary { // v2
  enrolledHomes: number;
  committedFlexKWh: number;
  peakReductionPct: number; // negative = less peak load than baseline
  peakKWhShifted: number;
  homesAwayThisWeek: number;
  nextEvent: FlexEvent | null;
}

export interface FlexEvent {
  id: string;
  startHour: Hour;
  endHour: Hour;
  multiplier: number; // e.g. 2 for 2× GridPoints
  message: string;
  optedIn?: number; // v2: homes that joined
}

// Real public data snapshot (owner: D)
export interface RegionReference {
  label: string; // e.g. "AEP zone · PJM 7-day load forecast"
  source: string; // e.g. "PJM Data Miner 2"
  date: string; // snapshot / retrieval date
  demandMW: number[]; // any length; `hours` gives the timestamps when present
  forecastMW?: number[]; // official forecast if available
  priceUSDperMWh?: number[]; // wholesale price, grid-stress context only
  sourceUrl?: string; // v2
  unit?: "MW"; // v2
  hours?: string[]; // v2: ISO timestamps, same length as demandMW
}
