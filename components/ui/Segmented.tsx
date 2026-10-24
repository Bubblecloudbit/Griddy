// components/ui/Segmented.tsx — 2–4 option switch, e.g. Load / Change (DESIGN.md §3, owner: C)
"use client";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-control border border-line bg-paper p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-[6px] px-3 py-1 text-caption font-medium transition-colors duration-fast ${
              active ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]" : "text-ink-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
