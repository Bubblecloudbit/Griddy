// components/utility/events/BannerPreview.tsx — what customers will see (owner: A, BUILD.md A10)
// Mirrors the Flex Event banner in DESIGN.md §5.1 so AEP staff see the exact wording first.
import { Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { rangeLabel } from "../hours";

interface Props {
  startHour: number;
  endHour: number;
  multiplier: number;
  message: string;
}

export function BannerPreview({ startHour, endHour, multiplier, message }: Props) {
  return (
    <div className="mx-auto w-full max-w-[380px] rounded-card border border-line bg-surface p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-peak">
          <Zap size={16} strokeWidth={1.5} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-h2 text-ink">
            {rangeLabel(startHour, endHour)} · {multiplier}× points
          </div>
          <p className="mt-1 text-caption text-ink-muted">{message || "Your message appears here."}</p>
        </div>
        <Button variant="secondary" disabled tabIndex={-1}>
          Join
        </Button>
      </div>
    </div>
  );
}
