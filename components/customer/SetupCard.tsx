// components/customer/SetupCard.tsx — "Your setup": rate + how usage is measured (owner: B, PLAN.md §7a)
// "Not sure" counts as the standard rate / not measurable. Saved with the next plan commit.
"use client";

import type { CustomerSetup, RateType, Verification } from "@/lib/types";
import { Button, Card, InfoTip } from "@/components/ui";

type RateChoice = RateType | "unsure";
type MeasureChoice = Verification | "unsure";

const RATES: { value: RateChoice; label: string }[] = [
  { value: "flat", label: "Standard (same price all day)" },
  { value: "tou", label: "Time-of-use" },
  { value: "unsure", label: "Not sure" },
];

const MEASURES: { value: MeasureChoice; label: string }[] = [
  { value: "smart_meter", label: "Smart meter" },
  { value: "device", label: "Smart charger or thermostat" },
  { value: "none", label: "Neither" },
  { value: "unsure", label: "Not sure" },
];

export interface SetupChoice {
  rate: RateChoice;
  measure: MeasureChoice;
}

// What the engine gets: "Not sure" → flat / none.
export function toSetup(c: SetupChoice): CustomerSetup {
  return {
    rate: c.rate === "tou" ? "tou" : "flat",
    verification: c.measure === "unsure" ? "none" : c.measure,
  };
}

function Choices<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Button
          key={o.value}
          variant={value === o.value ? "primary" : "secondary"}
          className="px-2.5 py-1 text-caption"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

interface Props {
  choice: Partial<SetupChoice>;
  onChange: (c: Partial<SetupChoice>) => void;
  onDismiss?: () => void; // Today's one-time prompt can be closed
}

export function SetupCard({ choice, onChange, onDismiss }: Props) {
  return (
    <Card
      title="Your setup"
      explainer="Tells Griddy what you can earn. Saved with your next plan commit."
      action={onDismiss && <Button variant="quiet" className="px-2 py-1 text-caption" onClick={onDismiss}>Later</Button>}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-caption text-ink-muted">Your rate</p>
          <Choices options={RATES} value={choice.rate ?? null} onChange={(rate) => onChange({ ...choice, rate })} />
        </div>
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-caption text-ink-muted">
            How can your usage be measured?
            <InfoTip label="How to check">
              Your AEP bill says if you have a smart meter (AMI), or check for a digital display on the meter.
              &ldquo;Not sure&rdquo; counts as neither.
            </InfoTip>
          </p>
          <Choices options={MEASURES} value={choice.measure ?? null} onChange={(measure) => onChange({ ...choice, measure })} />
        </div>
      </div>
    </Card>
  );
}
