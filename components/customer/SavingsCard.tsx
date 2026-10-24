// components/customer/SavingsCard.tsx — total cost vs. "run it now" (owner: B)
import type { ScheduledTask } from "@/lib/types";
import { money } from "./hours";

export function SavingsCard({ schedule }: { schedule: ScheduledTask[] }) {
  const cost = schedule.reduce((sum, t) => sum + t.cost, 0);
  const baseline = schedule.reduce((sum, t) => sum + t.baselineCost, 0);
  const saved = baseline - cost;
  const pctSaved = baseline > 0 ? Math.round((saved / baseline) * 100) : 0;

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-green-800">
        Estimated savings <span className="normal-case">(illustrative)</span>
      </div>
      <div className="mt-1 text-3xl font-bold text-green-700">
        {money(saved)} <span className="text-base font-medium">({pctSaved}% less)</span>
      </div>
      <div className="mt-2 text-sm text-slate-600">
        Shifted plan: <span className="font-medium">{money(cost)}</span> vs. run now:{" "}
        <span className="line-through">{money(baseline)}</span>
      </div>

      <table className="mt-3 w-full text-left text-sm">
        <tbody>
          {schedule.map((t) => (
            <tr key={t.id} className="border-t border-green-100">
              <td className="py-1">{t.label}</td>
              <td className="py-1 text-right">{money(t.cost)}</td>
              <td className="py-1 text-right text-slate-400 line-through">{money(t.baselineCost)}</td>
              <td className="py-1 text-right font-medium text-green-700">−{money(t.baselineCost - t.cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        Illustrative time-of-use rate, not real AEP pricing. "Run now" means starting as soon as the appliance is ready.
      </p>
    </div>
  );
}
