// components/customer/RewardsTab.tsx — GridPoints by rule, pending vs. settled, reliability (owner: B)
// DESIGN.md §5.4 + PLAN.md §7a No prize catalog, no dollar conversion.
import { Award } from "lucide-react";
import type { MyStatus, PointsLine } from "@/lib/types";
import { Card, EmptyState, Tag } from "@/components/ui";
import {
  ACCURACY_BONUS, ACCURACY_THRESHOLD, COMMIT_POINTS, CONTRIBUTION_MAX, CONTRIBUTION_PER_KWH, DAILY_CAP, EVENT_PER_KWH, VERIFIED_PER_KWH,
} from "@/lib/points";
import { SettlementCard } from "./SettlementCard";

const HOW: [string, string][] = [
  ["Commit", `${COMMIT_POINTS} per commit, once a day`],
  ["Contribution", `${CONTRIBUTION_PER_KWH} per kWh planned out of peak, max ${CONTRIBUTION_MAX} (self-reported only)`],
  ["Verified shift", `${VERIFIED_PER_KWH} per kWh delivered out of 2–6 PM (smart meter or device)`],
  ["Flex Event", `${EVENT_PER_KWH} × multiplier per kWh reduced vs. your baseline`],
  ["Accuracy bonus", `+${ACCURACY_BONUS * 100}% if you deliver ${ACCURACY_THRESHOLD * 100}% of your plan`],
  ["Daily cap", `${DAILY_CAP} points`],
];

function Lines({ lines }: { lines: PointsLine[] }) {
  return (
    <ul className="divide-y divide-line">
      {lines.map((l, i) => (
        <li key={`${l.rule}-${i}`} className="flex items-center justify-between gap-3 py-2">
          <span className="min-w-0">
            <span className="block text-body text-ink">{l.label}</span>
            <span className="block text-caption text-ink-muted">{l.detail}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className={`font-mono text-body ${l.status === "settled" ? "text-plan" : "text-ink-muted"}`}>+{l.points}</span>
            <span className={`rounded-tag border px-1.5 py-0.5 text-tag uppercase ${l.status === "settled" ? "border-transparent bg-plan-wash text-plan" : "border-ink-muted text-ink-muted"}`}>
              {l.status}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function RewardsTab({ status, onPlan }: { status: MyStatus | null; onPlan: () => void }) {
  const lines = [...(status?.history ?? []), ...(status?.pending ?? [])];
  const pending = (status?.pending ?? []).reduce((s, l) => s + l.points, 0);
  const reliability = status?.reliability;

  return (
    <>
      <Card tone="brand" eyebrow="GridPoints" title="Your balance" explainer="Points reward load you shift. Measured shifts earn the most." action={<Tag kind="SIMULATED" />}>
        <p className="font-display text-[44px] font-semibold leading-none text-brand">{(status?.points ?? 0).toLocaleString("en-US")}</p>
        {pending > 0 && <p className="mt-1 text-caption text-ink-muted">+{pending} pending · settles after Monday&apos;s meter read</p>}
      </Card>

      {status?.settlement && <SettlementCard settlement={status.settlement} />}

      <Card title="Points by rule">
        {lines.length === 0 ? (
          <EmptyState icon={Award} message="Commit a plan to earn your first points." actionLabel="Go to Plan" onAction={onPlan} />
        ) : (
          <Lines lines={lines} />
        )}
      </Card>

      {reliability !== undefined && (
        <Card title="Reliability" explainer="How often you follow your plan, from your meter. Higher reliability makes your plans count more in AEP's forecast.">
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-tag bg-paper">
              <div className="h-full bg-plan" style={{ width: `${Math.round(reliability * 100)}%` }} />
            </div>
            <span className="font-mono text-body text-ink">{Math.round(reliability * 100)}%</span>
          </div>
        </Card>
      )}

      <Card title="How points work">
        <dl className="space-y-1.5 text-caption">
          {HOW.map(([rule, text]) => (
            <div key={rule} className="flex gap-2">
              <dt className="w-28 shrink-0 font-semibold text-ink">{rule}</dt>
              <dd className="text-ink-muted">{text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-caption text-ink-muted">Rewards only, never penalties.</p>
      </Card>
    </>
  );
}
