// components/ui/InfoTip.tsx — "?" with a short plain-language popover (DESIGN.md §3, owner: C)
"use client";

import { useState, type ReactNode } from "react";

export function InfoTip({ children, label = "What is this?" }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-ink-muted font-mono text-[10px] leading-none text-ink-muted transition-colors duration-fast hover:border-ink hover:text-ink"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute right-0 top-6 z-20 w-64 rounded-control border border-line bg-surface p-3 text-caption text-ink shadow-popover"
        >
          {children}
        </span>
      )}
    </span>
  );
}
