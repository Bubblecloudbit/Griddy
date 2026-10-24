# GridShift — Data Plan

> Owner: **D**. Goal: every real number in the app has a source, a date, and a link. Time box: **2 hours** for §1–§4. Everything is a **snapshot** committed as small JSON; the demo never makes live calls.

## 0. At a glance

| # | Data | Source | Used in | Format we commit | Priority |
|---|---|---|---|---|---|
| 1 | AEP Ohio time-of-use **peak windows** | AEP Ohio website | Customer ribbon, peak band on every chart, rate plan | `data/real/aep_tou.json` | **Must** (10 min) |
| 2 | AEP-zone **7-day load forecast** | PJM Data Miner 2 (website CSV) | AEP Overview: "AEP zone context" chart | `data/real/pjm_aep_forecast_7d.json` | **Must** |
| 3 | AEP-zone **hourly metered load**, recent week | PJM Data Miner 2 (website CSV) | Same chart: actual vs. forecast for last week | `data/real/pjm_aep_load_week.json` | Should |
| 4 | **Backup** for 2–3 | EIA Hourly Electric Grid Monitor (EIA-930) | Same chart, if PJM is a pain | `data/real/eia_pjm_*.json` | Fallback |
| 5 | AEP-zone **day-ahead hourly prices** (LMP) | PJM Data Miner 2 | Optional "grid price" line on the customer ribbon | `data/real/pjm_aep_da_lmp.json` | Nice to have |
| 6 | PJM **generation by fuel** | PJM Data Miner 2 | Optional "cleanest hours" badge | `data/real/pjm_fuel_mix.json` | Stretch |
| 7 | Typical **residential load shape** (Ohio) | NREL End-Use Load Profiles (ResStock) | Shape of the synthetic baseline curve | constants in `lib/` (hand to A) | Stretch |
| 8 | **Appliance** kWh / kW defaults | Engine defaults, labeled illustrative | Appliance cards | already in `lib/` | Done |

Everything else (the 12 areas, households, routines, trips, plans) is **simulated** and labeled that way.

---

## 1. AEP Ohio time-of-use windows (Must, 10 min)
- **Page:** https://www.aepohio.com/account/bills/programs/time-of-use
- **What it says (verify on the page before committing):** on-peak **2–6 PM, May 1–Oct 31**; **6–9 AM, Nov 1–Apr 30**; weekdays only, excluding listed holidays. Available to residential Standard Service Offer customers with a smart meter.
- **Our demo week (Oct 25–31) is fully in the summer schedule**, so peak = 2–6 PM on Mon–Fri.
- **Commit:**
```json
{ "source": "AEP Ohio, Time-of-Use program page", "sourceUrl": "https://www.aepohio.com/account/bills/programs/time-of-use",
  "retrieved": "2026-10-24",
  "summer": { "months": [5,6,7,8,9,10], "peakClockHours": [14,15,16,17] },
  "winter": { "months": [11,12,1,2,3,4], "peakClockHours": [6,7,8] },
  "weekdaysOnly": true }
```
- **¢/kWh rates (optional, 20 min max):** the AEP page links to the tariff. If you can find the residential time-of-use on-peak and off-peak ¢/kWh and are confident they're current, give them to A with the PDF page number, and we drop "illustrative" from rates. Third-party rate databases (e.g., OpenEI) list older AEP Ohio time-of-use tariffs with **different hours** (7 AM–9 PM), so **don't** use those. If unsure, prices stay illustrative.

## 2. PJM AEP-zone 7-day load forecast (Must)
- **Where:** https://dataminer2.pjm.com → feed **"Seven-Day Load Forecast"** (`load_frcstd_7_day`). The website is public; no login needed to view or download CSV. (Only the API needs an approved account.)
- **Filter:** forecast area = the AEP zone (pick the value that contains "AEP" in the area dropdown), the most recent evaluation date.
- **Download** CSV → `data/raw/` (never committed).
- **Convert** with `scripts/pjm_to_json.ts` (or Python) to `RegionReference`:
```json
{ "label": "AEP zone · PJM 7-day load forecast", "source": "PJM Data Miner 2 · Seven-Day Load Forecast",
  "sourceUrl": "https://dataminer2.pjm.com", "date": "retrieved 2026-10-24", "unit": "MW",
  "hours": ["2026-10-25T00:00", "..."], "demandMW": [/* ... */] }
```
- **Shown as:** slate-blue line, MW, `REAL` tag, explainer "What AEP already forecasts for the whole zone. GridShift adds what customers plan to do."
- If the forecast starts later than Oct 25, show whatever 7 days the file covers and label the dates truthfully. Don't shift dates to match our demo week.

