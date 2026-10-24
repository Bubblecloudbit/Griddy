// components/utility/events/EventList.tsx — events with opted-in homes (owner: A, BUILD.md A10)
// Polls every 5 s so "homes opted in" ticks up live when Jordan joins on the customer app.
"use client";

import { Zap } from "lucide-react";
import { Card, EmptyState, Tag, formatInt, formatKWh } from "@/components/ui";
import type { FlexEvent } from "@/lib/types";
import { rangeLabel } from "../hours";
import { estimateShiftedKWh, type EventsView } from "./api";

function EventRow({ event, view }: { event: FlexEvent; view: EventsView }) {
  const kWh = estimateShiftedKWh(event, view.forecast, view.enrolledHomes);
  return (
    <li className="space-y-1 border-t border-line py-3 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-h2 text-ink">
          {rangeLabel(event.startHour, event.endHour)} · {event.multiplier}× points
        </span>
        <Tag kind="SIMULATED" />
      </div>
      <p className="text-caption text-ink-muted">{event.message}</p>
      <p className="text-caption text-ink-muted">
        <span className="font-mono text-ink">{formatInt(event.optedIn ?? 0)}</span> homes opted in ·{" "}
        <span className="font-mono text-ink">≈ {formatKWh(kWh)}</span> kept out of the window
      </p>
    </li>
  );
}

export function EventList({ view }: { view: EventsView | null }) {
  const events = view ? [...view.events].sort((a, b) => a.startHour - b.startHour) : [];
  return (
    <Card
      title="Flex Events"
      explainer="Opted-in homes and an estimate of the energy they keep out of each window. Homes and kWh are simulated."
    >
      {!view ? (
        <div className="h-24 animate-pulse rounded-control bg-paper" />
      ) : events.length === 0 ? (
        <EmptyState message="No Flex Events yet. Create one to see it on the customer app." icon={Zap} />
      ) : (
        <ul>{events.map((e) => <EventRow key={e.id} event={e} view={view} />)}</ul>
      )}
    </Card>
  );
}
