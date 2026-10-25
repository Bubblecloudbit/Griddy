// components/ui/tokens.ts — Griddy design tokens (owner: C). Source: DESIGN.md §2.
// One source of truth: tailwind.config.ts imports these, and Recharts code (which needs
// raw hex values, not class names) imports them too. Don't add colors anywhere else.
//
// Direction: utility-grade, like AEP's own site. White surfaces on a cool light gray,
// charcoal ink, one strong brand green for actions and navigation, pastel tinted panels.

export const colors = {
  paper: "#F3F4F2", // page background (cool light gray)
  surface: "#FFFFFF", // cards
  line: "#D9DDDB", // borders, dividers, gridlines
  ink: "#1F2A30", // primary text, headings
  "ink-muted": "#5D6970", // secondary text, axis labels
  brand: "#0B7A3E", // primary actions, active nav, brand mark
  "brand-dark": "#075C2E", // hover/pressed on brand
  "brand-wash": "#E6F1E3", // tinted panels, active nav background
  "brand-spark": "#B8F05A", // logo only: the "shifted" cell in the Griddy mark
  peak: "#C2410C", // peak hours, "avoid", increases
  "peak-wash": "#FCEBDD", // peak band fill, peak badges
  plan: "#0B7A3E", // off-peak, recommended times, decreases, savings (same green as brand)
  "plan-wash": "#E6F1E3", // off-peak fill, success badges
  baseline: "#98A2A8", // "if nothing changed" lines (dashed)
  real: "#2D5F8B", // external real data (PJM/EIA)
  "real-wash": "#DCE7F0", // real-data tag background, info panels
  danger: "#B42318", // errors only
} as const;

// Heat map scales, 5 steps each, low → high. Never rainbow.
export const heatLoad = ["#EDF2F6", "#C3D4E3", "#86A6C3", "#3F6F99", "#1F2A30"] as const;
// Diverging, neutral center: green = load moved away, amber = load added.
export const heatChange = ["#0B7A3E", "#86C29B", "#F1F2EF", "#E8A983", "#C2410C"] as const;

export const radius = { card: "6px", control: "6px", tag: "999px" } as const;

export const motion = { fast: 150, chart: 300 } as const; // ms, ease-out, no bounce

// Font CSS variables set by next/font in app/layout.tsx.
export const fontVars = {
  sans: "var(--font-plex-sans)",
  mono: "var(--font-plex-mono)",
  display: "var(--font-display)",
} as const;
