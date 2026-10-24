// app/(customer)/page.tsx — placeholder customer planner (owner: B)
// Renders MOCK_TASKS so B can start building the real planner UI against mock data.
"use client";

import { Nav } from "@/components/ui/Nav";
import { MOCK_TASKS } from "@/lib/mock";

function fmtHour(h: number): string {
  const hour = h % 24;
  const ampm = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${ampm}`;
}

export default function CustomerPage() {
  async function commitPlan() {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ householdId: "h-jordan", tasks: [], flags: [] }),
    });
    const data = await res.json();
    // eslint-disable-next-line no-console
    console.log("Committed. Points:", data.points);
    alert(`Plan committed (stub). GridPoints: ${data.points}`);
  }

  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">
          GridShift — Your Energy Planner
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Recommended start times for your flexible appliances. All costs are{" "}
          <span className="font-medium text-amber-700">illustrative</span>.
        </p>

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">Appliance</th>
                <th className="px-4 py-2">Recommended start</th>
                <th className="px-4 py-2">Cost (illustrative)</th>
                <th className="px-4 py-2">Run-now cost (illustrative)</th>
                <th className="px-4 py-2">You save</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TASKS.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{t.label}</td>
                  <td className="px-4 py-2">{fmtHour(t.start)}</td>
                  <td className="px-4 py-2">${t.cost.toFixed(2)}</td>
                  <td className="px-4 py-2 text-slate-400 line-through">
                    ${t.baselineCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 font-semibold text-green-600">
                    ${(t.baselineCost - t.cost).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={commitPlan}
          className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Commit Plan
        </button>

        <p className="mt-6 text-xs text-slate-400">
          Placeholder page (owner B). Task entry, savings card, flags, points, and
          the coach chat UI build on top of this.
        </p>
      </div>
    </main>
  );
}
