// components/ui/Nav.tsx — shared top nav (owner: C). C3 replaces this with the app switcher.
import Link from "next/link";
import { Tag } from "./Tag";

export function Nav() {
  return (
    <nav className="flex items-center gap-4 border-b border-line bg-surface px-6 py-3">
      <span className="text-h2 text-ink">GridShift</span>
      <Link href="/" className="text-body text-ink-muted hover:text-ink">
        Customer app
      </Link>
      <Link href="/utility" className="text-body text-ink-muted hover:text-ink">
        AEP dashboard
      </Link>
      <span className="ml-auto">
        <Tag kind="SIMULATED" />
      </span>
    </nav>
  );
}
