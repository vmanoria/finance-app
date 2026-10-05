import { formatDate } from '../utils/dateHelpers';

/**
 * normalise.js
 *
 * Maps raw yahoo-finance2 API responses to stable domain models used
 * throughout the application.  All consumers (components, hooks, tests)
 * depend only on these shapes — never on raw Yahoo payloads.
 *
 * Domain models
 * ─────────────
 * NormalisedQuote
 *   ticker       string   — ticker symbol
 *   name         string   — company display name
 *   price        number   — current market price
 *   open         number   — today's open price
 *   prevClose    number   — previous close price
 *   change       number   — price change vs prevClose
 *   pct          number   — % change vs prevClose
 *   pctFromOpen  number   — % change vs today's open
 *   high         number   — day high
 *   low          number   — day low
 *   week52High   number   — 52-week high
 *   week52Low    number   — 52-week low
 *   volume       number   — current day volume
 *   avgVolume    number   — 10-day average volume
 *   marketCap    number   — market capitalisation
 *   marketState  string   — 'REGULAR' | 'PRE' | 'POST' | 'CLOSED'
 *   error        string|null
 *
 * HistoryPoint
 *   ticker  string
 *   date    string  — YYYY-MM-DD
 *   price   number  — close price (or mid for intraday)
 *   open    number|null
 *   high    number|null
 *   low     number|null
 *   volume  number|null
 *   pctFromBase  number|null — % change from first point in series (set by normaliseHistory)
 */

// ─── Quote ────────────────────────────────────────────────────────────────────

/**
 * Normalise a raw yahoo-finance2 `quote()` result.
 * @param {object} raw
 * @returns {NormalisedQuote}
 */
export function normaliseQuote(raw) {
  if (!raw) return null;

  const price     = raw.regularMarketPrice          ?? null;
  const open      = raw.regularMarketOpen           ?? null;
  const prevClose = raw.regularMarketPreviousClose  ?? null;
  const change    = raw.regularMarketChange         ?? null;
  const pct       = raw.regularMarketChangePercent  ?? null;

  const pctFromOpen =
    open != null && price != null && open !== 0
      ? +((price / open - 1) * 100).toFixed(3)
      : null;

  return {
    ticker:      raw.symbol                      ?? '',
    name:        raw.shortName ?? raw.longName   ?? raw.symbol ?? '',
    price,
    open,
    prevClose,
    change,
    pct,
    pctFromOpen,
    high:        raw.regularMarketDayHigh        ?? null,
    low:         raw.regularMarketDayLow         ?? null,
    week52High:  raw.fiftyTwoWeekHigh            ?? null,
    week52Low:   raw.fiftyTwoWeekLow             ?? null,
    volume:      raw.regularMarketVolume         ?? null,
    avgVolume:   raw.averageDailyVolume10Day     ?? null,
    marketCap:   raw.marketCap                   ?? null,
    marketState: raw.marketState                 ?? 'CLOSED',
    error:       null,
  };
}

// ─── History ─────────────────────────────────────────────────────────────────

/**
 * Normalise a raw yahoo-finance2 `historical()` (or chart) result.
 *
 * For daily/weekly/quarterly ranges, Yahoo returns daily OHLCV objects.
 * For intraday (day range), it returns chart ticks where `close` is the
 * price at each interval — the same field, so the same mapping works.
 *
 * `pctFromBase` is set on every point as the % change from the first
 * valid data point in the series, which allows comparison charts to
 * normalise companies with very different absolute prices.
 *
 * @param {string} ticker
 * @param {Array}  rawItems  — array of { date, open, high, low, close, volume }
 * @returns {HistoryPoint[]}
 */
export function normaliseHistory(ticker, rawItems = []) {
  const points = rawItems
    .filter(item => item && item.close != null)
    .map(item => ({
      ticker,
      date:   formatDate(item.date),
      price:  item.close,
      open:   item.open   ?? null,
      high:   item.high   ?? null,
      low:    item.low    ?? null,
      volume: item.volume ?? null,
      pctFromBase: null,   // filled in below
    }));

  // Compute cumulative % change from the first price in the series.
  // This is the primary metric used by ComparisonChart for the quarter view.
  if (points.length > 0) {
    const base = points[0].price;
    for (const p of points) {
      p.pctFromBase = base ? +((p.price / base - 1) * 100).toFixed(3) : 0;
    }
  }

  return points;
}

// ─── Derived metrics ─────────────────────────────────────────────────────────

/**
 * Given a completed HistoryPoint[], return a simple summary object
 * useful for ranking tables and sparkline labels.
 *
 * @param {HistoryPoint[]} series
 * @returns {{ firstPrice: number, lastPrice: number, pctChange: number, high: number, low: number }}
 */
export function summariseSeries(series) {
  if (!series || series.length === 0) {
    return { firstPrice: null, lastPrice: null, pctChange: null, high: null, low: null };
  }
  const first = series[0].price;
  const last  = series[series.length - 1].price;
  const highs = series.map(p => p.high ?? p.price).filter(Boolean);
  const lows  = series.map(p => p.low  ?? p.price).filter(Boolean);

  return {
    firstPrice: first,
    lastPrice:  last,
    pctChange:  first ? +((last / first - 1) * 100).toFixed(2) : null,
    high:       highs.length ? Math.max(...highs) : null,
    low:        lows.length  ? Math.min(...lows)  : null,
  };
}
