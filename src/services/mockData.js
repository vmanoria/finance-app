import { formatDate } from '../utils/dateHelpers';
import { normaliseHistory } from '../utils/normalise';
import { COMPANY_META } from './companies';

/**
 * mockData.js
 *
 * Deterministic offline fixtures used when VITE_USE_MOCK=true.
 * Provides realistic but non-live data for: CI pipelines, offline demos,
 * and unit/integration tests.
 *
 * Design goals
 * ─────────────
 * • Output shapes exactly mirror the financeService public API
 *   (getQuotes → NormalisedQuote map, getHistory → HistoryPoint[])
 * • Fully deterministic: same ticker + range always produces the same series
 * • Per-ticker drift uses the ticker's character codes as a seed so each
 *   company has a visually distinct chart without random() calls
 * • New tickers added to COMPANY_META are handled automatically via the
 *   BASE_PRICES fallback; only add an explicit entry for a custom price
 */

// ─── Static per-ticker data ───────────────────────────────────────────────────

const BASE_PRICES = {
  IBM:  180.50,
  MSFT: 415.30,
  ORCL: 125.80,
  SAP:  195.40,
  CRM:  275.60,
};

// Approximate fundamentals for mock QuoteSummary responses
const FUNDAMENTALS = {
  IBM:  { trailingPE: 21.4, forwardPE: 18.2, dividendYield: 0.0315, beta: 0.72,
          revenueGrowth: 0.02, grossMargins: 0.54, returnOnEquity: 0.18 },
  MSFT: { trailingPE: 35.1, forwardPE: 28.7, dividendYield: 0.0072, beta: 0.89,
          revenueGrowth: 0.17, grossMargins: 0.69, returnOnEquity: 0.38 },
  ORCL: { trailingPE: 29.8, forwardPE: 22.5, dividendYield: 0.0130, beta: 0.95,
          revenueGrowth: 0.08, grossMargins: 0.73, returnOnEquity: null },
  SAP:  { trailingPE: 42.6, forwardPE: 31.0, dividendYield: 0.0190, beta: 0.81,
          revenueGrowth: 0.09, grossMargins: 0.72, returnOnEquity: 0.14 },
  CRM:  { trailingPE: 51.3, forwardPE: 38.4, dividendYield: null,   beta: 1.15,
          revenueGrowth: 0.11, grossMargins: 0.76, returnOnEquity: 0.10 },
};

// ─── Deterministic drift ─────────────────────────────────────────────────────

/**
 * Returns a deterministic drift fraction for a given ticker and day index.
 * Using sin() with a ticker-specific phase offset gives each company a
 * distinctive trend while keeping values within ±1.5 % per step.
 */
function drift(ticker, i) {
  const phase = ticker.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return Math.sin(phase * 0.13 + i * 0.71) * 0.015;
}

// ─── Series generation ────────────────────────────────────────────────────────

/**
 * Generates a daily OHLCV series for `days` calendar days ending today.
 * Weekend days are skipped (Yahoo Finance does the same).
 *
 * @param {string} ticker
 * @param {number} days   — number of calendar days to look back
 * @returns {Array<{ticker, date, price, open, high, low, volume}>}
 */
function generateDailySeries(ticker, days) {
  const base   = BASE_PRICES[ticker] ?? 100;
  const series = [];
  const now    = new Date();

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;  // skip weekends

    const prev  = series.length ? series[series.length - 1].price : base;
    const close = +(prev * (1 + drift(ticker, i))).toFixed(2);
    const open  = +(prev * (1 + drift(ticker, i + 1) * 0.3)).toFixed(2);

    series.push({
      ticker,
      date:   formatDate(d),
      price:  close,
      open,
      high:   +(Math.max(open, close) * 1.005).toFixed(2),
      low:    +(Math.min(open, close) * 0.995).toFixed(2),
      volume: Math.floor(4_000_000 + Math.abs(drift(ticker, i)) * 25_000_000),
    });
  }

  return series;
}

/**
 * Generates a 5-minute intraday series for the current trading day.
 * Covers 09:30–16:00 ET (78 intervals).
 *
 * @param {string} ticker
 * @returns {Array<{ticker, date, price, open, high, low, volume}>}
 */
