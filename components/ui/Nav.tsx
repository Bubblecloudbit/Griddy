// components/ui/Nav.tsx — shared nav (Shared ownership; create early, avoid simultaneous edits)
import Link from "next/link";

export function Nav() {
  return (
    <nav className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-3">
      <span className="font-bold text-slate-900">GridShift</span>
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        Customer
      </Link>
      <Link href="/utility" className="text-sm text-blue-600 hover:underline">
        AEP View
      </Link>
      <span className="ml-auto rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
        Prototype — all figures illustrative / simulated
      </span>
    </nav>
  );
}
