// app/utility/kit/page.tsx — design system scratch page (owner: C). DELETE BEFORE DEMO (BUILD.md C10).
// Shows every token and components/ui piece so teammates can copy usage.
"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ComposedChart, LabelList, Line, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import {
  Button,
  Card,
  ChartFrame,
  ChartTooltip,
  EmptyState,
  InfoTip,
  Segmented,
  SourceNote,
  Stat,
  Tag,
  axisProps,
  chartColors,
  colors,
  dayDividerProps,
  endLabel,
  gridProps,
  heatChange,
  heatLoad,
  hourLabel,
  hourTicks,
  peakBandProps,
  useToast,
  type TagKind,
} from "@/components/ui";

const TAGS: TagKind[] = ["REAL", "SIMULATED", "ILLUSTRATIVE", "PEAK", "OFF-PEAK", "PROJECTED"];

// Sample Sun 9 PM → Mon 11 PM so the day divider shows. Shape only; not real numbers.
const SAMPLE = Array.from({ length: 27 }, (_, i) => {
  const hour = 21 + i;
  const c = hour % 24;
  const evening = c >= 14 && c < 21 ? 1 : 0;
  const baseline = 120 + 90 * evening + 30 * Math.sin(c / 3);
  return { hour, baseline: Math.round(baseline), planned: Math.round(baseline - 45 * evening + (c < 5 ? 25 : 0)) };
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-caption font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      {children}
    </section>
  );
}

function Swatches() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {Object.entries(colors).map(([name, hex]) => (
        <div key={name} className="rounded-control border border-line bg-surface p-2">
          <div className="h-8 rounded-tag border border-line" style={{ background: hex }} />
          <div className="mt-1 text-caption text-ink">{name}</div>
          <div className="font-mono text-caption text-ink-muted">{hex}</div>
        </div>
      ))}
    </div>
  );
}

function HeatScale({ label, steps }: { label: string; steps: readonly string[] }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 text-caption text-ink-muted">{label}</span>
      {steps.map((hex) => (
        <span key={hex} className="h-6 w-10 rounded-tag" style={{ background: hex }} />
      ))}
      <span className="hatch-hidden h-6 w-10 rounded-tag border border-line" title="Hidden for privacy (fewer than 5 homes)" />
    </div>
  );
}

function SampleChart() {
  const last = SAMPLE.length - 1;
  return (
    <ChartFrame
      title="Projected residential load · Monday"
      explainer="kW, sample shape. Baseline = everyone runs things when they get home. Planned = committed plans."
      action={<><Tag kind="SIMULATED" /><InfoTip>Each point is the average load in that hour across all enrolled homes.</InfoTip></>}
      callout={<span>Peak-hour load <span className="font-mono text-plan">−18%</span> (412 kWh moved)</span>}
    >
      <ComposedChart data={SAMPLE} margin={{ top: 20, right: 64, bottom: 0, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="hour" type="number" domain={[21, 47]} ticks={hourTicks(21, 47)} tickFormatter={hourLabel} {...axisProps} />
        <YAxis width={40} {...axisProps} />
        <ReferenceArea {...peakBandProps(38, 42)} />
        <ReferenceLine {...dayDividerProps(24)} />
        <Tooltip content={<ChartTooltip unit="kW" />} />
        <Area type="monotone" dataKey="planned" name="Planned" stroke={chartColors.plan} fill={chartColors.plan} fillOpacity={0.15} strokeWidth={2} isAnimationActive={false}>
          <LabelList content={endLabel("Planned", chartColors.plan, last)} />
        </Area>
        <Line type="monotone" dataKey="baseline" name="Baseline" stroke={chartColors.baseline} strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false}>
          <LabelList content={endLabel("Baseline", chartColors.baseline, last)} />
        </Line>
      </ComposedChart>
    </ChartFrame>
  );
}

export default function KitPage() {
  const [metric, setMetric] = useState<"load" | "change">("change");
  const { showToast, toast } = useToast();

  return (
    <main className="mx-auto max-w-[1280px] space-y-8 px-6 py-8">
      <header>
        <h1 className="text-h1">Design kit</h1>
        <p className="text-caption text-ink-muted">Scratch page for DESIGN.md §2–§4. Delete before the demo.</p>
      </header>

      <Section title="Colors">
        <Swatches />
      </Section>

      <Section title="Heat map scales">
        <HeatScale label="Load (sequential)" steps={heatLoad} />
        <HeatScale label="Change vs. baseline" steps={heatChange} />
      </Section>

      <Section title="Type">
        <Card>
          <div className="font-mono text-display">1,900 kWh</div>
          <div className="text-h1">H1 page title</div>
          <div className="text-h2">H2 card title</div>
          <div className="text-body">Body: Charging at 11 PM avoids the 2–6 PM peak.</div>
          <div className="text-caption text-ink-muted">Caption: Source, explainer, axis.</div>
        </Card>
      </Section>

      <Section title="Tags">
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => <Tag key={t} kind={t} />)}
        </div>
      </Section>

      <Section title="Stats">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Enrolled homes" value="288" tag="SIMULATED" />
          <Stat label="Flexible load committed" value="1,900 kWh" delta="+120 kWh today" deltaTone="plan" tag="SIMULATED" />
          <Stat label="Peak-hour load" value="−18%" delta="vs. baseline" deltaTone="plan" tag="SIMULATED" />
          <Stat label="Savings this week" value="$4.80" delta="+$0.60 vs. last week" deltaTone="plan" tag="ILLUSTRATIVE" />
        </div>
      </Section>

      <Section title="Card, SourceNote, InfoTip">
        <Card
          title="AEP zone context · PJM"
          explainer="What AEP already forecasts for the whole zone. GridShift adds what customers plan to do."
          action={<><Tag kind="REAL" /><InfoTip>MW for the whole AEP zone, so it never shares an axis with our kW.</InfoTip></>}
          footer={<SourceNote source="PJM Data Miner 2" details={["Hourly load forecast", "AEP zone"]} retrieved="Oct 24, 2026" href="https://dataminer2.pjm.com" />}
        >
          <p className="text-body text-ink-muted">Card body.</p>
        </Card>
      </Section>

      <Section title="ChartFrame + shared chart styles">
        <SampleChart />
        <div className="grid gap-3 md:grid-cols-2">
          <ChartFrame title="Loading state" loading height={120}><AreaChart data={[]} /></ChartFrame>
          <ChartFrame title="Empty state" emptyMessage="Hidden for privacy (fewer than 5 homes)." height={120}><AreaChart data={[]} /></ChartFrame>
        </div>
      </Section>

      <Section title="Segmented, Buttons, Toast">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            ariaLabel="Metric"
            options={[{ value: "load", label: "Load" }, { value: "change", label: "Change" }]}
            value={metric}
            onChange={setMetric}
          />
          <Button onClick={() => showToast("Plan committed · +10 GridPoints")}>Commit plan</Button>
          <Button variant="secondary">Find best times</Button>
          <Button variant="quiet">Cancel</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="EmptyState">
        <Card>
          <EmptyState message="No Flex Events yet." actionLabel="Create event" onAction={() => showToast("Event created")} />
        </Card>
      </Section>

      {toast}
    </main>
  );
}
