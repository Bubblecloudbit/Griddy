// app/methodology/page.tsx — what's real, what's simulated, and how it works (owner: D). DESIGN.md §7.
// Every number here is read from the same constants and snapshots the app uses, so it can't drift.
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Card, Nav, PageHeader, Tag, type TagKind } from "@/components/ui";
import { APPLIANCES } from "@/lib/ai/rules";
import { DEVICE_SHARE, NEIGHBORHOODS, SMART_METER_SHARE, TOU_SHARE } from "@/lib/community";
import { DAY_NAMES, OUTLOOK_DAYS, PLAN_DAY, dayLabel } from "@/lib/config";
import { MIN_GROUP_SIZE, SELF_REPORT_CONFIDENCE } from "@/lib/forecast";
import {
  ACCURACY_BONUS, ACCURACY_THRESHOLD, COMMIT_POINTS, CONTRIBUTION_MAX, CONTRIBUTION_PER_KWH, DAILY_CAP, EVENT_PER_KWH, VERIFIED_PER_KWH,
} from "@/lib/points";
import { DEFAULT_RATE } from "@/lib/rates";
import { getLastWeekLoad, getRegionReference } from "@/lib/realdata";
import tou from "@/data/real/aep_tou.json";

const HOMES = NEIGHBORHOODS.reduce((n, a) => n + a.homes, 0);

// "2026-10-24" → "Oct 24, 2026"
function longDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function clockText(clock: number): string {
  if (clock === 0 || clock === 24) return "12 AM";
  if (clock === 12) return "12 PM";
  return clock < 12 ? `${clock} AM` : `${clock - 12} PM`;
}

// [14,15,16,17] → "2–6 PM" (DESIGN.md §8); drops the first AM/PM when both ends share it.
function windowText(hours: number[]): string {
  const [start, end] = [clockText(Math.min(...hours)), clockText(Math.max(...hours) + 1)];
  const sameHalf = start.slice(-2) === end.slice(-2);
  return `${sameHalf ? start.slice(0, -3) : start}–${end}`;
}

const money = (x: number) => `$${x.toFixed(2)}`;

// ---------------------------------------------------------------------------
// 1. How it works
// ---------------------------------------------------------------------------
const STEPS = [
  { title: "Customer plans", text: "Picks a routine, adds appliances with a ready-by time, and adds trips." },
  { title: "Griddy schedules", text: "Moves each task to cheaper off-peak hours and spreads starts across the area." },
  { title: "AEP sees projections", text: `Aggregated load by area and hour, 1–${OUTLOOK_DAYS} days out, only for groups of ${MIN_GROUP_SIZE}+ homes.` },
];

