// app/methodology/page.tsx — what's real, what's simulated, and how it works (owner: D). DESIGN.md §7.
// Every number here is read from the same constants and snapshots the app uses, so it can't drift.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, Tag, type TagKind } from "@/components/ui";
import { APPLIANCES } from "@/lib/ai/rules";
import { NEIGHBORHOODS } from "@/lib/community";
import { DAY_NAMES, OUTLOOK_DAYS, PLAN_DAY, dayLabel } from "@/lib/config";
import { MIN_GROUP_SIZE } from "@/lib/forecast";
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
  { title: "GridShift schedules", text: "Moves each task to cheaper off-peak hours and spreads starts across the area." },
  { title: "AEP sees projections", text: `Aggregated load by area and hour, 1–${OUTLOOK_DAYS} days out, only for groups of ${MIN_GROUP_SIZE}+ homes.` },
];

function HowItWorks() {
  return (
    <Card title="How it works" explainer="Three steps, from a household's plan to a utility forecast.">
      <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex items-center gap-2 sm:flex-1">
            <div className="h-full flex-1 rounded-control border border-line bg-paper p-3">
              <p className="font-mono text-caption text-ink-muted">{i + 1}</p>
              <p className="text-h2 text-ink">{step.title}</p>
              <p className="mt-1 text-caption text-ink-muted">{step.text}</p>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight size={16} strokeWidth={1.5} className="hidden shrink-0 text-ink-muted sm:block" aria-hidden />
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
          <thead className="text-caption text-ink-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 font-normal">Source</th>
              <th className="py-2 pr-3 font-normal">What we use it for</th>
              <th className="py-2 pr-3 font-normal">Date</th>
              <th className="py-2 font-normal" />
            </tr>
          </thead>
          <tbody>
            {sourceRows().map((row) => (
              <tr key={row.name} className="border-b border-line align-top last:border-0">
                <td className="py-2 pr-3">
                  {row.href ? (
                    <a href={row.href} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:text-ink">
                      {row.name}
                    </a>
                  ) : (
                    row.name
                  )}
                </td>
                <td className="py-2 pr-3 text-ink-muted">{row.use}</td>
                <td className="py-2 pr-3 text-caption text-ink-muted">{row.date}</td>
                <td className="py-2 text-right">
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
          <span className="text-ink">Plan day.</span>{" "}
          <span className="text-ink-muted">
            Every chart shows {dayLabel(PLAN_DAY)} as tomorrow. The 7-day outlook covers {dayLabel(0)} to {lastDay}, all on
            AEP Ohio&apos;s summer schedule. {DAY_NAMES[0]} and {DAY_NAMES[6]} have no peak hours.
          </span>
        </li>
        <li>
          <span className="text-ink">Community.</span>{" "}
          <span className="text-ink-muted">
            {NEIGHBORHOODS.length} synthetic service areas of {NEIGHBORHOODS[0].homes} homes. Each home has a weekly routine (early
            shift, commuter, home all day, night shift). About 60% are enrolled and about 12% have a Thu–Sat trip.
          </span>
        </li>
        <li>
          <span className="text-ink">Baseline.</span>{" "}
          <span className="text-ink-muted">
            Everyone runs big appliances as soon as they get home. Homes that aren&apos;t enrolled keep doing that in the planned
            curve too.
          </span>
        </li>
        <li>
          <span className="text-ink">Scheduling.</span>{" "}
          <span className="text-ink-muted">
            Each task starts at the cheapest time between its earliest start (when the car is plugged in, or the dishwasher is
            loaded) and its deadline. A small spreading term keeps one area&apos;s
            tasks from all starting in the same hour, so the plan doesn&apos;t create a new spike at 6 PM. A second small term uses
            the real PJM forecast to steer away from the zone&apos;s busiest hours (around 7–8 AM and 7 PM), which differ from the
            2–6 PM price window. Bill estimates still use the time-of-use price only.
          </span>
        </li>
        <li>
          <span className="text-ink">Trips.</span>{" "}
          <span className="text-ink-muted">
            A home on a trip drops to standby load (fridge, HVAC) and runs no flexible tasks. Days 2–6 of the outlook are{" "}
            projected from routines and trips, not scheduled.
          </span>
        </li>
      </ul>

      <h3 className="mt-4 text-caption text-ink-muted">Appliance defaults</h3>
      <table className="mt-1 w-full text-left text-body">
        <tbody>
          {APPLIANCES.map((a) => (
            <tr key={a.id + a.label} className="border-b border-line last:border-0">
              <td className="py-1.5 pr-3">{a.label}</td>
              <td className="py-1.5 pr-3 text-right font-mono tabular-nums">{a.kWh} kWh</td>
              <td className="py-1.5 text-right font-mono tabular-nums">{a.powerKW} kW</td>
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
    <Card title="Privacy" explainer="What AEP can and can't see.">
      <ul className="flex list-disc flex-col gap-1 pl-5 text-body text-ink-muted">
        <li>Households opt in. Nothing is shared until a plan is committed.</li>
        <li>AEP sees totals for groups of {MIN_GROUP_SIZE} or more homes only. Smaller groups show as hidden.</li>
        <li>No names, addresses, or single-home curves ever reach the AEP view.</li>
      </ul>
    </Card>
  );
}

function Limitations() {
  return (
    <Card title="Limitations and next steps">
      <ul className="flex list-disc flex-col gap-1 pl-5 text-body text-ink-muted">
        <li>Plans are intentions. Next step: verify them against smart meter (AMI) interval data.</li>
        <li>Prices are illustrative until we load the AEP Ohio time-of-use tariff rates.</li>
        <li>The community is synthetic. Real accounts and device integrations would replace it.</li>
        <li>Only AEP Ohio&apos;s time-of-use windows are modeled. Live pricing and other utilities come later.</li>
      </ul>
    </Card>
  );
}

export default function MethodologyPage() {
  return (
    <main className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 py-8">
      <nav className="flex gap-4 text-caption text-ink-muted">
        <Link href="/" className="hover:text-ink">Customer app</Link>
        <Link href="/utility" className="hover:text-ink">AEP dashboard</Link>
      </nav>
      <header>
        <h1 className="text-h1 text-ink">Methodology</h1>
        <p className="mt-1 text-body text-ink-muted">
          What&apos;s real, what&apos;s simulated, and how GridShift turns household plans into a load forecast.
        </p>
      </header>
      <HowItWorks />
      <Sources />
      <Assumptions />
      <Privacy />
      <Limitations />
    </main>
  );
}
