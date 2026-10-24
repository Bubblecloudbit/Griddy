// scripts/convert.mjs — Raw PJM/EIA CSVs → RegionReference JSON (owner: D)
// Run by hand; the app never reads CSVs or calls PJM/EIA at runtime (design.md §6).
//
//   node scripts/convert.mjs --demand data/raw/load.csv --date 2026-10-17 --area AEP \
//     [--forecast data/raw/forecast.csv] [--price data/raw/lmp.csv] [--days 7] \
//     [--retrieved 2026-10-24] [--label "..."] [--source "..."] [--out data/real/pjm_aep_load_week.json]
//
// 7-day forecast only (DATA.md §2): pass --forecast without --demand. The forecast becomes
// demandMW, and each hour keeps the newest evaluation instead of the day-ahead one.
//
// Each CSV column is found by its header name (PJM Data Miner 2 and EIA Grid Monitor
// layouts below). Use --out instead of ">" on Windows PowerShell, which writes UTF-16.
import { readFileSync, writeFileSync } from "node:fs";

// Header names we recognize, lowercase. First match wins.
const COLUMNS = {
  time: ["datetime_beginning_ept", "forecast_datetime_beginning_ept", "local time at end of hour"],
  evaluated: ["evaluated_at_datetime_ept", "evaluated_at_ept"],
  area: ["zone", "forecast_area", "balancing authority", "sub-region", "subregion", "respondent", "pnode_name"],
  part: ["load_area", "pnode_name"], // pieces of the area that get summed (demand) or averaged (price)
  demand: ["mw", "demand (mw)", "demand (mw) (adjusted)", "load_mw"],
  forecast: ["forecast_load_mw", "demand forecast (mw)", "day-ahead demand forecast (mw)"],
  price: ["total_lmp_da", "total_lmp_rt", "lmp"],
};

function fail(message) {
  console.error(`convert: ${message}`);
  process.exit(1);
}

function warn(message) {
  console.error(`convert: warning: ${message}`);
}

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith("--") || argv[i + 1] === undefined) fail(`bad argument near "${argv[i]}"`);
    opts[argv[i].slice(2)] = argv[i + 1];
  }
  if (!opts.demand && !opts.forecast) fail("--demand <csv> or --forecast <csv> is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.date ?? "")) fail("--date YYYY-MM-DD is required");
  opts.days = Number(opts.days ?? 7);
  if (!Number.isInteger(opts.days) || opts.days < 1 || opts.days > 7) fail("--days must be 1 to 7");
  opts.retrieved ??= new Date().toISOString().slice(0, 10);
  opts.forecastOnly = !opts.demand;
  return opts;
}

// ---------------------------------------------------------------------------
// CSV parsing (handles quoted fields, CRLF, and a UTF-8 BOM)
// ---------------------------------------------------------------------------
function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted && ch === '"' && line[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) { cells.push(cell); cell = ""; }
    else cell += ch;
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

function readCsv(file) {
  const lines = readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) fail(`${file} has no data rows`);
  return { header: parseCsvLine(lines[0]).map((h) => h.toLowerCase()), rows: lines.slice(1).map(parseCsvLine) };
}

function findColumn(header, names) {
  for (const name of names) {
    const index = header.indexOf(name);
    if (index >= 0) return index;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Timestamps → slot index (0 = midnight on --date, local time)
// ---------------------------------------------------------------------------
// Accepts "10/15/2024 1:00:00 PM" (PJM), "10/15/2024 1 p.m. EDT" (EIA), "2024-10-15 13:00".
function parseTimestamp(text) {
  const mdy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2})(?::\d{2}){0,2}\s*(?:([ap])\.?\s*m\.?)?/i);
  if (mdy) {
    const [, m, d, y, h, ampm] = mdy;
    return { y: +y, m: +m, d: +d, h: to24Hour(+h, ampm?.toLowerCase()) };
  }
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2})/);
  if (iso) return { y: +iso[1], m: +iso[2], d: +iso[3], h: +iso[4] };
  return null;
}

function to24Hour(h, ampm) {
  if (ampm === "p" && h < 12) return h + 12;
  if (ampm === "a" && h === 12) return 0;
  return h;
}

// Hours between midnight on `date` and the timestamp. Date.UTC is used only as a
// calendar calculator; every timestamp here is already in local (EPT) time.
function slotIndex(ts, date) {
  const [y, m, d] = date.split("-").map(Number);
  return (Date.UTC(ts.y, ts.m - 1, ts.d, ts.h) - Date.UTC(y, m - 1, d)) / 3_600_000;
}

// ---------------------------------------------------------------------------
// One CSV → one hourly series
// ---------------------------------------------------------------------------
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

// demand: sum the load areas inside the zone. price: average the nodes.
// forecast: the newest forecast readSeries kept (day-ahead, or any in forecast-only mode).
// A load area with two rows in one slot (the repeated 1 AM on a fall-back DST day) is averaged, not summed.
function sumByPart(entries) {
  const parts = new Map();
  for (const e of entries) parts.set(e.part, [...(parts.get(e.part) ?? []), e.value]);
  return sum([...parts.values()].map((values) => sum(values) / values.length));
}

function combine(kind, entries) {
  if (kind === "demand") return sumByPart(entries);
  if (kind === "forecast" && entries[0].evaluated !== null) {
    return entries.reduce((best, e) => (e.evaluated > best.evaluated ? e : best)).value;
  }
  return sum(entries.map((e) => e.value)) / entries.length;
}

