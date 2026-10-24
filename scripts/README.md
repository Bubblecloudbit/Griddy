# scripts/ (owner: D)

Put the converter here that turns raw PJM/EIA CSVs (dropped in `data/raw/`, gitignored)
into small `RegionReference` JSON curves in `data/real/`.

Example target:

```
node scripts/convert.mjs data/raw/pjm-aep-2024-10-15.csv > data/real/pjm-aep-2024-10-15.json
```

Cite the source and date on screen ("Source: PJM Data Miner 2, [date]").
Commit only the derived curves, never the raw CSVs.
