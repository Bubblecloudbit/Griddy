// components/customer/TaskForm.tsx — add a flexible appliance task (owner: B)
"use client";

import { useState } from "react";
import type { FlexTask } from "@/lib/types";
import { HORIZON_HOURS, hourOptions } from "./hours";

// Typical appliance numbers from design.md §3 (illustrative).
const PRESETS = [
  { label: "EV Charging", kWh: 10, powerKW: 7.2 },
  { label: "Dryer", kWh: 1.5, powerKW: 3 },
  { label: "Dishwasher", kWh: 1.2, powerKW: 1.5 },
  { label: "Water Heater", kWh: 2, powerKW: 4.5 },
];

const inputClass = "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm";

export function TaskForm({ onAdd }: { onAdd: (task: FlexTask) => void }) {
  const [label, setLabel] = useState(PRESETS[0].label);
  const [kWh, setKWh] = useState(PRESETS[0].kWh);
  const [powerKW, setPowerKW] = useState(PRESETS[0].powerKW);
  const [earliestStart, setEarliestStart] = useState(40);
  const [deadline, setDeadline] = useState(55);

  function applyPreset(name: string) {
    const preset = PRESETS.find((p) => p.label === name);
    if (!preset) return;
    setLabel(preset.label);
    setKWh(preset.kWh);
    setPowerKW(preset.powerKW);
  }

  const invalid = !label.trim() || kWh <= 0 || powerKW <= 0 || deadline <= earliestStart;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    onAdd({ id: `t-${Date.now()}`, label: label.trim(), kWh, powerKW, earliestStart, deadline });
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-slate-900">Add an appliance</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.label)}
            className={`rounded-full border px-3 py-1 text-xs ${
              label === p.label
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="col-span-2 text-xs text-slate-500 sm:col-span-1">
          Name
          <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="text-xs text-slate-500">
          Energy (kWh)
          <input
            type="number" step="0.1" min="0.1" className={inputClass}
            value={kWh} onChange={(e) => setKWh(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-slate-500">
          Power (kW)
          <input
            type="number" step="0.1" min="0.1" className={inputClass}
            value={powerKW} onChange={(e) => setPowerKW(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-slate-500">
          Ready from
          <select
            className={inputClass} value={earliestStart}
            onChange={(e) => setEarliestStart(Number(e.target.value))}
          >
            {hourOptions(0, HORIZON_HOURS - 1).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Done by
          <select
            className={inputClass} value={deadline}
            onChange={(e) => setDeadline(Number(e.target.value))}
          >
            {hourOptions(1, HORIZON_HOURS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {deadline <= earliestStart && (
        <p className="mt-2 text-xs text-red-600">"Done by" must be after "Ready from".</p>
      )}

      <button
        type="submit" disabled={invalid}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
      >
        Add task
      </button>
    </form>
  );
}
