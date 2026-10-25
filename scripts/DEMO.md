# GridShift — demo script and shot list (owner: D)

> PLAN.md §3, timed to **2:00**. Every number below was measured on a fresh server (seed 42) on Oct 24 at `a6c7532`, re-checked after the grid-stress change (`lib/grid.ts`): only the car's start moved (11 PM → 4 AM).
> If the engine changes, re-run the flow and update the numbers. Never say a number the screen doesn't show.

## Before you start
| Step | How |
|---|---|
| Fresh state | Double-click **"Reset demo"** at the bottom of the AEP Overview (`/utility`; faint until hovered), then reload the customer tab. Do this before every take and between judges. Don't restart `npm run dev` between takes: the first load after a restart is slow on camera. |
| Warm up | Before recording, open `/`, `/utility`, `/utility/heatmaps`, `/utility/events`, `/methodology` once so no page compiles on camera. |
| Windows | Left: customer app `/` at phone width. Right: `/utility` at 1440 px. Third tab: `/methodology`. |
| Who | **Driver** clicks (B knows the customer app best). **Narrator** talks (D). C stands by for AEP-side questions. |
| Check | Points chip reads **150**. KPI strip reads **297** enrolled, **−28.3%** peak-hour load. |

## Script
Status: **ready** = works on main today. **waits on X** = rehearse the fallback until step X lands.

| Time | Screen / click | Narrator says | Status |
|---|---|---|---|
| 0:00–0:10 | Customer app, Today tab. | "GridShift tells households the cheapest time to run their big appliances, and turns their plans into a load forecast AEP can't get anywhere else." | ready |
| 0:10–0:25 | Day ribbon, **Mon** chip. Tap a 4 PM cell. | "This is Jordan's Monday. The amber block is AEP Ohio's real time-of-use peak, 2 to 6 PM on weekdays, from AEP's own page. Prices are illustrative." | ready |
| 0:25–0:35 | Week tab → **Early shift** routine. | "Jordan works an early shift: home by 3:30, car plugged in at 4. That's right inside the peak." | waits on B6 · fallback: say it over the Plan tab |
| 0:35–0:55 | Command bar: type **"Charge my car by 7 AM, run the dryer by 10 PM and the dishwasher by 11 PM"** → confirm chips. Plan tab → **Find best times**. | "Jordan just says what they need. GridShift moves the car to 4 AM, the dryer to 9, the dishwasher to 10: all after the price peak, and the car misses the grid's evening peak too. **$1.39 saved, 12.7 kWh out of peak hours**, illustrative." | coach API ready; bar waits on B8 · fallback: add EV, Dryer, Dishwasher chips on the Plan tab (plug-in 4 PM; ready by 7 AM / 10 PM / 11 PM) |
| 0:55–1:05 | Command bar: **"I'm away Thursday to Saturday"** → confirm → **Commit plan**. Toast. | "And a trip: away Thursday to Saturday. Commit, and Jordan earns GridPoints: **150 to 160**." | commit ready; trip chip waits on B6/B8 |
| 1:05–1:25 | Switch to `/utility` Overview. Point at the KPI strip, then the projected load chart callout. | "This is AEP's side. Enrolled homes just went **297 to 298**, homes away this week **61 to 62**. Across the community, planned load in the 2 to 6 PM peak is **28% lower** than baseline. That's simulated: our 480 homes are synthetic." | ready |
| 1:25–1:35 | Zone context card. | "Next to it, the real PJM forecast for the whole AEP zone, in megawatts, retrieved today. That's what AEP already forecasts. GridShift adds what customers plan to do." | ready |
| 1:35–1:45 | Heat maps → Area × hour (Change), then Day × hour. | "Where the load moved: every area's peak hours turn teal. And the week ahead: Thursday to Saturday is about **8% lower**, from planned trips like Jordan's." | waits on C7/C8 · fallback: skip; say the Thu–Sat line over the KPI strip |
| 1:45–1:55 | `/utility/events`: create **Mon 4–6 PM, 2×** → customer banner → **Join**. | "AEP can ask for more: a Flex Event, double points for staying off 4 to 6 PM. Jordan joins in one tap." | events page ready (A10); banner waits on B7 · fallback: create it and point at the live banner preview on the events page |
| 1:55–2:00 | `/methodology`. | "Everything real is labeled with its source and date. Everything simulated says so. AEP only ever sees totals of five or more homes." | ready |

## Shot list (for the recorded video)
1. Title card: "GridShift" + one-line pitch (2 s).
2. Customer app full-frame at phone width: ribbon, then Plan results (the moment the cards move out of the peak).
3. Toast + points chip ticking 150 → 160 (close-up).
4. Split screen: customer left, AEP right, KPI numbers changing within 5 s.
5. Projected load chart callout (close-up), then the zone card with its `REAL` tag and source line.
6. Heat maps (when C7/C8 land): Change view, then Day × hour Thu–Sat.
7. Methodology sources table (2 s), end card.

Record at 1440 × 900, browser zoom 100%, no bookmarks bar, no other tabs visible.

## Honesty checks (say these exactly or not at all)
- "Real": the AEP Ohio peak window, the PJM zone forecast and last week's metered load. Nothing else.
- Every $ is "illustrative." Every community number is "simulated."
- Don't say "AI" or "AI-powered." The coach is "tell GridShift what you need."
- Don't mention the transformer limit or the coordination toggle (removed in v2). If a judge asks why everyone doesn't shift to 6 PM: "the optimizer spreads starts across each area." (PLAN.md §11)
- If a judge asks why the peak is 2–6 PM when the grid peaks around 7 PM: "2–6 PM is AEP Ohio's price window, which is what customers pay. The real PJM forecast shows demand peaking around 7–8 AM and 7 PM, so GridShift also steers shifted load away from those hours. Planned load at 7 PM is below baseline." (PLAN.md §11)

## If something breaks live
| Problem | Do this |
|---|---|
| Command bar errors | Use the Plan tab chips (same tasks, same result). The coach also works with no API key. |
| AEP numbers don't move | Wait one poll (5 s). Still stuck: say "planned load in the peak is 28% lower" over the chart and move on. |
| Anything worse | Restart the dev server, or `git checkout demo-v1` and demo the core loop. |
