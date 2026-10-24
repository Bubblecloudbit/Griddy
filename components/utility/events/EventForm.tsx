// components/utility/events/EventForm.tsx — create a Flex Event (owner: A, BUILD.md A10)
// Day, start, end, multiplier, message, with a live preview of the customer banner.
"use client";

import { useState } from "react";
import { Button, Card, Segmented } from "@/components/ui";
import { DAY_NAMES, HORIZON_HOURS } from "@/lib/config";
import { clockLabel, rangeLabel } from "../hours";
import { createFlexEvent } from "./api";
import { BannerPreview } from "./BannerPreview";

const DAYS = Array.from({ length: HORIZON_HOURS / 24 }, (_, d) => ({ value: String(d), label: DAY_NAMES[d % 7] }));
const MULTIPLIERS = [
  { value: "1.5", label: "1.5×" },
  { value: "2", label: "2×" },
  { value: "3", label: "3×" },
];
const START_CLOCKS = Array.from({ length: 24 }, (_, c) => c); // 12 AM … 11 PM
const END_CLOCKS = Array.from({ length: 24 }, (_, c) => c + 1); // 1 AM … 12 AM (midnight)

function suggestedMessage(start: number, end: number, multiplier: number): string {
  return `Shift load out of ${rangeLabel(start, end)} and earn ${multiplier}× GridPoints.`;
}

const selectClass = "rounded-control border border-line bg-surface px-2 py-1.5 font-mono text-body text-ink";

export function EventForm({ onCreated }: { onCreated: (label: string) => void }) {
  const [day, setDay] = useState("1"); // Mon Oct 26, the plan day
  const [startClock, setStartClock] = useState(16); // 4 PM
  const [endClock, setEndClock] = useState(18); // 6 PM
  const [multiplier, setMultiplier] = useState("2");
  const [customMessage, setCustomMessage] = useState<string | null>(null); // null = use the suggestion
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startHour = Number(day) * 24 + startClock;
  const endHour = Number(day) * 24 + endClock;
  const mult = Number(multiplier);
  const message = customMessage ?? suggestedMessage(startHour, endHour, mult);
  const invalid = endClock <= startClock ? "End must be after start." : !message.trim() ? "Add a message for customers." : null;

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const event = await createFlexEvent({ startHour, endHour, multiplier: mult, message: message.trim() });
      onCreated(`${rangeLabel(event.startHour, event.endHour)} · ${event.multiplier}×`);
      setCustomMessage(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Create a Flex Event" explainer="Ask customers to shift load out of a window. Rewards are GridPoints, not money.">
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="text-caption text-ink-muted">Day</div>
          <Segmented ariaLabel="Day" options={DAYS} value={day} onChange={setDay} />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="space-y-1">
            <div className="text-caption text-ink-muted">Start</div>
            <select className={selectClass} value={startClock} onChange={(e) => setStartClock(Number(e.target.value))}>
              {START_CLOCKS.map((c) => <option key={c} value={c}>{clockLabel(c)}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <div className="text-caption text-ink-muted">End</div>
            <select className={selectClass} value={endClock} onChange={(e) => setEndClock(Number(e.target.value))}>
              {END_CLOCKS.map((c) => <option key={c} value={c}>{clockLabel(c)}</option>)}
            </select>
          </label>
          <div className="space-y-1">
            <div className="text-caption text-ink-muted">GridPoints multiplier</div>
            <Segmented ariaLabel="GridPoints multiplier" options={MULTIPLIERS} value={multiplier} onChange={setMultiplier} />
          </div>
        </div>

        <label className="block space-y-1">
          <div className="text-caption text-ink-muted">Message to customers</div>
          <textarea
            className="w-full rounded-control border border-line bg-surface px-2 py-1.5 text-body text-ink"
            rows={2}
            value={message}
            onChange={(e) => setCustomMessage(e.target.value)}
          />
        </label>

        <div className="space-y-1">
          <div className="text-caption text-ink-muted">Preview on the customer app</div>
          <BannerPreview startHour={startHour} endHour={endHour} multiplier={mult} message={message} />
        </div>

        {(invalid || error) && <p className="text-caption text-danger">{invalid ?? error}</p>}
        <Button onClick={submit} disabled={!!invalid || saving}>
          {saving ? "Creating…" : "Create event"}
        </Button>
      </div>
    </Card>
  );
}
