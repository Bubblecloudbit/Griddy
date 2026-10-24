// components/utility/AreaPicker.tsx — "All areas ▾" → n1…n12 (DESIGN.md §6.1, owner: C)
"use client";

import { ChevronDown } from "lucide-react";
import { NEIGHBORHOODS } from "@/lib/community";
import type { Scope } from "./api";

export const AREA_OPTIONS: { id: Scope; name: string }[] = [
  { id: "region", name: "All areas" },
  ...NEIGHBORHOODS.map((n) => ({ id: n.id, name: n.name })),
];

export function areaName(scope: Scope): string {
  return AREA_OPTIONS.find((a) => a.id === scope)?.name ?? scope;
}

export function AreaPicker({ value, onChange }: { value: Scope; onChange: (scope: Scope) => void }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Area</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-control border border-line bg-surface py-1.5 pl-3 pr-8 text-body text-ink hover:border-ink"
      >
        {AREA_OPTIONS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <ChevronDown size={16} strokeWidth={1.5} className="pointer-events-none absolute right-2 text-ink-muted" aria-hidden />
    </label>
  );
}
