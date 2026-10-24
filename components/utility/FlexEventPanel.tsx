// components/utility/FlexEventPanel.tsx — AEP creates a Flex Event; customers see it as a banner (owner: C)
"use client";

import { useState } from "react";
import type { FlexEvent } from "@/lib/types";
import { createEvent, type NewFlexEvent } from "./api";
import { ALL_HOURS, fullHourLabel } from "./hours";

// Default: tomorrow 5–7 PM, 2× GridPoints (the demo story in PLAN.md §3).
const DEFAULT_EVENT: NewFlexEvent = {
  startHour: 41,
  endHour: 43,
  multiplier: 2,
  message: "Reduce load 5–7 PM tomorrow and earn 2× GridPoints.",
};

function HourSelect({ label, value, onChange }: { label: string; value: number; onChange: (h: number) => void }) {
  return (
    <label className="text-sm">
      <span className="block text-xs text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5"
      >
        {ALL_HOURS.map((h) => (
          <option key={h} value={h}>
            {fullHourLabel(h)}
          </option>
        ))}
      </select>
    </label>
  );
}

function validate(e: NewFlexEvent): string | null {
  if (e.endHour <= e.startHour) return "End must be after start.";
  if (e.multiplier < 1) return "Multiplier must be at least 1×.";
  if (!e.message.trim()) return "Add a message for customers.";
  return null;
}

interface Props {
  events: FlexEvent[];
  onCreated: () => void; // parent re-fetches the event list
}

export function FlexEventPanel({ events, onCreated }: Props) {
  const [draft, setDraft] = useState<NewFlexEvent>(DEFAULT_EVENT);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<NewFlexEvent>) => setDraft((d) => ({ ...d, ...patch }));

  async function submit() {
    const error = validate(draft);
    if (error) return setStatus(error);
    setBusy(true);
    try {
      await createEvent(draft);
      setStatus("Flex Event sent to customers.");
      onCreated();
    } catch {
      setStatus("Could not send the event. Is the dev server running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-800">Flex Events</h2>
      <p className="mt-1 text-sm text-slate-500">Ask customers to shift load out of a window. Rewards are GridPoints, not money.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <HourSelect label="Start" value={draft.startHour} onChange={(h) => update({ startHour: h })} />
        <HourSelect label="End" value={draft.endHour} onChange={(h) => update({ endHour: h })} />
        <label className="text-sm">
          <span className="block text-xs text-slate-500">GridPoints multiplier</span>
          <input
            type="number"
            min={1}
            step={0.5}
            value={draft.multiplier}
            onChange={(e) => update({ multiplier: Number(e.target.value) })}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          />
        </label>
      </div>
      <label className="mt-3 block text-sm">
        <span className="block text-xs text-slate-500">Message to customers</span>
        <input
          value={draft.message}
          onChange={(e) => update({ message: e.target.value })}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
        />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send Flex Event"}
        </button>
        {status && <span className="text-sm text-slate-600">{status}</span>}
      </div>

      <h3 className="mt-5 text-sm font-medium text-slate-700">Active events</h3>
      {events.length === 0 ? (
        <p className="mt-1 text-sm text-slate-400">None yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="text-slate-700">{e.message}</span>
              <span className="text-slate-500">
                {fullHourLabel(e.startHour)} – {fullHourLabel(e.endHour)} · {e.multiplier}× points
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
