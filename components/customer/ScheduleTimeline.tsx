// components/customer/ScheduleTimeline.tsx — 72-hour view of recommended run times (owner: B)
import type { ScheduledTask } from "@/lib/types";
import { MOCK_RATE } from "@/lib/mock";
import { DAY_NAMES } from "@/lib/config";
import { HORIZON_HOURS, clockLabel, hourLabel, isPeakHour } from "./hours";
import { durationHours } from "./client";

const HOURS = HORIZON_HOURS;
const pct = (h: number) => `${(h / HOURS) * 100}%`;

function PeakShading() {
  return (
    <>
      {Array.from({ length: HOURS }, (_, h) =>
        isPeakHour(MOCK_RATE, h) ? (
          <div key={h} className="absolute inset-y-0 bg-red-100" style={{ left: pct(h), width: pct(1) }} />
        ) : null,
      )}
    </>
  );
}

export function ScheduleTimeline({ schedule }: { schedule: ScheduledTask[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-slate-900">Recommended schedule</h2>
        <div className="flex gap-3 text-xs text-slate-500">
          <span><span className="mr-1 inline-block h-2.5 w-2.5 bg-red-100" />Peak price (illustrative)</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 bg-slate-400/25" />Allowed window</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 bg-blue-600" />Runs</span>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="relative ml-28 h-5 text-[10px] text-slate-400">
            {[0, 12, 24, 36, 48, 60].map((h) => (
              <span key={h} className="absolute -translate-x-1/2" style={{ left: pct(h) }}>
                {h % 24 === 0 ? DAY_NAMES[h / 24] : clockLabel(h)}
              </span>
            ))}
          </div>

          {schedule.map((t) => (
            <div key={t.id} className="flex items-center py-1">
              <div className="w-28 truncate pr-2 text-sm text-slate-700">{t.label}</div>
              <div className="relative h-7 flex-1 overflow-hidden rounded bg-slate-50">
                <PeakShading />
                <div
                  className="absolute inset-y-1 rounded bg-slate-400/25"
                  style={{ left: pct(t.earliestStart), width: pct(t.deadline - t.earliestStart) }}
                />
                <div
                  className="absolute inset-y-1 rounded bg-blue-600"
                  style={{ left: pct(t.start), width: pct(durationHours(t)) }}
                  title={`${t.label}: starts ${hourLabel(t.start)}`}
                />
                {[24, 48].map((h) => (
                  <div key={h} className="absolute inset-y-0 border-l border-slate-300" style={{ left: pct(h) }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-slate-600">
        {schedule.map((t) => (
          <li key={t.id}>
            <span className="font-medium text-slate-900">{t.label}</span>: start {hourLabel(t.start)},
            runs {durationHours(t)} h
          </li>
        ))}
      </ul>
    </div>
  );
}
