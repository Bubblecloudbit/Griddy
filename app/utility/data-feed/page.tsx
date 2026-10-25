// app/utility/data-feed/page.tsx — Data feed (owner: C, PLAN.md §7a AEP 4)
// What flows between Griddy and AEP: the pipeline, live intake counters, one sample
// aggregated row, and the forecast CSV. AEP only ever sees aggregates of 5+ homes.
"use client";

import { useCallback } from "react";
import { ArrowDown, Download } from "lucide-react";
import { Card, PageHeader, Stat, Tag, formatInt } from "@/components/ui";
import { fetchIntake } from "@/components/utility/api";
import { fullHourLabel } from "@/components/utility/hours";
import { usePolling } from "@/components/utility/usePolling";

const STEPS: { title: string; body: string }[] = [
  { title: "Customer app", body: "Plan committed: tasks, trips, setup" },
  { title: "Griddy API → plan_submissions", body: "Pseudonymous id, area, measurement tier, 24 h planned kWh. No names, no addresses." },
  { title: "Aggregate (≥ 5 homes)", body: "Per area × hour: baseline, expected, verified-only, planned, homes, verified homes" },
  { title: "AEP forecast feed", body: "This dashboard, plus the CSV below" },
  { title: "AEP meter data (AMI) → meter_reads → settlement", body: "After the day: measured shift and Flex Event reduction, points back to customers" },
];

function Pipeline() {
  return (
    <ol className="space-y-1">
      {STEPS.map((s, i) => (
        <li key={s.title}>
          <div className="rounded-control border border-line bg-paper px-3 py-2">
            <div className="text-body font-semibold text-ink">{s.title}</div>
            <div className="text-caption text-ink-muted">{s.body}</div>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex justify-center py-0.5 text-ink-muted">
              <ArrowDown size={14} strokeWidth={1.5} aria-hidden />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

// One real row of the export (Oak Hill, Mon 4 PM), shown as the JSON an integration would receive.
async function sampleRow(): Promise<Record<string, string | number>> {
  const csv = await fetch("/api/export?scope=n1", { cache: "no-store" }).then((r) => r.text());
  const [header, ...rows] = csv.trim().split("\n");
  const keys = header.split(",");
  const row = rows.find((r) => r.includes("2026-10-26T16:00")) ?? rows[0];
  const values = row.split(",");
  return Object.fromEntries(keys.map((k, i) => [k, i < 2 ? values[i] : Number(values[i])]));
}

export default function DataFeedPage() {
  const { data: intake } = usePolling(fetchIntake);
  const loadSample = useCallback(sampleRow, []);
  const { data: sample } = usePolling(loadSample);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AEP · Residential flexibility"
        title="Data feed"
        lead="What a real integration would exchange, simulated in memory. Production: a database plus AEP's meter data system."
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Plans received" value={intake ? formatInt(intake.plansReceived) : "—"} delta="plan_submissions rows" tag="SIMULATED" />
        <Stat label="Verified share" value={intake ? `${intake.verifiedSharePct}%` : "—"} delta="smart meter or device" tag="SIMULATED" />
        <Stat
          label="Last plan received"
          value={intake?.lastReceivedHour != null ? fullHourLabel(intake.lastReceivedHour) : "—"}
          delta="demo clock"
          tag="SIMULATED"
        />
        <Stat label="Meter reads" value={intake ? formatInt(intake.meterReads) : "—"} delta="after Monday is settled" tag="SIMULATED" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="How data flows" explainer="AEP never reads household tables. It only calls aggregate endpoints (5+ homes per group).">
          <Pipeline />
        </Card>
        <Card
          title="Sample aggregated payload"
          explainer="One area × hour from the forecast feed (Oak Hill, Mon 4 PM). kW, simulated."
          action={<Tag kind="SIMULATED" />}
          footer={
            <a
              href="/api/export?scope=region"
              className="inline-flex items-center gap-2 rounded-control border border-ink bg-ink px-3 py-2 text-body font-medium text-surface transition-colors duration-fast hover:bg-ink/90"
            >
              <Download size={16} strokeWidth={1.5} aria-hidden />
              Download forecast CSV
            </a>
          }
        >
          <pre className="overflow-x-auto rounded-control bg-paper p-3 font-mono text-caption text-ink">
            {sample ? JSON.stringify(sample, null, 2) : "Loading…"}
          </pre>
        </Card>
      </div>
    </div>
  );
}
