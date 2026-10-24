// components/ui/ChartFrame.tsx — Card + chart area + loading/empty states (DESIGN.md §3, owner: C)
// Pass exactly one Recharts chart element as the child; it fills the frame's height.
// Shared axis/grid/tooltip styles are in ./chart.tsx.
"use client";

import type { ReactElement, ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";

interface Props {
  title: ReactNode;
  explainer?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  height?: number; // px, chart area only
  loading?: boolean;
  emptyMessage?: string | null; // set to show EmptyState instead of the chart
  callout?: ReactNode; // one line under the chart, e.g. "Peak-hour load −18% (412 kWh moved)"
  children: ReactElement;
  className?: string;
}

export function ChartFrame({
  title,
  explainer,
  action,
  footer,
  height = 260,
  loading = false,
  emptyMessage,
  callout,
  children,
  className,
}: Props) {
  return (
    <Card title={title} explainer={explainer} action={action} footer={footer} className={className}>
      <div style={{ height }} className="w-full">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-control bg-paper" aria-label="Loading chart" />
        ) : emptyMessage ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
      {callout && !loading && !emptyMessage && <div className="mt-3 text-body text-ink">{callout}</div>}
    </Card>
  );
}
