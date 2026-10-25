import type { Config } from "tailwindcss";
import { colors, heatChange, heatLoad, radius, motion } from "./components/ui/tokens";

// Design tokens live in components/ui/tokens.ts (DESIGN.md §2). Use these class names:
//   bg-paper, bg-surface, border-line, text-ink, text-ink-muted, text-peak, bg-peak-wash,
//   text-plan, bg-plan-wash, text-baseline, text-real, bg-real-wash, text-danger,
//   bg-heat-load-1..5, bg-heat-change-1..5, font-sans (Plex Sans), font-mono (Plex Mono),
//   text-display / text-h1 / text-h2 / text-body / text-caption / text-tag,
//   rounded-card / rounded-control / rounded-tag, duration-fast / duration-chart.
const scale = (name: string, values: readonly string[]) =>
  Object.fromEntries(values.map((v, i) => [`${name}-${i + 1}`, v]));

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ...colors,
        ...scale("heat-load", heatLoad),
        ...scale("heat-change", heatChange),
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "var(--font-plex-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["34px", { lineHeight: "38px", fontWeight: "600" }],
        h1: ["30px", { lineHeight: "36px", fontWeight: "600" }],
        h2: ["17px", { lineHeight: "22px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
        tag: ["11px", { lineHeight: "14px", fontWeight: "600", letterSpacing: "0.04em" }],
      },
      borderRadius: { ...radius },
      transitionDuration: { fast: `${motion.fast}ms`, chart: `${motion.chart}ms` },
      transitionTimingFunction: { DEFAULT: "cubic-bezier(0, 0, 0.2, 1)" }, // ease-out
      boxShadow: { popover: "0 4px 16px rgba(20, 33, 61, 0.12)" }, // popovers only
    },
  },
  plugins: [],
};
export default config;
