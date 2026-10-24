# GridShift — Design System & Screens

> Owner of tokens and `components/ui/`: **C** (push by 4:45 PM). Everyone builds screens from these pieces. Don't invent new colors, fonts, or card styles in your own folder.

## 1. Direction: "utility-grade, calm, specific"
GridShift should look like a tool a utility would actually ship: quiet surfaces, real numbers, clear provenance. It should not look like an AI landing page.

**Do**
- Warm off-white "paper" background, white cards, one navy ink color.
- Color only where it carries meaning: **amber = peak**, **teal = off-peak / your plan**, **gray = baseline**, **slate blue = real external data**.
- Specific copy with numbers: "Charging at 11 PM avoids the 2–6 PM peak."
- Label lines directly on charts. Shade the peak band. Every chart gets a one-sentence explainer.
- Show where every number comes from (provenance tags, §4).

**Don't**
- Gradients, glows, glassmorphism, purple, emoji, sparkle icons, "✨ AI-powered."
- Chat bubbles for the coach (it's a command bar).
- Legends in boxes, 3D charts, pie charts, more than 2 lines per chart.
- Vague copy ("Optimize your energy journey," "Unlock savings").
- Huge hero sections. The first screen is the product.

## 2. Tokens (C puts these in `tailwind.config` + `app/globals.css`)

### Color
| Token | Hex | Use |
|---|---|---|
| `paper` | `#F7F6F2` | Page background |
| `surface` | `#FFFFFF` | Cards |
| `line` | `#E4E1D8` | Borders, dividers, gridlines |
| `ink` | `#14213D` | Primary text, headings, primary button |
| `ink-muted` | `#5B6474` | Secondary text, axis labels |
| `peak` | `#C2410C` | Peak hours, "avoid," increases |
| `peak-wash` | `#FCEBDD` | Peak band fill, peak badges |
| `plan` | `#0F766E` | Off-peak, recommended times, decreases, savings |
| `plan-wash` | `#E2F1EE` | Off-peak fill, success badges |
| `baseline` | `#9AA3AE` | "If nothing changed" lines (dashed) |
| `real` | `#3557A0` | External real data (PJM/EIA) lines and tags |
| `real-wash` | `#E7EDF8` | Real-data tag background |
| `danger` | `#B42318` | Errors only |

**Heat map scales** (5 steps; never rainbow)
- **Load** (sequential): `#EEF1F6` `#C9D3E6` `#8FA2C8` `#4F6699` `#14213D`
- **Change vs. baseline** (diverging, neutral center): `#0F766E` `#7FBDB5` `#F2F0EA` `#E8A983` `#C2410C` (teal = load moved away, amber = load added)
- Hidden cell (< 5 homes): `paper` with a diagonal hatch and the tooltip "Hidden for privacy (fewer than 5 homes)."

### Type
- **IBM Plex Sans** (UI) + **IBM Plex Mono** (numbers, times, units), both via `next/font/google`.
- Numbers always `font-variant-numeric: tabular-nums`.

| Style | Size / line height / weight |
|---|---|
| Display (big KPI number) | 32 / 36 / 600, Plex Mono |
| H1 page title | 22 / 28 / 600 |
| H2 card title | 15 / 20 / 600 |
| Body | 14 / 20 / 400 |
| Caption, explainer, source | 12 / 16 / 400, `ink-muted` |
| Tag | 11 / 14 / 600, uppercase, letter-spacing 0.04em |

### Shape and space
- Spacing on a 4 px grid: 4, 8, 12, 16, 24, 32.
- Radius: cards 10 px, buttons and inputs 8 px, tags 4 px.
- Cards: white, 1 px `line` border, **no shadow** (one soft shadow allowed on popovers only).
- Motion: 150 ms ease-out for hovers and expanding; 300 ms for chart updates. No bounce.
- Icons: `lucide-react` at 16 px, 1.5 stroke (A installs it; it's the only extra package).

## 3. Shared components (`components/ui/`, owner C)
| Component | What it is |
|---|---|
| `Card` | Title, optional explainer line under the title, body, optional footer (`SourceNote`). |
| `Stat` | Label (caption), big number (Display), delta line ("−18% vs. baseline" in `plan` or `peak`), provenance tag. |
| `Tag` | Provenance and status pills: `REAL`, `SIMULATED`, `ILLUSTRATIVE`, `PEAK`, `OFF-PEAK`, `PROJECTED`. |
| `SourceNote` | "Source: PJM Data Miner 2 · Hourly load forecast · AEP zone · retrieved Oct 24, 2026" with a link icon. |
| `InfoTip` | "?" icon with a popover: one or two plain sentences explaining the chart or number. |
| `ChartFrame` | `Card` + standard chart padding, axis style, custom tooltip, and an empty/loading state. |
| `Segmented` | Two to four-option switch (e.g., Load / Change; Tomorrow / 7 days). |
| `Button` | Primary (ink fill), secondary (outline), quiet (text). |
| `Toast` | Bottom-center confirmation: "Plan committed · +10 GridPoints." |
| `EmptyState` | Small line icon, one sentence, one action. |

### Chart rules (Recharts)
- Horizontal gridlines only, `line` color. No vertical gridlines, no chart border.
- X axis ticks every 3 hours: `12a 3a 6a 9a 12p 3p 6p 9p`. Mark day changes with a thin divider labeled "Mon."
- Peak band = `ReferenceArea` filled `peak-wash`, labeled "Peak 2–6 PM" at the top.
- Baseline = dashed `baseline` line. Plan = solid `plan` line or area at 15% opacity. Real data = solid `real` line.
- Label lines at their right end ("Planned," "Baseline") instead of a legend.
- Units go in the card title or explainer ("kW, 12 areas combined"), not on the axis.
- Tooltip: white, `line` border, Plex Mono numbers, the time as the title ("Mon 4 PM").

## 4. Provenance tags (our signature detail)
Every number and chart carries one tag. That's how "honest" shows visually instead of in fine print.
- `REAL` (slate blue on `real-wash`): PJM, EIA, AEP rate windows.
- `SIMULATED` (ink-muted on paper): anything from our synthetic community.
- `ILLUSTRATIVE` (amber outline): ¢/kWh rates and $ savings.
- `PROJECTED` (ink-muted outline): days 2–6 of the 7-day outlook.

---

## 5. Customer app (`/`, owner B)
A **phone-width app** (max-width 420 px, centered on desktop, on `paper` with a subtle 1 px frame). Bottom tab bar: **Today · Plan · Week · Rewards**. The contrast with the wide AEP dashboard makes the two sides obvious in the demo.

### 5.1 Today
```
┌──────────────────────────────────────┐
│ GridShift                 ● 160 pts  │
│ Plan for Monday, Oct 26              │
│                                      │
│ ┌ Command bar ──────────────────────┐│
│ │ Tell GridShift what you need…     ││  ← coach (Phase 2)
│ └───────────────────────────────────┘│
│                                      │
│ Best time to run things              │
│ After 6 PM and overnight     OFF-PEAK│
│                                      │
│ ┌ Day ribbon ───────────────────────┐│
│ │12a   3a   6a   9a  12p  3p  6p  9p││
│ │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██████▒▒▒▒▒▒││  teal = off-peak, amber block = 2–6 PM
│ │                    ▲now           ││
│ │ ███ EV 11p–4a   ██ Dryer 7p       ││  ← planned blocks sit under the ribbon
│ └───────────────────────────────────┘│
│ Peak 2–6 PM weekdays · AEP Ohio  REAL│
│ Prices are illustrative  ILLUSTRATIVE│
│                                      │
│ ┌ This week ────────┐┌──────────────┐│
│ │ $4.80 saved      ││ 18 kWh moved  ││
│ │ ILLUSTRATIVE     ││ out of peak   ││
│ └──────────────────┘└───────────────┘│
│                                      │
│ ┌ Flex Event (Phase 2) ─────────────┐│
│ │ Mon 4–6 PM · 2× points            ││
│ │ Help AEP by shifting load.  [Join]││
│ └───────────────────────────────────┘│
│  Today    Plan    Week    Rewards    │
└──────────────────────────────────────┘
```
- The ribbon is **the** visual. Built as a CSS grid of 24 cells (one per hour) for the selected day; peak cells `peak-wash` with an amber top border, off-peak cells `plan-wash`. Hover/tap a cell → "4 PM · Peak · $0.22/kWh (illustrative)."
- Optional overlay (Phase 3): a thin `real`-colored line for the PJM AEP-zone price shape, labeled "Grid price today (PJM) REAL."
- Day switch above the ribbon: `Sun · Mon · Tue …` chips. Sunday shows "No peak hours on weekends."

### 5.2 Plan
```
┌──────────────────────────────────────┐
│ Plan                                 │
│ Add what you'll run. We'll find the  │
│ cheapest time that still fits.       │
│                                      │
│ [+ EV] [+ Dryer] [+ Dishwasher]      │
│ [+ Water heater] [+ Other]           │
│                                      │
│ ┌ EV charging ───────────────── × ┐  │
│ │ 10 kWh · 7.2 kW                 │  │
│ │ Plugged in  [4 PM ▾] Ready by [7 AM ▾]
│ │ ─────────────────────────────── │  │
│ │ Start 11 PM  → done 1 AM   OFF-PEAK │
│ │ Saves $1.10 vs. charging at 4 PM    │
│ │ ⓘ Off-peak after 6 PM; spread from  │
│ │   other EVs in your area           │
│ └─────────────────────────────────┘  │
│ ┌ Dryer ───────────────────────── × ┐│
│ │ …                                  ││
│ └────────────────────────────────────┘│
│                                      │
│ Total  $1.40 saved · 6.5 kWh out of  │
│ peak                     ILLUSTRATIVE│
│ [ Find best times ]  [ Commit plan ] │
└──────────────────────────────────────┘
```
- Appliance cards prefill from engine defaults and the routine's plug-in hour.
- After "Find best times," results animate in (150 ms) and the blocks appear on the Today ribbon.
- **Commit** → Toast "Plan committed · +10 GridPoints" → points chip in the header ticks up.
- Errors from the API show inline in the card in `danger`, using the API's message as-is.

### 5.3 Week (Phase 2): routine + trips
```
┌──────────────────────────────────────┐
│ Your week                            │
│ Routine  [Early shift] [Commuter] [Home] [Night] [Custom]
│ Away weekdays 6 AM – 3 PM            │
│ Car plugged in at 4 PM               │
│                                      │
│ ┌ Mini week strip ──────────────────┐│
│ │Sun Mon Tue Wed Thu Fri Sat        ││
│ │ ░   █   █   █   ✈   ✈   ✈        ││  ✈ = trip days; █ = away block
│ └───────────────────────────────────┘│
│                                      │
│ Trips                                │
│ ┌ Visit family · Thu Oct 29 – Sat 31 ┐│
│ └────────────────────────────────────┘│
│ [+ Add trip]   (start date, end date) │
│ Trips help AEP plan for lower load in │
│ your area. Only area totals are shared.│
└──────────────────────────────────────┘
```

### 5.4 Rewards (Phase 2)
Points total (Display), a short history list ("Committed plan +10," "Joined Flex Event Mon 4–6 PM +20"), and one line explaining how points work. Keep it simple; no fake catalog of prizes.

---

## 6. AEP dashboard (`/utility`, owner C)
A wide dashboard (max 1280 px). **Left sidebar:** GridShift for AEP · Overview · Heat maps · Flex events · Methodology. A thin top bar: "Residential flexibility · Demo community (simulated) · Plan date Mon Oct 26."

### 6.1 Overview
```
┌─────────────────────────────────────────────────────────────────────┐
│ Overview                                                            │
│ ┌Enrolled homes┐┌Flexible load┐┌Peak-hour load┐┌Homes away this wk┐ │
│ │ 480          ││ 1.9 MWh     ││ −18%         ││ 57                │ │
│ │ SIMULATED    ││ committed   ││ vs. baseline ││ from trips        │ │
│ └──────────────┘└─────────────┘└──────────────┘└───────────────────┘ │
│                                                                     │
│ ┌ Projected residential load · tomorrow ─────────────────── ⓘ ┐     │
│ │ kW, all 12 areas combined. Baseline = everyone runs things   │     │
│ │ when they get home. Planned = committed GridShift plans.     │     │
│ │                     ┌──Peak 2–6 PM──┐                        │     │
│ │        Baseline ╌╌╌╌│╌╌╌╌╌╌╌╱╲╌╌╌╌╌│╌╌╌                     │     │
│ │        Planned  ────│──────────────│──────                   │     │
│ │ 12a  3a  6a  9a  12p│  3p          │6p  9p                   │     │
│ │ ▸ Peak-hour load −18%  (412 kWh moved)            SIMULATED  │     │
│ └──────────────────────────────────────────────────────────────┘     │
│ ┌ AEP zone context · PJM ──────────────┐┌ Next Flex Event ────────┐  │
│ │ MW, whole AEP zone. 7-day forecast   ││ Mon 4–6 PM · 2× points  │  │
│ │ ───────────────────────────── REAL   ││ 38 homes opted in       │  │
│ │ Source: PJM Data Miner 2 …           ││ [Create event]          │  │
│ └──────────────────────────────────────┘└─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```
- **Area picker** above the main chart: `All areas ▾` → n1…n12. Areas under 5 homes show "Hidden for privacy."
- **The callout under the chart is the proof:** peak-hour kWh baseline vs. planned, as % and kWh. It updates live after Jordan commits (poll every 5 s).
- **Zone context chart** is separate, in MW, slate blue, with `REAL` and `SourceNote`. Explainer: "What AEP already forecasts for the whole zone. GridShift adds what customers *plan* to do."

### 6.2 Heat maps
```
┌─────────────────────────────────────────────────────────────────────┐
│ Heat maps            [Area × hour | Day × hour]   [Load | Change]   │
│ Where and when residential load is planned. Each cell = 5+ homes.   │
│                                                                     │
│          12a 1a 2a 3a … 2p 3p 4p 5p 6p 7p … 11p                     │
│ Oak Hill  ░  ░  ░  ▒  … ▓  ▓  ▓  ▓  ▒  ▒  …  ▒                     │
│ Riverside ░  ░  ▒  ▒  … ▓  █  █  ▓  ▒  ░  …  ░                     │
│ …12 rows                                                            │
│                                                                     │
│ Legend: [■■■■■] 0 ─ 180 kW            SIMULATED                     │
│ ▸ Biggest shift: Riverside, 4–6 PM, −31% vs. baseline               │
└─────────────────────────────────────────────────────────────────────┘
```
- Built with CSS grid (rows = areas or days, 24 columns). Cell hover → "Riverside · Mon 5 PM · 142 kW planned · −28% vs. baseline."
- A thin amber outline marks the peak columns (2–6 PM; weekdays only in Day × hour).
- **Change** metric uses the diverging scale (teal = load moved away). This is the most persuasive view; default to it.
- **Day × hour** (Phase 2): rows Sun Oct 25 … Sat Oct 31; days 2–6 tagged `PROJECTED`; trip days visibly cooler. Auto-generated takeaway line: "Thu–Sat: −9% residential load (planned trips)."

### 6.3 Flex events (Phase 2)
Form on the left (day, start, end, multiplier chips 1.5× / 2× / 3×, message, with a live preview of the customer banner). List on the right: each event with opted-in homes and estimated kWh shifted (simulated).

## 7. Methodology (`/methodology`, owner D)
One readable page (max 720 px) linked from both apps:
1. **How it works:** a simple 3-step diagram (Customer plans → GridShift schedules off-peak and spreads load → AEP sees aggregated projections).
2. **Data sources table:** name, what we use it for, date retrieved, link, `REAL`/`SIMULATED` tag (from DATA.md).
3. **Assumptions:** appliance kWh/kW, illustrative rates, community size, trip and routine effects.
4. **Privacy:** opt-in, aggregates of 5+ homes, no addresses, nothing individual reaches AEP.
5. **Limitations and next steps.**

## 8. Copy guide
- Sentence case everywhere. Times as "6 PM," "11 PM–4 AM," days as "Mon Oct 26."
- Money: `$4.80`. Energy: `18 kWh`, `1.9 MWh`. Percent: `−18%` (true minus sign).
- Buttons are verbs: "Find best times," "Commit plan," "Create event," "Join."
- Every chart explainer answers "what am I looking at?" in one sentence.
- Never say "AI-powered." The coach is just "Tell GridShift what you need."
