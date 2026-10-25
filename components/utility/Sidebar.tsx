// components/utility/Sidebar.tsx — AEP dashboard left sidebar (DESIGN.md §6, owner: C)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid3x3, LayoutDashboard, ShieldCheck, Zap, type LucideIcon } from "lucide-react";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean; // Overview must not light up on /utility/heatmaps
}

const ITEMS: Item[] = [
  { href: "/utility", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/utility/heatmaps", label: "Heat maps", icon: Grid3x3 },
  { href: "/utility/events", label: "Flex events", icon: Zap }, // page built by A (BUILD.md A10)
  // Methodology lives in the top app switcher (Nav), which both apps share, so it isn't repeated here.
];

function isActive(pathname: string, item: Item): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function Sidebar() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="w-60 shrink-0 border-r border-line bg-surface">
      <div className="sticky top-14 flex h-[calc(100vh-56px)] flex-col">
      <div className="border-b border-line px-5 py-5">
        <p className="eyebrow text-brand">AEP workspace</p>
        <p className="mt-1 font-display text-[17px] font-semibold leading-tight text-ink">Residential flexibility</p>
      </div>
      <ul className="flex-1 py-3">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 border-l-[3px] px-5 py-2.5 text-body transition-colors duration-fast ${
                  active
                    ? "border-brand bg-brand-wash font-semibold text-ink"
                    : "border-transparent text-ink-muted hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon size={17} strokeWidth={1.75} className={active ? "text-brand" : ""} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="m-4 rounded-card bg-paper p-3 text-caption text-ink-muted">
        <p className="flex items-center gap-1.5 font-semibold text-ink">
          <ShieldCheck size={14} strokeWidth={1.75} className="text-brand" aria-hidden />
          Privacy
        </p>
        <p className="mt-1">Only area totals of 5+ homes. No addresses or individual households.</p>
      </div>
      </div>
    </aside>
  );
}
