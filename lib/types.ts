// lib/types.ts — GridShift type contract
// Change only with full-team agreement. Other teammates' code depends on every name here.

export type Hour = number; // 0..47, hour 0 = midnight today (24–47 = tomorrow); clock hour = h % 24

export interface RatePlan {
  name: string;
  offPeak: number; // $/kWh, illustrative
  onPeak: number; // $/kWh, illustrative
  peakHours: Hour[]; // clock hours 0..23, e.g. [16,17,18,19,20]; on-peak when peakHours.includes(h % 24)
  illustrative: true; // literal — not real AEP pricing
}

export interface FlexTask {
  id: string;
  label: string;
  kWh: number;
  powerKW: number;
  earliestStart: Hour;
  deadline: Hour;
}

export interface ScheduledTask extends FlexTask {
  start: Hour;
  cost: number; // illustrative $
  baselineCost: number; // illustrative $ if run at earliestStart
}

export interface LoadFlag {
  id: string;
  type: "away" | "high_load";
  startHour: Hour;
  endHour: Hour;
  deltaKW: number; // negative for away, positive for high_load
}

export interface Household {
  id: string;
  neighborhoodId: string;
  baselineKW: number[]; // length 48
  tasks: FlexTask[];
  flags: LoadFlag[];
  points: number;
}

export interface Neighborhood {
  id: string;
  name: string;
  transformerCapacityKW: number;
  homeIds: string[];
}

export interface Forecast {
  neighborhoodId: string | "region";
  baselineKW: number[]; // length 48
  plannedKW: number[]; // length 48
  capacityKW: number;
  homeCount: number; // must be >= 5 to display in utility view
}

export interface FlexEvent {
  id: string;
  startHour: Hour;
  endHour: Hour;
  multiplier: number; // e.g. 2 for 2× GridPoints
  message: string;
}

// Added for region reference chart (real public data snapshot — owner: D)
export interface RegionReference {
  label: string; // e.g. "PJM AEP Zone — Tue Oct 15 2024"
  source: string; // e.g. "PJM Data Miner 2"
  date: string; // ISO date of snapshot
  demandMW: number[]; // length 24 or 48
  forecastMW?: number[]; // official day-ahead forecast if available
  priceUSDperMWh?: number[]; // wholesale price, grid-stress context only
}
