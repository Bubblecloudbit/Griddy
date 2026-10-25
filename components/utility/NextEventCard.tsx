// components/utility/NextEventCard.tsx — "Next Flex Event" on the Overview (DESIGN.md §6.1, owner: C)
// Reads summary.nextEvent; creating events lives on A's /utility/events page (BUILD.md A10).
"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { BUTTON_BASE, BUTTON_VARIANTS, Card, EmptyState, formatInt } from "@/components/ui";
import { fetchSummary } from "./api";
import { rangeLabel } from "./hours";
import { usePolling } from "./usePolling";

function CreateLink() {
  return (
    <Link
      href="/utility/events"
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS.secondary}`}
    >
      Create event
      <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
    </Link>
  );
}

export function NextEventCard() {
  const { data } = usePolling(fetchSummary);
  const event = data?.nextEvent ?? null;

  return (
    <Card eyebrow="Demand response" title="Next Flex Event" explainer="Ask enrolled homes to shift load out of a window. Rewards are GridPoints, not money.">
      {!data ? (
        <div className="h-24 animate-pulse rounded-control bg-paper" />
      ) : !event ? (
        <EmptyState message="No Flex Event scheduled." icon={Zap} />
      ) : (
        <div className="space-y-2 rounded-control border-l-[3px] border-peak bg-peak-wash/60 px-4 py-3">
          <div className="font-display text-h2 text-ink">
            {rangeLabel(event.startHour, event.endHour)} · {event.multiplier}× points
          </div>
          <p className="text-body text-ink-muted">{event.message}</p>
          <p className="text-caption text-ink-muted">
            <span className="font-mono text-ink">{formatInt(event.optedIn ?? 0)}</span>{" "}
            {event.optedIn === 1 ? "home" : "homes"} opted in
          </p>
        </div>
      )}
      <div className="mt-4">
        <CreateLink />
      </div>
    </Card>
  );
}
