# GridShift

**Plan appliances around peak hours. Give the utility a forecast it can't get anywhere else.**
Built at HackOHI/O 2026.

- **Customer app (`/`):** see peak vs. off-peak at a glance (AEP Ohio time-of-use windows), get the best time to run your EV, dryer, and dishwasher, plan your week and trips, and see estimated savings.
- **AEP dashboard (`/utility`):** projected residential load from committed customer plans, heat maps by area and hour and by day and hour, Flex Events, and real AEP-zone context from PJM.
- **Methodology (`/methodology`):** every data source, assumption, and privacy rule.

## Run it
```bash
npm install
npm run dev     # http://localhost:3000
```
State lives in server memory and resets on restart. `POST /api/reset` restores the demo state.

## What's real and what's simulated
| Real | Simulated | Illustrative |
|---|---|---|
| AEP Ohio time-of-use peak windows; PJM AEP-zone load and forecast (snapshot, dated on screen) | The 12 service areas, 480 households, their routines, trips, and plans | ¢/kWh rates and dollar savings |

The utility view only ever shows aggregates of 5 or more homes.

## Team docs
`PLAN.md` (source of truth) · `BUILD.md` (step-by-step tasks) · `DESIGN.md` (design system and screens) · `DATA.md` (data sources) · `CLAUDE.md` / `AGENTS.md` (agent rules)
