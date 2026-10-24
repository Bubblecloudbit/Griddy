// components/ui/tokens.ts — GridShift design tokens (owner: C). Source: DESIGN.md §2.
// One source of truth: tailwind.config.ts imports these, and Recharts code (which needs
// raw hex values, not class names) imports them too. Don't add colors anywhere else.

export const colors = {
  paper: "#F7F6F2", // page background
  surface: "#FFFFFF", // cards
  line: "#E4E1D8", // borders, dividers, gridlines
  ink: "#14213D", // primary text, headings, primary button
  "ink-muted": "#5B6474", // secondary text, axis labels
  peak: "#C2410C", // peak hours, "avoid", increases
  "peak-wash": "#FCEBDD", // peak band fill, peak badges
  plan: "#0F766E", // off-peak, recommended times, decreases, savings
  "plan-wash": "#E2F1EE", // off-peak fill, success badges
  baseline: "#9AA3AE", // "if nothing changed" lines (dashed)
  real: "#3557A0", // external real data (PJM/EIA)
  "real-wash": "#E7EDF8", // real-data tag background
  danger: "#B42318", // errors only
} as const;

// Heat map scales, 5 steps each, low → high. Never rainbow.
export const heatLoad = ["#EEF1F6", "#C9D3E6", "#8FA2C8", "#4F6699", "#14213D"] as const;
// Diverging, neutral center: teal = load moved away, amber = load added.
export const heatChange = ["#0F766E", "#7FBDB5", "#F2F0EA", "#E8A983", "#C2410C"] as const;

export const radius = { card: "10px", control: "8px", tag: "4px" } as const;

export const motion = { fast: 150, chart: 300 } as const; // ms, ease-out, no bounce

// Font CSS variables set by next/font in app/layout.tsx.
export const fontVars = {
  sans: "var(--font-plex-sans)",
  mono: "var(--font-plex-mono)",
} as const;
