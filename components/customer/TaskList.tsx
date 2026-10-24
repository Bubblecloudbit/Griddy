// components/customer/TaskList.tsx — tasks waiting to be scheduled (owner: B)
import type { FlexTask } from "@/lib/types";
import { hourLabel } from "./hours";

export function TaskList({ tasks, onRemove }: { tasks: FlexTask[]; onRemove: (id: string) => void }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-slate-500">No tasks yet. Add an appliance above.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 px-4 py-2 text-sm">
          <div className="min-w-0 flex-1">
            <span className="font-medium text-slate-900">{t.label}</span>
            <span className="ml-2 text-slate-500">
              {t.kWh} kWh at {t.powerKW} kW
            </span>
            <div className="text-xs text-slate-500">
              {hourLabel(t.earliestStart)} → done by {hourLabel(t.deadline)}
            </div>
          </div>
          <button
            onClick={() => onRemove(t.id)}
            className="text-xs text-slate-400 hover:text-red-600"
            aria-label={`Remove ${t.label}`}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