function checkAreas(rows, areaCol, area, file) {
  if (area && areaCol < 0) warn(`${file} has no area column, so --area was ignored`);
  if (area || areaCol < 0) return;
  const areas = new Set(rows.map((r) => r[areaCol]));
  if (areas.size > 1) fail(`${file} mixes ${areas.size} areas (${[...areas].slice(0, 5).join(", ")}…); pass --area`);
}

function readSeries(file, kind, opts) {
  const { header, rows } = readCsv(file);
  const timeCol = findColumn(header, COLUMNS.time);
  const valueCol = findColumn(header, COLUMNS[kind]);
  if (timeCol < 0 || valueCol < 0) {
    fail(`${file}: can't find the time or ${kind} column. Headers: ${header.join(", ")}`);
  }
  const areaCol = findColumn(header, COLUMNS.area);
  const evalCol = kind === "forecast" ? findColumn(header, COLUMNS.evaluated) : -1;
  const partCol = findColumn(header, COLUMNS.part);
  const hourEnding = header[timeCol].includes("end of hour"); // EIA labels the hour by its end
  checkAreas(rows, areaCol, opts.area, file);

  const hours = opts.days * 24;
  const slots = Array.from({ length: hours }, () => []);
  for (const row of rows) {
    if (opts.area && areaCol >= 0 && row[areaCol].toLowerCase() !== opts.area.toLowerCase()) continue;
    const ts = parseTimestamp(row[timeCol] ?? "");
    const value = Number((row[valueCol] ?? "").replace(/,/g, ""));
    if (!ts || row[valueCol] === "" || !Number.isFinite(value)) continue;

    const index = slotIndex(ts, opts.date) - (hourEnding ? 1 : 0);
    if (index < 0 || index >= hours) continue;

    let evaluated = null;
    if (evalCol >= 0) {
      const evalTs = parseTimestamp(row[evalCol] ?? "");
      evaluated = evalTs ? slotIndex(evalTs, opts.date) : null;
      const dayStart = Math.floor(index / 24) * 24;
      if (evaluated === null) continue;
      if (!opts.forecastOnly && evaluated >= dayStart) continue; // keep day-ahead forecasts only
    }
    slots[index].push({ value, evaluated, part: partCol >= 0 ? row[partCol] : "" });
  }

  const missing = slots.flatMap((s, i) => (s.length === 0 ? [i] : []));
  if (missing.length > 0) {
    fail(`${file}: no ${kind} data for hour(s) ${missing.join(", ")} (0 = midnight on ${opts.date}). Check --date, --area, --days.`);
  }
  return { values: slots.map((entries) => combine(kind, entries)), org: detectOrg(header) };
}

function detectOrg(header) {
  if (header.includes("local time at end of hour") || header.includes("balancing authority")) return "EIA";
  return "PJM";
}

// ---------------------------------------------------------------------------
// RegionReference
// ---------------------------------------------------------------------------
const SOURCE_NAMES = { PJM: "PJM Data Miner 2", EIA: "U.S. EIA Hourly Electric Grid Monitor" };
const SOURCE_URLS = { PJM: "https://dataminer2.pjm.com", EIA: "https://www.eia.gov/electricity/gridmonitor/" };

// "2026-10-25T00:00", one per slot. On a fall-back DST day (Nov 1 2026) the repeated hour merges into one slot.
function isoHours(opts) {
  const [y, m, d] = opts.date.split("-").map(Number);
  return Array.from({ length: opts.days * 24 }, (_, i) => new Date(Date.UTC(y, m - 1, d, i)).toISOString().slice(0, 16));
}

function defaultLabel(orgs, opts) {
  const day = new Date(`${opts.date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  const area = opts.area ? `${opts.area} zone` : "Zone";
  if (opts.forecastOnly) return `${area} · ${orgs.join("/")} ${opts.days}-day load forecast`;
  const span = opts.days > 1 ? ` (${opts.days} days)` : "";
  return `${area} · ${orgs.join("/")} hourly load from ${day.replace(/,/g, "")}${span}`;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const forecast = opts.forecast ? readSeries(opts.forecast, "forecast", opts) : null;
  const demand = opts.forecastOnly ? forecast : readSeries(opts.demand, "demand", opts);
  const price = opts.price ? readSeries(opts.price, "price", opts) : null;
  const orgs = [...new Set([demand, forecast, price].filter(Boolean).map((s) => s.org))];

  const reference = {
    label: opts.label ?? defaultLabel(orgs, opts),
    source: opts.source ?? orgs.map((o) => SOURCE_NAMES[o]).join(" + "),
    sourceUrl: SOURCE_URLS[orgs[0]],
    date: `retrieved ${opts.retrieved}`,
    unit: "MW",
    hours: isoHours(opts),
    demandMW: demand.values.map(Math.round),
    ...(forecast && !opts.forecastOnly && { forecastMW: forecast.values.map(Math.round) }),
    ...(price && { priceUSDperMWh: price.values.map((v) => Math.round(v * 100) / 100) }),
  };

  const json = JSON.stringify(reference, null, 2) + "\n";
  if (opts.out) {
    writeFileSync(opts.out, json, "utf8");
    console.error(`convert: wrote ${opts.out} (${reference.demandMW.length} hours, source: ${reference.source})`);
  } else {
    process.stdout.write(json);
  }
}

main();
