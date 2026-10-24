// components/utility/TrustPanel.tsx — what the utility can and cannot see (owner: C)
// Mirrors the honesty rules in PLAN.md §5.

const POINTS = [
  { title: "Opt-in only", body: "Households share plans only when they tap Commit plan." },
  { title: "Aggregates only", body: "This view shows groups of 5 or more homes. No individual households, no addresses." },
  { title: "Illustrative rates", body: "Prices follow a sample time-of-use structure, not real AEP tariffs." },
  { title: "Synthetic community", body: "Neighborhood homes and load profiles are simulated. Region demand is a public PJM/EIA snapshot." },
];

export function TrustPanel() {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <h2 className="font-semibold text-slate-800">Trust &amp; privacy</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {POINTS.map((p) => (
          <li key={p.title} className="text-sm">
            <span className="font-medium text-slate-800">{p.title}.</span>{" "}
            <span className="text-slate-600">{p.body}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
