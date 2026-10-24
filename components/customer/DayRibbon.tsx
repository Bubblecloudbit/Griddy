// components/customer/DayRibbon.tsx — 24-hour peak/off-peak ribbon, the Today centerpiece (owner: B)
// DESIGN.md §5.1. Peak cells = peak-wash with an amber top edge; off-peak = plan-wash.
"use client";

import { useState } from "react";
import type { Hour, RatePlan } from "@/lib/types";
import { DAY_NAMES, PLAN_DAY } from "@/lib/config";
import { isPeak, priceAt } from "@/lib/rates";
import { Card, Segmented, SourceNote, Tag } from "@/components/ui";
import tou from "@/data/real/aep_tou.json";
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

export function DayRibbon({ rate }: { rate: RatePlan }) {
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
      <div className="grid font-mono text-caption text-ink-muted" style={GRID}>
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
              className={`h-10 transition-opacity duration-fast ${
                peak ? "border-t-2 border-peak bg-peak-wash" : "border-t-2 border-transparent bg-plan-wash"
              } ${active === h ? "outline outline-1 outline-ink" : ""}`}
            />
          );
        })}
      </div>

      <div className="relative h-4">
        {Math.floor(DEMO_NOW / 24) === day && (
          <span
            className="absolute font-mono text-caption text-ink"
            style={{ left: `calc(${((DEMO_NOW % 24) + 0.5) * (100 / 24)}% - 0.3em)` }}
          >
            ▲ now
          </span>
        )}
      </div>

      <p className="mt-1 min-h-4 font-mono text-caption text-ink">
        {active !== null
          ? hourDetail(rate, active)
          : hasPeak
            ? "Tap an hour to see its price."
            : "No peak hours on weekends."}
      </p>
    </Card>
  );
}
