// lib/types.ts — Griddy type contract (v2, PLAN.md §7)
// lib/types.ts — GridShift type contract (v2, PLAN.md §7; Phase 4 additions marked "Phase 4")
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
  flatRate?: number; // Phase 4: $/kWh, illustrative standard (same-price-all-day) rate for the TOU comparison
}

// Phase 4: who can be measured, and how (PLAN.md §7a).
export type RateType = "flat" | "tou";
export type Verification = "smart_meter" | "device" | "none";
export interface CustomerSetup {
  rate: RateType;
  verification: Verification;
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
  setup?: CustomerSetup; // Phase 4: rate + how usage is measured (none = self-reported)
  reliability?: number; // Phase 4: 0..1, share of plans actually followed (verified homes)
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
  expectedKW?: number[]; // Phase 4: baseline + confidence-weighted change (the forecast to plan on)
  verifiedOnlyKW?: number[]; // Phase 4: baseline + verified homes' change only (conservative edge)
  peakKWhExpected?: number; // Phase 4: Mon 2–6 PM kWh, expected
  maxKWBaseline?: number; // Phase 4: plan day's highest hour, baseline
  maxKWExpected?: number; // Phase 4: plan day's highest hour, expected
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
  verifiedHomes?: number; // Phase 4: enrolled homes AEP can measure (smart meter or device)
  verifiedSharePct?: number; // Phase 4: verifiedHomes / enrolled homes, %
  peakReductionExpectedPct?: number; // Phase 4: Mon 2–6 PM, expected vs. baseline
}

// Phase 4: points (PLAN.md §7a) and settlement (§3.2).
export type PointsRule = "commit" | "contribution" | "verified_shift" | "event" | "accuracy_bonus";
export interface PointsLine {
  rule: PointsRule;
  label: string;
  points: number;
  detail: string;
  status: "pending" | "settled";
}

export interface Settlement {
  householdId: string;
  day: number;
  verification: Verification;
  plannedShiftKWh: number;
  deliveredShiftKWh: number;
  adherence: number;
  event?: { eventId: string; baselineKWh: number; actualKWh: number; reducedKWh: number };
  points: PointsLine[];
}
export interface TierResult {
  homes: number;
  plannedKWh: number;
  deliveredKWh: number;
}
export interface SettlementSummary {
  day: number;
  settled: boolean;
  homesSettled: number;
  byTier: Record<Verification, TierResult>; // "none": homes and kWh planned; delivered = 0 (not measurable)
  deliveredPct: number;
  eventReducedKWh: number;
  pointsIssued: number;
  reliabilityByArea: { areaId: string; name: string; homes: number; avgReliability: number }[]; // ≥5 homes only
}
export interface MyStatus { // the customer's own data only
  points: number;
  setup?: CustomerSetup;
  reliability?: number;
  pending: PointsLine[];
  history: PointsLine[];
  settlement?: Settlement;
  touComparison?: { flatMonthly: number; touMonthly: number }; // illustrative, from this home's plan × 30
}
export interface IntakeStats {
  plansReceived: number;
  verifiedSharePct: number;
  lastReceivedHour: number | null;
  meterReads: number;
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
