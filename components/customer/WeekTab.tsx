// components/customer/WeekTab.tsx — weekly routine, mini week strip, trips (owner: B)
// DESIGN.md §5.3. Routine and trips are sent with the next plan commit.
"use client";

import { useState } from "react";
import { Plane, Plus, X } from "lucide-react";
import type { Trip, WeeklyRoutine } from "@/lib/types";
import { DAY_NAMES } from "@/lib/config";
import { ROUTINE_PRESETS } from "@/lib/routines";
import { Button, Card } from "@/components/ui";
import { clockLabel, dateLabel, outlookDates } from "./hours";

interface Props {
  routine: WeeklyRoutine;
  trips: Trip[];
  onRoutineChange: (routine: WeeklyRoutine) => void;
  onTripsChange: (trips: Trip[]) => void;
}

const PRESET_IDS = Object.keys(ROUTINE_PRESETS) as WeeklyRoutine["preset"][];
const WEEKDAYS = [1, 2, 3, 4, 5];

const controlClass =
  "rounded-control border border-line bg-surface px-2.5 py-1.5 text-body text-ink hover:border-ink-muted focus:border-brand focus:outline-none";

function HourSelect({ value, from, to, onChange }: { value: number; from: number; to: number; onChange: (h: number) => void }) {
  return (
    <select className={controlClass} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {Array.from({ length: to - from + 1 }, (_, i) => from + i).map((h) => (
        <option key={h} value={h}>{clockLabel(h)}</option>
      ))}
    </select>
  );
}

export function WeekTab({ routine, trips, onRoutineChange, onTripsChange }: Props) {
  return (
    <>
      <RoutineCard routine={routine} onChange={onRoutineChange} />
      <WeekStrip routine={routine} trips={trips} />
      <TripsCard trips={trips} onChange={onTripsChange} />
      <p className="text-caption text-ink-muted">Saved with your next plan commit.</p>
    </>
  );
}

function RoutineCard({ routine, onChange }: { routine: WeeklyRoutine; onChange: (r: WeeklyRoutine) => void }) {
  const away = routine.awayBlocks[0];

  // Any hand edit turns the routine into "Custom" with one weekday away block.
  function edit(start: number, end: number, plugInHour: number) {
    onChange({ preset: "custom", awayBlocks: [{ days: WEEKDAYS, start, end }], plugInHour });
  }

  return (
    <Card title="Routine" explainer={ROUTINE_PRESETS[routine.preset].summary}>
      <div className="flex flex-wrap gap-2">
        {PRESET_IDS.map((id) => (
          <Button
            key={id}
            variant={routine.preset === id ? "primary" : "secondary"}
            className="rounded-full px-3 py-1 text-caption"
            aria-pressed={routine.preset === id}
            onClick={() => onChange(ROUTINE_PRESETS[id].routine)}
          >
            {ROUTINE_PRESETS[id].label}
          </Button>
        ))}
      </div>

      <div className="mt-3 space-y-2 text-caption text-ink-muted">
        <div className="flex flex-wrap items-center gap-2">
          Away weekdays
          <HourSelect value={away?.start ?? 8} from={0} to={23} onChange={(h) => edit(h, Math.max(h + 1, away?.end ?? 17), routine.plugInHour)} />
          –
          <HourSelect value={away?.end ?? 17} from={1} to={24} onChange={(h) => edit(Math.min(away?.start ?? 8, h - 1), h, routine.plugInHour)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          Car plugged in at
          <HourSelect value={routine.plugInHour} from={0} to={23} onChange={(h) => edit(away?.start ?? 8, away?.end ?? 17, h)} />
        </div>
      </div>
    </Card>
  );
}

function tripOn(trips: Trip[], iso: string): Trip | undefined {
  return trips.find((t) => t.startDate <= iso && iso <= t.endDate);
}

// Sun–Sat: plane on trip days; otherwise a shaded band for the routine's away hours.
function WeekStrip({ routine, trips }: { routine: WeeklyRoutine; trips: Trip[] }) {
  const dates = outlookDates();
  return (
    <Card title="This week" explainer="Shaded = away from home (top is midnight). Plane = trip.">
      <div className="grid grid-cols-7 gap-1">
        {dates.map((iso, d) => {
          const blocks = routine.awayBlocks.filter((b) => b.days.includes(d % 7));
          const trip = tripOn(trips, iso);
          return (
            <div key={iso} className="flex flex-col items-center gap-1">
              <span className="text-caption text-ink-muted">{DAY_NAMES[d % 7]}</span>
              <div
                className={`relative flex h-12 w-full items-center justify-center overflow-hidden rounded-[4px] border border-line ${
                  trip ? "bg-plan-wash text-plan" : "bg-paper"
                }`}
                title={trip ? trip.label : undefined}
              >
                {trip ? (
                  <Plane size={16} strokeWidth={1.5} aria-label={`Trip: ${trip.label}`} />
                ) : (
                  blocks.map((b, i) => (
                    <span
                      key={i}
                      className="absolute inset-x-0 bg-baseline/40"
                      style={{ top: `${(b.start / 24) * 100}%`, height: `${((b.end - b.start) / 24) * 100}%` }}
                    />
                  ))
                )}
              </div>
              <span className="text-caption font-medium text-ink">{Number(iso.slice(8))}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TripsCard({ trips, onChange }: { trips: Trip[]; onChange: (trips: Trip[]) => void }) {
  const dates = outlookDates();
  const [label, setLabel] = useState("Visit family");
  const [start, setStart] = useState(dates[4]); // Thu Oct 29
  const [end, setEnd] = useState(dates[6]); // Sat Oct 31
  const valid = label.trim() !== "" && start <= end;

  function add() {
    if (!valid) return;
    onChange([...trips, { id: `trip-${Date.now()}`, label: label.trim(), startDate: start, endDate: end }]);
  }

  return (
    <Card
      title="Trips"
      footer={<p className="text-caption text-ink-muted">Trips help AEP plan for lower load in your area. Only area totals are shared.</p>}
    >
      {trips.length === 0 ? (
        <p className="text-body text-ink-muted">No trips planned this week.</p>
      ) : (
        <ul className="divide-y divide-line">
          {trips.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 py-2">
              <span className="text-body text-ink">
                {t.label} · <span className="text-ink-muted">{dateLabel(t.startDate)} – {dateLabel(t.endDate)}</span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${t.label}`}
                onClick={() => onChange(trips.filter((x) => x.id !== t.id))}
                className="text-ink-muted transition-colors duration-fast hover:text-ink"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
        <label className="col-span-2 flex flex-col gap-1 text-caption text-ink-muted">
          Name
          <input className={controlClass} value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-caption text-ink-muted">
          From
          <input type="date" className={controlClass} min={dates[0]} max={dates[6]} value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-caption text-ink-muted">
          To
          <input type="date" className={controlClass} min={start} max={dates[6]} value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      {start > end && <p className="mt-2 text-caption text-danger">The trip has to end on or after its start date.</p>}
      <Button variant="secondary" className="mt-3" onClick={add} disabled={!valid}>
        <Plus size={14} strokeWidth={1.5} aria-hidden />
        Add trip
      </Button>
    </Card>
  );
}
