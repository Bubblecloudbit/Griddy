// components/customer/DayRibbon.tsx — 24-hour peak/off-peak ribbon, the Today centerpiece (owner: B)
// DESIGN.md §5.1. Peak cells = peak-wash with an amber top edge; off-peak = plan-wash.
"use client";

import { useState } from "react";
import type { Hour, RatePlan, ScheduledTask } from "@/lib/types";
import { DAY_NAMES, PLAN_DAY, hourLabel as shortHour } from "@/lib/config";
import { isPeak, priceAt } from "@/lib/rates";
import { Card, Segmented, SourceNote, Tag } from "@/components/ui";
import tou from "@/data/real/aep_tou.json";
import { durationHours } from "./client";
import { DEMO_NOW, clockLabel, windowLabel } from "./hours";

const DAYS = [0, 1, 2]; // Sun–Tue, the 72 h horizon
const AXIS = [0, 3, 6, 9, 12, 15, 18, 21];
const AXIS_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];
const GRID = { gridTemplateColumns: "repeat(24, minmax(0, 1fr))" };

// "2026-10-24" → "Oct 24, 2026"
function retrievedLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function hourDetail(rate: RatePlan, h: Hour): string {
  const tier = isPeak(rate, h) ? "Peak" : "Off-peak";
  return `${clockLabel(h)} · ${tier} · $${priceAt(rate, h).toFixed(2)}/kWh (illustrative)`;
}

// One row per planned task that runs on this day, clipped to the day: "EV charging 11p–1a".
function PlannedBlocks({ schedule, day }: { schedule: ScheduledTask[]; day: number }) {
  const rows = schedule
    .map((t) => {
      const end = t.start + durationHours(t);
      const from = Math.max(t.start, day * 24);
      const to = Math.min(end, day * 24 + 24);
      return { t, end, from, to };
    })
    .filter(({ from, to }) => to > from);
  if (rows.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {rows.map(({ t, end, from, to }) => {
        const startCol = (from % 24) + 1;
        const endCol = startCol + (to - from);
        // Afternoon/evening bars get their label on the left so it stays inside the card.
        const labelCol = startCol > 12 ? `1 / ${startCol}` : `${endCol} / 25`;
        return (
          <div key={t.id} className="grid items-center gap-px" style={GRID}>
            <span className="h-2.5 rounded-tag bg-plan" style={{ gridColumn: `${startCol} / ${endCol}`, gridRow: 1 }} />
            <span
              className={`whitespace-nowrap px-1.5 text-caption font-medium text-ink ${startCol > 12 ? "text-right" : ""}`}
              style={{ gridColumn: labelCol, gridRow: 1 }}
            >
              {t.label} {shortHour(t.start)}–{shortHour(end)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function DayRibbon({ rate, schedule = [] }: { rate: RatePlan; schedule?: ScheduledTask[] }) {
  const [day, setDay] = useState(PLAN_DAY);
  const [active, setActive] = useState<Hour | null>(null);
  const hours = Array.from({ length: 24 }, (_, c) => day * 24 + c);
  const hasPeak = hours.some((h) => isPeak(rate, h));
  const peakText = `Peak ${windowLabel(rate.peakHours)}${rate.weekdaysOnly ? " weekdays" : ""}`;

  return (
    <Card
      title="Peak and off-peak hours"
      action={
        <Segmented
          ariaLabel="Day"
          options={DAYS.map((d) => ({ value: String(d), label: DAY_NAMES[d] }))}
          value={String(day)}
          onChange={(v) => {
            setDay(Number(v));
            setActive(null);
          }}
        />
      }
      footer={
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption text-ink">{peakText} · AEP Ohio</span>
            <Tag kind="REAL" />
          </div>
          <SourceNote
            source={tou.source}
            details={[tou.summer.text]}
            retrieved={retrievedLabel(tou.retrieved)}
            href={rate.sourceUrl ?? tou.sourceUrl}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption text-ink-muted">Prices are illustrative</span>
            <Tag kind="ILLUSTRATIVE" />
          </div>
        </div>
      }
    >
      <div className="grid text-caption text-ink-muted" style={GRID}>
        {AXIS.map((c, i) => (
          <span key={c} style={{ gridColumn: `${c + 1} / span 3` }}>
            {AXIS_LABELS[i]}
          </span>
        ))}
      </div>

      <div className="mt-1 grid gap-px" style={GRID} onMouseLeave={() => setActive(null)}>
        {hours.map((h) => {
          const peak = isPeak(rate, h);
          return (
            <button
              key={h}
              type="button"
              aria-label={hourDetail(rate, h)}
              onMouseEnter={() => setActive(h)}
              onFocus={() => setActive(h)}
              onClick={() => setActive(h)}
              className={`h-11 transition-opacity duration-fast first:rounded-l-[4px] last:rounded-r-[4px] ${
                peak ? "border-t-[3px] border-peak bg-peak-wash" : "border-t-[3px] border-transparent bg-plan-wash"
              } ${active === h ? "outline outline-1 outline-ink" : ""}`}
            />
          );
        })}
      </div>

      <div className="relative h-4">
        {Math.floor(DEMO_NOW / 24) === day && (
          <span
            className="absolute text-caption font-semibold text-ink"
            style={{ left: `calc(${((DEMO_NOW % 24) + 0.5) * (100 / 24)}% - 0.3em)` }}
          >
            ▲ now
          </span>
        )}
      </div>

      <PlannedBlocks schedule={schedule} day={day} />

      <p className="mt-3 min-h-4 text-caption text-ink-muted">
        {active !== null
          ? hourDetail(rate, active)
          : hasPeak
            ? "Tap an hour to see its price."
            : "No peak hours on weekends."}
      </p>
    </Card>
  );
}