function generateIntradaySeries(ticker) {
  const base   = BASE_PRICES[ticker] ?? 100;
  const series = [];
  const now    = new Date();

  // Build series from 09:30 ET this calendar day up to "now"
  // (in a test environment "now" is used as-is for determinism)
  const INTERVALS = 78;  // 09:30 to 16:00 in 5-min steps

  for (let i = 0; i < INTERVALS; i++) {
    const prev  = series.length ? series[series.length - 1].price : base;
    const close = +(prev * (1 + drift(ticker, 500 + i) * 0.4)).toFixed(2);
    const open  = +(prev * (1 + drift(ticker, 501 + i) * 0.2)).toFixed(2);

    // Construct a notional timestamp — we use today's date for the date field
    const dateObj = new Date(now);
    dateObj.setHours(9 + Math.floor((30 + i * 5) / 60));
    dateObj.setMinutes((30 + i * 5) % 60);
    dateObj.setSeconds(0);

    series.push({
      ticker,
      date:   formatDate(dateObj),
      price:  close,
      open,
      high:   +(Math.max(open, close) * 1.002).toFixed(2),
      low:    +(Math.min(open, close) * 0.998).toFixed(2),
      volume: Math.floor(200_000 + Math.abs(drift(ticker, 500 + i)) * 1_000_000),
    });
  }

  return series;
}

// ─── Quote generation ─────────────────────────────────────────────────────────

function mockQuote(ticker) {
  const daily = generateDailySeries(ticker, 1);
  const today = daily[daily.length - 1] ?? {};
  const prev  = daily[0]?.price ?? BASE_PRICES[ticker] ?? 100;
  const price = today.price ?? prev;

  const change     = +(price - prev).toFixed(2);
  const pct        = prev ? +(change / prev * 100).toFixed(3) : 0;
  const open       = today.open   ?? price;
  const pctFromOpen = open !== 0  ? +((price / open - 1) * 100).toFixed(3) : 0;

  const companyName = COMPANY_META[ticker]?.name ?? ticker;
  const base        = BASE_PRICES[ticker] ?? 100;

  return {
    ticker,
    name:        companyName,
    price,
    open,
    prevClose:   prev,
    change,
    pct,
    pctFromOpen,
    high:        today.high   ?? null,
    low:         today.low    ?? null,
    week52High:  +(base * 1.28).toFixed(2),
    week52Low:   +(base * 0.75).toFixed(2),
    volume:      today.volume ?? null,
    avgVolume:   Math.floor(6_500_000 + Math.abs(drift(ticker, 0)) * 8_000_000),
    marketCap:   Math.floor(base * 1_200_000 * (1 + drift(ticker, 99))),
    marketState: 'REGULAR',
    error:       null,
  };
}

// ─── Public exports ───────────────────────────────────────────────────────────

/**
 * Return mock quotes for the given tickers.
 * @param {string[]} tickers
 * @returns {Object.<string, NormalisedQuote>}
 */
export function getMockQuotes(tickers) {
  return Object.fromEntries(tickers.map(t => [t, mockQuote(t)]));
}

/**
 * Return mock history for a single ticker and named range.
 * Uses intraday generation for 'day', daily for 'week' and 'quarter'.
 *
 * The returned series has `pctFromBase` already set (via normaliseHistory).
 *
 * @param {string}                     ticker
 * @param {'day' | 'week' | 'quarter'} range
 * @returns {HistoryPoint[]}
 */
export function getMockHistory(ticker, range) {
  if (range === 'day') {
    const raw = generateIntradaySeries(ticker).map(p => ({
      date:   new Date(p.date),
      open:   p.open,
      high:   p.high,
      low:    p.low,
      close:  p.price,
      volume: p.volume,
    }));
    return normaliseHistory(ticker, raw);
  }

  const days = range === 'week' ? 7 : quarterDaysBack();
  const raw  = generateDailySeries(ticker, days).map(p => ({
    date:   new Date(p.date),
    open:   p.open,
    high:   p.high,
    low:    p.low,
    close:  p.price,
    volume: p.volume,
  }));
  return normaliseHistory(ticker, raw);
}

/**
 * Return a mock QuoteSummary (quote + fundamentals) for a single ticker.
 * @param {string} ticker
 * @returns {QuoteSummary}
 */
export function getMockQuoteSummary(ticker) {
  const base  = mockQuote(ticker);
  const funds = FUNDAMENTALS[ticker] ?? {};

  return {
    ...base,
    trailingPE:      funds.trailingPE      ?? null,
    forwardPE:       funds.forwardPE       ?? null,
    dividendYield:   funds.dividendYield   ?? null,
    revenueGrowth:   funds.revenueGrowth   ?? null,
    grossMargins:    funds.grossMargins    ?? null,
    returnOnEquity:  funds.returnOnEquity  ?? null,
    beta:            funds.beta            ?? null,
    enterpriseValue: null,
    priceToBook:     null,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Returns the number of calendar days since the start of the current quarter,
 * used to size the quarter mock series consistently with the live adapter.
 */
function quarterDaysBack() {
  const now          = new Date();
  const qMonth       = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), qMonth, 1);
  return Math.ceil((now - quarterStart) / (1000 * 60 * 60 * 24));
}
