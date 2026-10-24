// app/utility/heatmaps/page.tsx — Heat maps (owner: C). Placeholder until BUILD.md C7–C8.
import { Card, EmptyState } from "@/components/ui";

export default function HeatmapsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-h1">Heat maps</h1>
      <Card title="Where and when residential load is planned" explainer="Each cell = 5+ homes.">
        <EmptyState message="Area × hour and Day × hour heat maps are being built." />
      </Card>
    </div>
  );
}
