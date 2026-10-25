// components/ui/Nav.tsx — app switcher shown on every page (DESIGN.md §6, owner: C)
// "Customer app · AEP dashboard · Methodology". Kept as `Nav` so existing imports keep working.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./BrandMark";

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
    <nav aria-label="Switch app" className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="flex h-14 items-stretch gap-8 px-6">
        <Link href="/" className="flex items-center" aria-label="Griddy home">
          <BrandMark size="sm" />
        </Link>
        <div className="flex items-stretch gap-6">
          {APPS.map((app) => {
            const active = isActive(pathname, app.href);
            return (
              <Link
                key={app.href}
                href={app.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center border-b-[3px] pt-[3px] text-body font-semibold transition-colors duration-fast ${
                  active ? "border-brand text-ink" : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {app.label}
              </Link>
            );
          })}
        </div>
        <span className="ml-auto hidden items-center text-caption text-ink-muted md:flex">
          HackOHI/O 2026 prototype · demo data
        </span>
      </div>
    </nav>
  );
}