function HowItWorks() {
  return (
    <Card title="How it works" explainer="Three steps, from a household's plan to a utility forecast.">
      <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex items-center gap-2 sm:flex-1">
            <div className="h-full flex-1 rounded-control border border-line bg-surface p-4">
              <p className="flex h-7 w-7 items-center justify-center rounded-full bg-brand font-display text-body font-semibold text-surface">
                {i + 1}
              </p>
              <p className="mt-3 text-h2 text-ink">{step.title}</p>
              <p className="mt-1 text-caption text-ink-muted">{step.text}</p>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight size={18} strokeWidth={1.75} className="hidden shrink-0 text-brand sm:block" aria-hidden />
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 2. Data sources
// ---------------------------------------------------------------------------
interface SourceRow {
  name: string;
  use: string;
  date: string;
  href?: string;
  tag: TagKind;
}

function sourceRows(): SourceRow[] {
  const zone = getRegionReference();
  const zoneIsSample = zone.date === "sample";
  const week = getLastWeekLoad();
  return [
    {
      name: tou.source,
      use: `Peak hours: ${windowText(tou.summer.peakClockHours)} weekdays (May–Oct), ${windowText(tou.winter.peakClockHours)} (Nov–Apr)`,
      date: `Retrieved ${longDate(tou.retrieved)}`,
      href: tou.sourceUrl,
      tag: "REAL",
    },
    {
      name: zoneIsSample ? `${zone.source} (sample until our pull lands)` : zone.source,
      use: zoneIsSample ? "AEP zone context: whole-zone load, in MW" : `Zone context chart: ${zone.label}, in MW`,
      date: zoneIsSample
        ? "Sample shape, not real numbers"
        : zone.date.replace(/^retrieved (\d{4}-\d{2}-\d{2})$/, (_, iso: string) => `Retrieved ${longDate(iso)}`),
      href: zone.sourceUrl,
      tag: zoneIsSample ? "SIMULATED" : "REAL",
    },
    {
      name: week.source,
      use: `Zone context chart, last week: ${week.label}, in MW`,
      date: week.date.replace(/^retrieved (\d{4}-\d{2}-\d{2})$/, (_, iso: string) => `Retrieved ${longDate(iso)}`),
      href: week.sourceUrl,
      tag: "REAL",
    },
    {
      name: "Time-of-use prices",
      use: `${money(DEFAULT_RATE.onPeak)}/kWh peak, ${money(DEFAULT_RATE.offPeak)}/kWh off-peak; all $ savings`,
      date: "Not AEP tariff prices",
      tag: "ILLUSTRATIVE",
    },
    {
      name: "Demo community",
      use: `${NEIGHBORHOODS.length} service areas, ${HOMES} homes, their routines, trips, and plans`,
      date: "Generated with a fixed seed",
      tag: "SIMULATED",
    },
  ];
}

function Sources() {
  return (
    <Card title="Data sources" explainer="Real data is a dated snapshot. The demo never calls these services live.">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-body">
          <thead>
            <tr className="border-b border-line">
              <th className="eyebrow py-2 pr-3">Source</th>
              <th className="eyebrow py-2 pr-3">What we use it for</th>
              <th className="eyebrow py-2 pr-3">Date</th>
              <th className="py-2 font-normal" />
            </tr>
          </thead>
          <tbody>
            {sourceRows().map((row) => (
              <tr key={row.name} className="border-b border-line align-top last:border-0">
                <td className="py-3 pr-3 font-medium">
                  {row.href ? (
                    <a href={row.href} target="_blank" rel="noreferrer" className="text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand">
                      {row.name}
                    </a>
                  ) : (
                    row.name
                  )}
                </td>
                <td className="py-3 pr-3 text-ink-muted">{row.use}</td>
                <td className="py-3 pr-3 text-caption text-ink-muted">{row.date}</td>
                <td className="py-3 text-right">
                  <Tag kind={row.tag} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 3. Assumptions
// ---------------------------------------------------------------------------
function Assumptions() {
  const lastDay = dayLabel(OUTLOOK_DAYS - 1);
  return (
    <Card title="Assumptions" explainer="The numbers behind the simulated side of the demo." action={<Tag kind="SIMULATED" />}>
      <ul className="flex flex-col gap-2 text-body">
        <li>
          <span className="font-semibold text-ink">Plan day.</span>{" "}
          <span className="text-ink-muted">
            Every chart shows {dayLabel(PLAN_DAY)} as tomorrow. The 7-day outlook covers {dayLabel(0)} to {lastDay}, all on
            AEP Ohio&apos;s summer schedule. {DAY_NAMES[0]} and {DAY_NAMES[6]} have no peak hours.
          </span>
        </li>
        <li>
          <span className="font-semibold text-ink">Community.</span>{" "}
          <span className="text-ink-muted">
            {NEIGHBORHOODS.length} synthetic service areas of {NEIGHBORHOODS[0].homes} homes. Each home has a weekly routine (early
            shift, commuter, home all day, night shift). About 60% are enrolled and about 12% have a Thu–Sat trip.
          </span>
        </li>
        <li>
          <span className="font-semibold text-ink">Baseline.</span>{" "}
          <span className="text-ink-muted">
            Everyone runs big appliances as soon as they get home. Homes that aren&apos;t enrolled keep doing that in the planned
            curve too.
          </span>
        </li>
        <li>
          <span className="font-semibold text-ink">Scheduling.</span>{" "}
          <span className="text-ink-muted">
            Each task starts at the cheapest time between its earliest start (when the car is plugged in, or the dishwasher is
            loaded) and its deadline. A small spreading term keeps one area&apos;s
            tasks from all starting in the same hour, so the plan doesn&apos;t create a new spike at 6 PM. A second small term uses
            the real PJM forecast to steer away from the zone&apos;s busiest hours (around 7–8 AM and 7 PM), which differ from the
            2–6 PM price window. Dryers are never scheduled between 10 PM and 7 AM (noise and fire safety), unless the
            customer&apos;s own window leaves no other time. Bill estimates still use the time-of-use price only.
          </span>
        </li>
        <li>
          <span className="font-semibold text-ink">Trips.</span>{" "}
          <span className="text-ink-muted">
            A home on a trip drops to standby load (fridge, HVAC) and runs no flexible tasks. Days 2–6 of the outlook are{" "}
            projected from routines and trips, not scheduled.
          </span>
        </li>
      </ul>

      <h3 className="eyebrow mt-5">Appliance defaults</h3>
      <table className="mt-1 w-full text-left text-body">
        <tbody>
          {APPLIANCES.map((a) => (
            <tr key={a.id + a.label} className="border-b border-line last:border-0">
              <td className="py-1.5 pr-3">{a.label}</td>
              <td className="py-1.5 pr-3 text-right tabular-nums">{a.kWh} kWh</td>
              <td className="py-1.5 text-right tabular-nums">{a.powerKW} kW</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 4–5. Privacy, limitations
// ---------------------------------------------------------------------------
function Privacy() {
  return (
    <Card tone="brand" title="Privacy" explainer="What AEP can and can't see." action={<ShieldCheck size={20} strokeWidth={1.75} className="text-brand" aria-hidden />}>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-body text-ink">
        <li>Households opt in. Nothing is shared until a plan is committed.</li>
        <li>AEP sees totals for groups of {MIN_GROUP_SIZE} or more homes only. Smaller groups show as hidden.</li>
        <li>No names, addresses, or single-home curves ever reach the AEP view.</li>
      </ul>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Phase 4: who it works for, how AEP verifies, how points work, what data flows where
// ---------------------------------------------------------------------------
const pct = (n: number) => `${Math.round(n * 100)}%`;

function WhoItWorksFor() {
  const rows: [string, string, string][] = [
    ["Time-of-use rate (any meter)", "Real bill savings from shifting + GridPoints", "Verified shift (time-of-use needs a smart meter)"],
    ["Standard rate + smart meter", "GridPoints for verified shifts and Flex Event reductions; the time-of-use comparison", "Verified, settled shift; high-confidence forecast input"],
    ["Standard rate + connected device", "GridPoints for the device's verified runs (EV charger, thermostat)", "Device-level verification, the Power Rewards model extended"],
    ["Standard rate, no meter, no device", "Planning help + small contribution points; a path to get verified", `Self-reported intent, counted at ${pct(SELF_REPORT_CONFIDENCE)} confidence`],
  ];
  return (
    <Card title="Who Griddy works for today" explainer="Most homes pay the same price all day, so shifting saves them nothing. Value depends on what AEP can measure." action={<Tag kind="SIMULATED" />}>
      <table className="w-full text-caption">
        <thead>
          <tr className="text-left text-ink-muted">
            <th className="py-1 pr-2 font-normal">Customer</th>
            <th className="py-1 pr-2 font-normal">Gets</th>
            <th className="py-1 font-normal">AEP gets</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line align-top">
          {rows.map(([who, gets, aep]) => (
            <tr key={who}>
              <td className="py-1.5 pr-2 font-semibold text-ink">{who}</td>
              <td className="py-1.5 pr-2 text-ink-muted">{gets}</td>
              <td className="py-1.5 text-ink-muted">{aep}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-caption text-ink-muted">
        Demo community shares (simulated): smart meter {pct(SMART_METER_SHARE)} (working figure for Ohio homes; to be replaced
        with AEP Ohio&apos;s EIA-861 count), connected device {pct(DEVICE_SHARE)}, time-of-use {pct(TOU_SHARE)} (assumptions).
        Griddy grows with AEP&apos;s smart meter rollout.
      </p>
    </Card>
  );
}

function HowAepVerifies() {
  return (
    <Card title="How AEP verifies" explainer="AEP only pays for what it can measure. In the demo, meter reads are simulated." action={<Tag kind="SIMULATED" />}>
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-body text-ink-muted">
        <li><span className="text-ink">Tiers.</span> A smart meter (hourly whole-home kWh) verifies every task; a connected device verifies only its own runs; self-reported plans aren&apos;t settled.</li>
        <li><span className="text-ink">Actual use.</span> Each measurable home follows its plan with its own reliability (60–98%, seeded); otherwise a task snaps back to plug-in time. Other load varies ±5%.</li>
        <li><span className="text-ink">Customer baseline</span> for Flex Events: 10 prior weekdays of normal use, average of the 3 highest, in the event window (simplified from Ameren&apos;s Peak Time Rewards). Reduction = baseline − actual.</li>
        <li><span className="text-ink">Delivered shift</span> = peak-window kWh actually avoided; adherence = delivered ÷ planned.</li>
        <li><span className="text-ink">Trust grows with history:</span> reliability ← 0.7 × reliability + 0.3 × adherence. AEP&apos;s expected forecast weights each home by it ({pct(SELF_REPORT_CONFIDENCE)} for self-reported).</li>
      </ol>
    </Card>
  );
}

function HowPointsWork() {
  const rules: [string, string, string][] = [
    ["Commit", "Everyone", `${COMMIT_POINTS} per commit, once a day`],
    ["Contribution", "Self-reported", `${CONTRIBUTION_PER_KWH} per kWh planned out of peak, max ${CONTRIBUTION_MAX}`],
    ["Verified shift", "Smart meter / device", `${VERIFIED_PER_KWH} per kWh delivered out of the peak window`],
    ["Flex Event", "Smart meter / device, joined", `${EVENT_PER_KWH} × multiplier per kWh reduced vs. baseline`],
    ["Accuracy bonus", "Smart meter / device", `+${ACCURACY_BONUS * 100}% of the day's verified points at ≥ ${ACCURACY_THRESHOLD * 100}% adherence`],
    ["Daily cap", "Everyone", `${DAILY_CAP} points`],
  ];
  // Illustrative example (numbers show the formula; the engine computes the real ones).
  const shift = 11.5, reduced = 9.0, mult = 2;
  const verified = shift * VERIFIED_PER_KWH + reduced * EVENT_PER_KWH * mult;
  const bonus = Math.round(verified * ACCURACY_BONUS);
  return (
    <Card title="How points work" explainer="Rewards only, never penalties. Points would convert to bill credits in a real program; we don't show a dollar value.">
      <table className="w-full text-caption">
        <tbody className="divide-y divide-line">
          {rules.map(([rule, who, pts]) => (
            <tr key={rule}>
              <td className="py-1.5 pr-2 font-semibold text-ink">{rule}</td>
              <td className="py-1.5 pr-2 text-ink-muted">{who}</td>
              <td className="py-1.5 text-ink-muted">{pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-caption text-ink-muted">
        <span className="font-semibold text-ink">Example (illustrative):</span> a standard-rate home with a smart meter moves{" "}
        {shift} kWh out of the peak and joins a {mult}× Flex Event. Commit: +{COMMIT_POINTS}. Settlement: {shift} kWh ×{" "}
        {VERIFIED_PER_KWH} = {shift * VERIFIED_PER_KWH}; {reduced} kWh reduced × {EVENT_PER_KWH} × {mult} ={" "}
        {reduced * EVENT_PER_KWH * mult}; 100% adherence → +{bonus}. <span className="text-ink">{verified + bonus} settled</span>, under the {DAILY_CAP} cap.
      </p>
    </Card>
  );
}

function DataFlows() {
  return (
    <Card title="What data flows where" explainer="Simulated in memory; production would be a database plus AEP's meter data system.">
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-body text-ink-muted">
        <li>A committed plan becomes a <span className="font-mono text-ink">plan_submissions</span> row: pseudonymous id, area, tier, 24 h planned kWh. No names or addresses.</li>
        <li>Griddy aggregates groups of {MIN_GROUP_SIZE}+ homes into AEP&apos;s forecast feed (dashboard + CSV): baseline, expected, verified-only, planned.</li>
        <li>After the day, AEP meter data (<span className="font-mono text-ink">meter_reads</span>) settles measurable homes and sends points back.</li>
        <li>AEP never reads household tables directly.</li>
      </ol>
    </Card>
  );
}

function Limitations() {
  return (
    <Card tone="real" title="Limitations and next steps">
      <ul className="flex list-disc flex-col gap-1 pl-5 text-body text-ink">
        <li>Plans are intentions. Verification here uses simulated meter reads; next step: real AMI interval data and device integrations.</li>
        <li>Paying rewards would need an approved utility program or tariff; GridPoints are not money.</li>
        <li>Prices are illustrative until we load the AEP Ohio time-of-use tariff rates.</li>
        <li>The community is synthetic. Real accounts and device integrations would replace it.</li>
        <li>Only AEP Ohio&apos;s time-of-use windows are modeled. Live pricing and other utilities come later.</li>
      </ul>
    </Card>
  );
}

export default function MethodologyPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto flex max-w-[880px] flex-col gap-6 px-6 py-10">
        <PageHeader
          eyebrow="How Griddy works"
          title="Methodology"
          lead="What's real, what's simulated, and how Griddy turns household plans into a load forecast."
        />
        <HowItWorks />
        <WhoItWorksFor />
        <Sources />
        <HowAepVerifies />
        <HowPointsWork />
        <DataFlows />
        <Assumptions />
        <div className="grid gap-6 md:grid-cols-2">
          <Privacy />
          <Limitations />
        </div>
      </main>
    </>
  );
}