## 3. PJM AEP-zone hourly metered load, last 7 days (Should)
- **Feed:** "Hourly Load: Metered" (`hrl_load_metered`), filtered to the AEP load area/zone, last full 7 days.
- If the latest days aren't posted yet, use "Hourly Load: Estimated."
- **Shown as:** a second view on the same card ("Last week: actual") so judges see real daily shape: morning and evening bumps, weekend dip.
- Commit to `data/real/pjm_aep_load_week.json`, same `RegionReference` shape with `demandMW`.

## 4. EIA backup (only if PJM downloads fight you for 30+ min)
- **Where:** https://www.eia.gov/electricity/gridmonitor/ → Balancing authority **PJM** → download CSV. Includes hourly **demand** and **day-ahead demand forecast**.
- **Subregions:** EIA publishes demand by subregion for some balancing authorities, including PJM. Check whether an AEP subregion is listed. If it is, use it; if not, use PJM total and label it "PJM (whole region)."
- **Optional API:** https://www.eia.gov/opendata/ (free key, instant). Not needed for a snapshot.

## 5. Nice to have / stretch
**5a. Day-ahead prices (Nice to have)** · feed "Day-Ahead Hourly LMPs" (`da_hrl_lmps`), filter type = ZONE, the AEP zone, one recent weekday.
- Shown as a thin slate-blue line over the customer ribbon: "Grid price (wholesale, PJM) REAL." Customer savings still use the time-of-use rate. The line explains *why* peaks are priced higher.

**5b. Cleanest hours (Stretch)** · feed "Generation by Fuel Type" (`gen_by_fuel`), one recent day, PJM-wide.
- Compute the share of non-fossil generation per hour → mark the top 4 hours with a small "Cleaner grid" tag on the ribbon. Only if it's done by 9 PM.

**5c. Residential load shape (Stretch)** · NREL End-Use Load Profiles: https://www.nrel.gov/buildings/end-use-load-profiles (pre-aggregated profiles on data.openei.org, viewer at resstock.nrel.gov).
- Pull an Ohio (or Franklin County) residential average weekday and weekend hourly shape → 24 normalized numbers each → hand to A to replace the hand-drawn baseline shape. Then the baseline curve is "shape from NREL ResStock, scaled" (`REAL` shape, `SIMULATED` homes).

**5d. Weather (Stretch, only if time)** · National Weather Service API (`api.weather.gov`, no key) 7-day forecast for Columbus. A small temperature strip above the Day × hour heat map gives AEP context for the outlook.

## 6. Rules
- **Keep the repo private.** PJM's terms say Data Miner data is for internal use, and redistribution needs a license. Commit only small derived JSON, never raw CSVs (`data/raw/` is gitignored).
- **Every real dataset shows:** source name, link, and retrieval date on screen (`SourceNote`), plus the `REAL` tag.
- **Never mix units:** PJM/EIA = MW on their own chart; our community = kW.
- **Don't fabricate.** If a pull fails, ship the mock with a visible "sample data" label rather than numbers that look real.
- If the PJM API key arrives, don't switch to live calls. Re-export a fresher snapshot.

## 7. Hand-offs
| D delivers | To | By |
|---|---|---|
| `aep_tou.json` + verified hours | A (rate plan), B (ribbon), C (peak band) | 4:30 PM |
| `pjm_aep_forecast_7d.json` (+ week actual) via `lib/realdata` | C | 6:30 PM |
| Sources table (name, use, date, link) | `/methodology` page | 9:30 PM |
| Optional: LMP line, cleanest hours, NREL shape | B / A | 9:00 PM |
