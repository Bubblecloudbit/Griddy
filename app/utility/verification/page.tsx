// app/utility/verification/page.tsx — Verification (owner: C, PHASE4.md §6 AEP 3)
// "Simulate Monday's meter reads" (a labeled demo) → committed vs. delivered by tier, Flex Event
// reduction, points issued, reliability by area. Aggregates only (≥5 homes per area row).
"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { SettlementSummary, Verification } from "@/lib/types";
import { Button, Card, EmptyState, Stat, Tag, formatInt, formatKWh } from "@/components/ui";
import { fetchSettlement, settlePlanDay } from "@/components/utility/api";
import { usePolling } from "@/components/utility/usePolling";

const TIERS: { tier: Verification; label: string }[] = [
  { tier: "smart_meter", label: "Smart meter" },
  { tier: "device", label: "Connected device" },
  { tier: "none", label: "Self-reported" },
];

function TierTable({ s }: { s: SettlementSummary }) {
  return (
    <table className="w-full text-body">
      <thead>
        <tr className="text-left text-caption text-ink-muted">
          <th className="py-1 font-normal">Measured by</th>
          <th className="py-1 text-right font-normal">Homes</th>
          <th className="py-1 text-right font-normal">Committed</th>
          <th className="py-1 text-right font-normal">Delivered</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {TIERS.map(({ tier, label }) => {
          const t = s.byTier[tier];
          const measurable = tier !== "none";
          return (
            <tr key={tier}>
              <td className="py-2 text-ink">{label}</td>
              <td className="py-2 text-right font-mono">{formatInt(t.homes)}</td>
              <td className="py-2 text-right font-mono">{formatKWh(t.plannedKWh)}</td>
              <td className="py-2 text-right font-mono">
                {measurable ? (
                  <>
                    {formatKWh(t.deliveredKWh)}{" "}
                    <span className="text-ink-muted">({t.plannedKWh > 0 ? Math.round((t.deliveredKWh / t.plannedKWh) * 100) : 0}%)</span>
                  </>
                ) : (
                  <span className="text-ink-muted">not measurable</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Results({ s }: { s: SettlementSummary }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Homes settled" value={formatInt(s.homesSettled)} delta="smart meter or device" tag="SIMULATED" />
        <Stat label="Shift delivered" value={`${s.deliveredPct}%`} delta="of what measurable homes committed" deltaTone="plan" tag="SIMULATED" />
        <Stat label="Flex Event reduction" value={formatKWh(s.eventReducedKWh)} delta="vs. customer baselines" tag="SIMULATED" />
        <Stat label="Points issued" value={formatInt(s.pointsIssued)} delta="GridPoints, not dollars" tag="SIMULATED" />
      </div>
      <Card
        title="Committed vs. delivered · Mon 2–6 PM"
        explainer="kWh moved out of the peak window. Self-reported plans still help the forecast, but can't be measured or paid."
        action={<Tag kind="SIMULATED" />}
      >
        <TierTable s={s} />
      </Card>
      <Card title="Reliability by area" explainer="Average share of plans followed, measurable homes only. Areas with fewer than 5 are hidden." action={<Tag kind="SIMULATED" />}>
        <ul className="divide-y divide-line">
          {s.reliabilityByArea.map((a) => (
            <li key={a.areaId} className="flex items-center gap-3 py-2">
              <span className="w-32 shrink-0 text-body text-ink">{a.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-tag bg-paper">
                <div className="h-full bg-plan" style={{ width: `${Math.round(a.avgReliability * 100)}%` }} />
              </div>
              <span className="w-24 text-right font-mono text-caption text-ink-muted">
                {Math.round(a.avgReliability * 100)}% · {a.homes} homes
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function VerificationPage() {
  const { data } = usePolling(fetchSettlement);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<SettlementSummary | null>(null);
  const summary = fresh ?? data;

  async function settle() {
    setBusy(true);
    setError(null);
    try {
      setFresh(await settlePlanDay());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1">Verification</h1>
          <p className="text-caption text-ink-muted">AEP only pays for what it can measure. Meter reads here are simulated.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-tag border border-ink-muted px-1.5 py-0.5 text-tag uppercase text-ink-muted">Demo</span>
          <Button onClick={settle} disabled={busy || summary?.settled}>
            {summary?.settled ? "Monday settled" : busy ? "Reading meters…" : "Simulate Monday's meter reads"}
          </Button>
        </div>
      </div>
      {error && <p role="alert" className="text-caption text-danger">{error}</p>}
      {!summary ? (
        <div className="h-40 animate-pulse rounded-card border border-line bg-surface" />
      ) : summary.settled ? (
        <Results s={summary} />
      ) : (
        <Card title="Not settled yet">
          <EmptyState
            icon={ShieldCheck}
            message="After Monday, AEP's meter data shows what each measurable home actually did. Press the demo button to simulate those reads: delivered shift by tier, Flex Event reductions vs. each home's baseline, and the points that settle."
          />
        </Card>
      )}
    </div>
  );
}
