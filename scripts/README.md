# scripts/ (owner: D)

`convert.mjs` turns raw PJM/EIA CSVs (dropped in `data/raw/`, gitignored) into small
`RegionReference` JSON curves in `data/real/`. The app imports that JSON statically, so it
never reads files or calls PJM/EIA at runtime. See DATA.md.

## 1. Download the CSVs into `data/raw/`

**PJM Data Miner 2** (dataminer2.pjm.com, CSV export works without a login), filter to the AEP zone:

| Feed | What it gives | Columns the script reads |
|---|---|---|
| Seven-Day Load Forecast (`load_frcstd_7_day`) | `--forecast` alone → `pjm_aep_forecast_7d.json` (DATA.md §2) | `forecast_datetime_beginning_ept`, `evaluated_at_datetime_ept`, `forecast_area`, `forecast_load_mw` |
| Hourly Load: Metered (`hrl_load_metered`) | `--demand` → `pjm_aep_load_week.json` (DATA.md §3) | `datetime_beginning_ept`, `zone`, `mw` |
| Historical Load Forecasts (`load_frcstd_hist`) | `--forecast` next to `--demand` (optional) | same as the 7-day feed |
| Day-Ahead Hourly LMPs (`da_hrl_lmps`) | `--price` (optional) | `datetime_beginning_ept`, `zone` or `pnode_name`, `total_lmp_da` |

**EIA Hourly Electric Grid Monitor** (fallback, no key): a balance CSV with
`Local Time at End of Hour`, `Balancing Authority`, `Demand (MW)` and `Demand Forecast (MW)`.
Pass the same file to `--demand` and `--forecast`, with `--area PJM`.

## 2. Convert

```
node scripts/convert.mjs --forecast data/raw/load_frcstd_7_day.csv --date 2026-10-25 --days 6 --area AEP --retrieved 2026-10-24 --source "PJM Data Miner 2 · Seven-Day Load Forecast" --label "AEP zone · PJM load forecast, Sun Oct 25 – Fri Oct 30" --out data/real/pjm_aep_forecast_7d.json
node scripts/convert.mjs --demand data/raw/hrl_load_metered.csv --date 2026-10-17 --area AEP --out data/real/pjm_aep_load_week.json
```

| Flag | Meaning |
|---|---|
| `--forecast <csv>` | Alone: the forecast becomes `demandMW`, newest evaluation per hour. With `--demand`: kept as `forecastMW`, day-ahead only. |
| `--demand <csv>` | Hourly load; load areas inside the zone are summed. |
| `--price <csv>` | Optional. Wholesale price, averaged across nodes. Grid-stress context only. |
| `--date YYYY-MM-DD` | Required. First day in the file; hour 0 = midnight local (EPT). Use the file's real dates, never shift them to the demo week. |
| `--days 1–7` | Default 7 (168 hours). |
| `--area <name>` | Keeps rows whose zone / forecast area / balancing authority matches. Required if a file mixes areas. |
| `--retrieved YYYY-MM-DD` | Shown as "retrieved …" on screen. Default today. |
| `--label`, `--source` | Override the generated label and source. |
| `--out <file>` | Write UTF-8 JSON. Use this instead of `>` on Windows PowerShell, which writes UTF-16. |

Output includes `sourceUrl`, `unit: "MW"`, and `hours` (one ISO timestamp per value). The script
stops with an error if a column is missing (it prints the headers it found), an area filter is
needed, or any hour has no data.

## 3. Use it in the app

In `lib/realdata/index.ts`, uncomment the import, point it at your file, and set
`SNAPSHOT = snapshot`. The loader checks the shape when it loads, so a bad file fails loudly in dev.

Commit only the derived curves in `data/real/`, never the raw CSVs (PJM license: internal use).
