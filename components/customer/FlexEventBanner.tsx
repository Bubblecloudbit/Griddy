// components/customer/FlexEventBanner.tsx — AEP Flex Event on Today with "Join" (owner: B)
// DESIGN.md §5.1. Joining adds the event to the next plan commit, which earns its multiplier.
import { Zap } from "lucide-react";
import type { FlexEvent } from "@/lib/types";
import { Button } from "@/components/ui";
import { eventLabel } from "./hours";

interface Props {
  event: FlexEvent;
  joined: boolean;
  onJoin: () => void;
}

export function FlexEventBanner({ event, joined, onJoin }: Props) {
  return (
    <section className="rounded-card border border-peak bg-peak-wash p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.04em] text-peak">
            <Zap size={14} strokeWidth={1.5} aria-hidden />
            Flex Event from AEP
          </p>
          <h2 className="mt-1 text-h2 text-ink">
            {eventLabel(event)} · <span className="font-mono">{event.multiplier}×</span> points
          </h2>
          <p className="mt-1 text-caption text-ink-muted">{event.message}</p>
        </div>
        <Button variant={joined ? "secondary" : "primary"} onClick={onJoin} disabled={joined}>
          {joined ? "Joined" : "Join"}
        </Button>
      </div>
      {joined && (
        <p className="mt-2 text-caption text-ink">Counts toward your next plan commit.</p>
      )}
    </section>
  );
}
