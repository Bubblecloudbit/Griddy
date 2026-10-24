// components/ui/Nav.tsx — app switcher shown on every page (DESIGN.md §6, owner: C)
// "Customer app · AEP dashboard · Methodology". Kept as `Nav` so existing imports keep working.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const APPS = [
  { href: "/", label: "Customer app" },
  { href: "/utility", label: "AEP dashboard" },
  { href: "/methodology", label: "Methodology" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? !APPS.some((a) => a.href !== "/" && pathname.startsWith(a.href)) : pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="Switch app" className="flex h-10 items-center gap-6 border-b border-line bg-surface px-4">
      <span className="text-h2 text-ink">GridShift</span>
      <div className="flex items-center gap-1">
        {APPS.map((app) => {
          const active = isActive(pathname, app.href);
          return (
            <Link
              key={app.href}
              href={app.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-control px-2 py-1 text-caption font-medium transition-colors duration-fast ${
                active ? "bg-paper text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {app.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
