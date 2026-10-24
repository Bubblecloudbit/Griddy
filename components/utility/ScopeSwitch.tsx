// components/utility/ScopeSwitch.tsx — pick a neighborhood or the whole region (owner: C)
"use client";

import type { Scope } from "./api";

export interface ScopeOption {
  id: Scope;
  name: string;
}

interface Props {
  options: ScopeOption[];
  value: Scope;
  onChange: (scope: Scope) => void;
}

export function ScopeSwitch({ options, value, onChange }: Props) {
  return (
    <div role="tablist" className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}
