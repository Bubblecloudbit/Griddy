// components/utility/Sidebar.tsx — AEP dashboard left sidebar (DESIGN.md §6, owner: C)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Grid3x3, LayoutDashboard, Zap, type LucideIcon } from "lucide-react";

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
  { href: "/methodology", label: "Methodology", icon: BookOpen }, // page built by D
];

function isActive(pathname: string, item: Item): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function Sidebar() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="w-56 shrink-0 border-r border-line bg-surface px-3 py-4">
      <div className="px-2 pb-4">
        <div className="text-h2 text-ink">GridShift for AEP</div>
        <div className="text-caption text-ink-muted">Residential flexibility</div>
      </div>
      <ul className="space-y-0.5">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-control px-2 py-1.5 text-body transition-colors duration-fast ${
                  active ? "bg-paper font-medium text-ink" : "text-ink-muted hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon size={16} strokeWidth={1.5} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
