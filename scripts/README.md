# scripts/ (owner: D)

`convert.mjs` turns raw PJM/EIA CSVs (dropped in `data/raw/`, gitignored) into small
`RegionReference` JSON curves in `data/real/`. The app imports that JSON statically, so it
never reads files or calls PJM/EIA at runtime. See design.md §6.

## 1. Download the CSVs into `data/raw/`

Pick a day that isn't a daylight-saving switch. With the default `--days 2`, also include the next day.

**PJM Data Miner 2** (dataminer2.pjm.com, CSV export works without a login), filter to the AEP zone:

| Feed | What it gives | Columns the script reads |
|---|---|---|
| Hourly Load: Metered (`hrl_load_metered`) | `--demand` | `datetime_beginning_ept`, `zone`, `mw` |
| Historical Load Forecasts (`load_frcstd_hist`) | `--forecast` (optional) | `forecast_datetime_beginning_ept`, `evaluated_at_datetime_ept`, `forecast_area`, `forecast_load_mw` |
| Day-Ahead Hourly LMPs (`da_hrl_lmps`) | `--price` (optional) | `datetime_beginning_ept`, `zone` or `pnode_name`, `total_lmp_da` |

**EIA Hourly Electric Grid Monitor** (fallback, no key): a balance CSV with
`Local Time at End of Hour`, `Balancing Authority`, `Demand (MW)` and `Demand Forecast (MW)`.
Pass the same file to `--demand` and `--forecast`, with `--area PJM`.

## 2. Convert

```
node scripts/convert.mjs --demand data/raw/hrl_load_metered.csv --forecast data/raw/load_frcstd_hist.csv --price data/raw/da_hrl_lmps.csv --date 2024-10-15 --area AEP --out data/real/pjm-aep-2024-10-15.json
```

| Flag | Meaning |
|---|---|
| `--demand <csv>` | Required. Hourly load; load areas inside the zone are summed. |
| `--forecast <csv>` | Optional. Keeps the latest forecast made **before** each day began (day-ahead). |
| `--price <csv>` | Optional. Wholesale price, averaged across nodes. Grid-stress context only. |
| `--date YYYY-MM-DD` | Required. First day; hour 0 = midnight local (EPT) on this date. |
| `--days 1\|2` | 24 or 48 hours. Default 2, matching the app's 48-hour horizon. |
| `--area <name>` | Keeps rows whose zone / forecast area / balancing authority matches. Required if a file mixes areas. |
| `--label`, `--source` | Override the generated label (e.g. "PJM AEP Zone — Tue Oct 15 2024") and source. |
| `--out <file>` | Write UTF-8 JSON. Use this instead of `>` on Windows PowerShell, which writes UTF-16. |

The script stops with an error if a column is missing (it prints the headers it found), an area
filter is needed, or any hour has no data.

## 3. Use it in the app

In `lib/realdata/index.ts`, uncomment the import, point it at your file, and set
`SNAPSHOT = snapshot`. The loader checks the shape when it loads, so a bad file fails loudly in dev.

Cite the source and date on screen ("Source: PJM Data Miner 2, [date]").
Commit only the derived curves in `data/real/`, never the raw CSVs (PJM license: internal use).
