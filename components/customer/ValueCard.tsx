// components/customer/ValueCard.tsx — what Jordan's plan is worth, by setup (owner: B, PHASE4.md §6)
// Time-of-use: dollar savings + points. Flat + measurable: pending points + an illustrative
// time-of-use comparison. Flat + not measurable: forecast help + contribution points + how to get verified.
import type { CustomerSetup, MyStatus, ScheduledTask } from "@/lib/types";
import { Card, Stat, Tag } from "@/components/ui";
import { money } from "./hours";
import { kWh, planTotals } from "./totals";

function sum(lines: { points: number }[]): number {
  return lines.reduce((s, l) => s + l.points, 0);
}

function Row({ children, tag }: { children: React.ReactNode; tag: "ILLUSTRATIVE" | "SIMULATED" }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-body text-ink">{children}</span>
      <Tag kind={tag} />
    </div>
  );
}

export function ValueCard({ setup, status, schedule }: { setup?: CustomerSetup; status: MyStatus | null; schedule: ScheduledTask[] }) {
  const { saved, peakKWhAvoided } = planTotals(schedule);
  const pending = sum(status?.pending ?? []);
  const settled = (status?.history ?? []).filter((l) => l.rule === "contribution" || l.rule === "commit");
  const measurable = setup?.verification === "smart_meter" || setup?.verification === "device";
  const tou = status?.touComparison;

  // Before a setup is picked (or on time-of-use): the original dollar + kWh stats.
  if (!setup || setup.rate === "tou") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Saved this week" value={money(saved)} tag="ILLUSTRATIVE" />
          <Stat label="Moved out of peak" value={kWh(peakKWhAvoided)} tag="SIMULATED" />
        </div>
        {pending > 0 && <Row tag="SIMULATED">Pending <span className="font-mono">{pending}</span> pts · settles after Monday&apos;s meter read</Row>}
      </div>
    );
  }

  return (
    <Card title="What your plan is worth" explainer="Same price all day on the standard rate, so shifting doesn't change your bill.">
      <div className="space-y-2">
        <Row tag="SIMULATED">Moved out of peak: <span className="font-mono">{kWh(peakKWhAvoided)}</span></Row>
        {measurable ? (
          <>
            <Row tag="SIMULATED">
              Pending <span className="font-mono font-semibold text-plan">{pending}</span> pts · settles after Monday&apos;s meter read
            </Row>
            {tou && tou.flatMonthly > tou.touMonthly && (
              <Row tag="ILLUSTRATIVE">
                On time-of-use this plan would save about <span className="font-mono">{money(tou.flatMonthly - tou.touMonthly)}</span>/month
              </Row>
            )}
          </>
        ) : (
          <>
            <Row tag="SIMULATED">
              Your plan helps AEP forecast demand · <span className="font-mono">+{sum(settled)}</span> pts
            </Row>
            <p className="text-caption text-ink-muted">
              Get verified to earn rewards for shifting: a smart thermostat (AEP Power Rewards) or a smart meter.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
