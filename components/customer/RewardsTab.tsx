// components/customer/RewardsTab.tsx — GridPoints total and history (owner: B)
// DESIGN.md §5.4: total, a short history, one line on how points work. No prize catalog.
import { Award } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";

export interface PointsEntry {
  id: string;
  label: string; // "Committed plan", "Committed plan · Flex Event Mon 4–6 PM (2×)"
  points: number;
}

interface Props {
  points: number;
  history: PointsEntry[];
  onPlan: () => void;
}

export function RewardsTab({ points, history, onPlan }: Props) {
  return (
    <>
      <Card title="GridPoints" explainer="Earn 10 points each time you commit a plan. Flex Events multiply them.">
        <p className="font-mono text-display text-ink">{points.toLocaleString("en-US")}</p>
      </Card>

      <Card title="History">
        {history.length === 0 ? (
          <EmptyState icon={Award} message="Commit a plan to earn your first points." actionLabel="Go to Plan" onAction={onPlan} />
        ) : (
          <ul className="divide-y divide-line">
            {[...history].reverse().map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-body text-ink">{e.label}</span>
                <span className="font-mono text-body text-plan">+{e.points}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
