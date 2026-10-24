// components/ui/format.ts — number formats from DESIGN.md §8 (owner: C)
// "1,900 kWh", "$4.80", "−18%" (true minus sign).

const MINUS = "−";

export function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function formatKWh(n: number): string {
  return `${formatInt(n)} kWh`;
}

export function formatUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

// Signed percent: −18%, +4%, 0%.
export function formatPct(n: number): string {
  const r = Math.round(n);
  if (r === 0) return "0%";
  return `${r < 0 ? MINUS : "+"}${Math.abs(r)}%`;
}
