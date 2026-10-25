# GridShift — demo script v3 and shot list (owner: D)

> Phase 4 story (verification, rewards, data feed), timed to **2:00**. Every number below was measured on a fresh server (seed 42) after Phase 4 landed (`f7761fe`).
> If the engine changes, re-run the flow and update the numbers. Never say a number the screen doesn't show.

## Before you start
| Step | How |
|---|---|
| Fresh state | Double-click **"Reset demo"** at the bottom of the AEP Overview (`/utility`; faint until hovered), then reload the customer tab. Do this before every take and between judges. Don't restart `npm run dev` between takes: the first load after a restart is slow on camera. |
| Warm up | Before recording, open `/`, `/utility`, `/utility/verification`, `/utility/data-feed`, `/utility/events`, `/methodology` once so no page compiles on camera. |
| Windows | Left: customer app `/` at phone width. Right: `/utility` at 1440 px. Third tab: `/methodology`. |
| Who | **Driver** clicks (B knows the customer app best). **Narrator** talks (D). C stands by for AEP-side questions. |
| Check | Points chip **150**. Today shows the **Your setup** card. KPI strip: **297** enrolled, **111** verified (**37%**), peak-hour load (expected) **−16%**. |

## Script
| Time | Screen / click | Narrator says |
|---|---|---|
| 0:00–0:10 | Customer app, Today tab. | "GridShift tells households the cheapest time to run their big appliances, and turns their plans into a load forecast AEP can't get anywhere else. And AEP only pays for what it can measure." |
| 0:10–0:20 | **Your setup** card → **Standard (same price all day)**, **Smart meter**. | "Most AEP customers pay the same price all day, so shifting saves them nothing on the bill. Jordan is one of them, but Jordan has a smart meter, so what Jordan shifts can be measured." |
| 0:20–0:40 | Command bar: **"Charge my car by 7 AM, run the dryer, I'm away Thursday to Saturday"** → **Add to plan**. Plan tab → **Find best times**. | "Jordan says what they need. The car moves to 2 AM, the dryer to 9 PM: out of AEP's 2 to 6 PM peak window. Thursday to Saturday is a trip." |
| 0:40–0:55 | Switch to AEP: `/utility/events` → **Create event** (Mon 4–6 PM, 2×). Back to the customer: banner → **Join** → Plan → **Commit plan**. Toast, then Today. | "AEP asks for more: a Flex Event, double points for staying off 4 to 6 PM. Jordan joins and commits: **5 points now, 230 pending**. Same price all day, but on time-of-use this plan would save about **$10 a month**, illustrative." |
| 0:55–1:15 | `/utility` Overview: KPI strip, then the chart. | "AEP's side. **38%** of enrolled homes are verified. The teal line is what AEP should plan on: every plan weighted by how reliably that home follows it. Expected peak-hour load is **17% lower**, and the shaded range runs from verified homes only to every plan followed. The single busiest hour drops **10%**. All simulated: our 480 homes are synthetic." |
| 1:15–1:35 | **Verification** → **Simulate Monday's meter reads**. Then Jordan's phone: **Monday, measured**. | "After Monday, the meters report. Measurable homes delivered **78%** of what they promised; self-reported plans still help the forecast but can't be paid. Jordan's meter shows **11.8 kWh** below baseline during the event, and Jordan settles **280 points**." |
| 1:35–1:50 | **Data feed**. | "This is what flows to AEP: pseudonymous plans in, area totals out, meter reads back, and a forecast CSV AEP can download. Never a single household." |
| 1:50–2:00 | `/methodology`. | "Everything real is labeled with its source and date; everything simulated says so. GridShift works today wherever there's a time-of-use rate, a smart meter, or a smart device, and it grows as AEP's smart meter rollout grows." |

## Shot list (for the recorded video)
1. Title card: "GridShift" + one-line pitch (2 s).
2. Customer app at phone width: Your setup, then the Plan results moving out of the peak.
3. Toast "+5 GridPoints · 230 pending" and the value card with the time-of-use comparison (close-up).
4. AEP Overview: KPI strip and the expected line with its range band (close-up on both callouts).
5. Verification: the button press and the committed-vs-delivered table.
6. Jordan's phone: "Monday, measured" with the baseline vs. actual and **+280** settled.
7. Data feed pipeline + CSV button (2 s), Methodology "Who GridShift works for today" (2 s), end card.

Record at 1440 × 900, browser zoom 100%, no bookmarks bar, no other tabs visible.

## Honesty checks (say these exactly or not at all)
- "Real": the AEP Ohio peak window, the PJM zone forecast and last week's metered load. Nothing else.
- Every $ is "illustrative." Every community number, meter read, and points total is "simulated."
- Points are not money. Don't give them a dollar value.
- Don't say "AI" or "AI-powered." The coach is "tell GridShift what you need."
- If a judge asks "most customers are on a flat rate, why would they use this?": "Verified homes earn rewards for measured shifts; unverified homes still help AEP forecast, and we're honest that they can't be paid."
- If a judge asks "how do you know they did it?": "Smart meter or device data, settled against each home's own baseline: average of its 3 highest of the last 10 weekdays, simplified from Ameren's Peak Time Rewards."
- If a judge asks why the peak is 2–6 PM when the grid peaks around 7 PM: "2–6 PM is AEP Ohio's price window. The real PJM forecast shows demand peaking around 7–8 AM and 7 PM, so GridShift also steers shifted load away from those hours." (PLAN.md §11)

## If something breaks live
| Problem | Do this |
|---|---|
| Command bar errors | Use the Plan tab chips (EV, Dryer) and the Week tab trip form. Same result. |
| Banner doesn't appear | Wait one poll (5 s), or point at the live banner preview on `/utility/events`. |
| AEP numbers don't move | Wait one poll (5 s). Still stuck: say "expected peak-hour load is 17% lower" over the chart and move on. |
| Settlement already ran | That's fine: the button says "Monday settled" and the results stay. Reset only between takes. |
| Anything worse | Restart the dev server, or `git checkout demo-v2` and demo the v2 story. |
