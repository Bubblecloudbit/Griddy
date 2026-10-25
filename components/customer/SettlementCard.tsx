// components/customer/SettlementCard.tsx — Jordan's measured result (owner: B, PHASE4.md §6)
// Shown once AEP has run "Simulate Monday's meter reads". Everything here is simulated.
import type { Settlement } from "@/lib/types";
import { Card, InfoTip, Tag } from "@/components/ui";

const SOURCE: Record<Settlement["verification"], string> = {
  smart_meter: "Verified by smart meter (simulated)",
  device: "Verified by your connected device (simulated)",
  none: "Self-reported",
};

function kwh(n: number): string {
  return `${n.toFixed(1)} kWh`;
}

export function SettlementCard({ settlement }: { settlement: Settlement }) {
  const total = settlement.points.reduce((s, l) => s + l.points, 0);
  const e = settlement.event;
  return (
    <Card
      title="Monday, measured"
      explainer={SOURCE[settlement.verification]}
      action={<Tag kind="SIMULATED" />}
    >
      <ul className="space-y-1.5 text-body text-ink">
        <li>
          Moved out of 2–6 PM: <span className="font-mono">{kwh(settlement.deliveredShiftKWh)}</span> of{" "}
          <span className="font-mono">{kwh(settlement.plannedShiftKWh)}</span> planned ·{" "}
          <span className="font-mono">{Math.round(settlement.adherence * 100)}%</span>
        </li>
        {e && (
          <li className="flex items-start gap-1">
            <span>
              Flex Event: baseline <span className="font-mono">{kwh(e.baselineKWh)}</span> · actual{" "}
              <span className="font-mono">{kwh(e.actualKWh)}</span> ·{" "}
              <span className="font-mono font-semibold text-plan">{kwh(e.reducedKWh)} reduced</span>
            </span>
            <InfoTip label="How the baseline works">
              Your baseline is what you&apos;d normally use in that window: the average of your 3 highest of the last
              10 weekdays (simplified from Ameren&apos;s Peak Time Rewards method).
            </InfoTip>
          </li>
        )}
      </ul>
      <ul className="mt-3 space-y-1 border-t border-line pt-3">
        {settlement.points.map((l) => (
          <li key={l.rule} className="flex justify-between gap-2 text-caption">
            <span className="text-ink-muted">{l.label} · {l.detail}</span>
            <span className="font-mono text-plan">+{l.points}</span>
          </li>
        ))}
        <li className="flex justify-between gap-2 text-body font-semibold">
          <span>Settled</span>
          <span className="font-mono text-plan">+{total} pts</span>
        </li>
      </ul>
    </Card>
  );
}
