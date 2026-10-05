/**
 * financeService.js — public data API contract.
 *
 * ALL UI code, Redux thunks, and hooks call ONLY this module.
 * The underlying implementation (Yahoo Finance adapter vs mock data) is
 * selected by the VITE_USE_MOCK environment flag so the same consumer
 * code works in live, demo, and CI modes without any changes.
 *
 * ─── Extending the company list ──────────────────────────────────────────────
 * 1. Add an entry to COMPANY_META below.
 * 2. Add the ticker to TICKERS.
 * That is the only code change required — the rest of the app picks it up
 * automatically because all iteration uses the TICKERS constant.
 */

import { getMockQuotes, getMockHistory, getMockQuoteSummary } from './mockData';
import { USE_MOCK } from '../utils/env';
export { COMPANY_META, TICKERS, TICKER_NAMES } from './companies';
import { TICKERS } from './companies';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch current-day quote summaries for the requested tickers.
 *
 * Returns a map of ticker → NormalisedQuote.  Tickers that fail are
 * included in the map with their `error` field set so the UI can display
 * a per-card error without blanking the whole dashboard.
 *
 * @param {string[]} [tickers=TICKERS]
 * @returns {Promise<Object.<string, NormalisedQuote>>}
 */
export async function getQuotes(tickers = TICKERS) {
  if (USE_MOCK) return getMockQuotes(tickers);

  const { fetchQuotes } = await import('./yahooAdapter');
  return fetchQuotes(tickers);
}

/**
 * Fetch historical price series for a single ticker.
 *
 * @param {string}                     ticker
 * @param {'day' | 'week' | 'quarter'} range
 * @returns {Promise<HistoryPoint[]>}
 */
export async function getHistory(ticker, range) {
  if (USE_MOCK) return getMockHistory(ticker, range);

  const { fetchHistory } = await import('./yahooAdapter');
  return fetchHistory(ticker, range);
}

/**
 * Fetch historical price series for ALL tracked tickers in parallel.
 *
 * Returns a map of `${ticker}:${range}` → HistoryPoint[].
 * Tickers that fail produce an empty array in the map so chart
 * components always receive a valid (possibly empty) series.
 *
 * @param {'day' | 'week' | 'quarter'} range
 * @param {string[]} [tickers=TICKERS]
 * @returns {Promise<Object.<string, HistoryPoint[]>>}
 */
export async function getAllHistory(range, tickers = TICKERS) {
  const entries = await Promise.allSettled(
    tickers.map(async ticker => {
      const data = await getHistory(ticker, range);
      return [{ ticker, range }, data];
    })
  );

  return Object.fromEntries(
    entries.map((result, i) => {
      const ticker = tickers[i];
      const key    = `${ticker}:${range}`;
      return result.status === 'fulfilled'
        ? [key, result.value[1]]
        : [key, []];
    })
  );
}

/**
 * Fetch a richer fundamentals snapshot for a single ticker.
 *
 * Includes all NormalisedQuote fields plus: trailingPE, forwardPE,
 * dividendYield, revenueGrowth, grossMargins, returnOnEquity, beta,
 * enterpriseValue, priceToBook.
 *
 * @param {string} ticker
 * @returns {Promise<QuoteSummary>}
 */
export async function getQuoteSummary(ticker) {
  if (USE_MOCK) return getMockQuoteSummary(ticker);

  const { fetchQuoteSummary } = await import('./yahooAdapter');
  return fetchQuoteSummary(ticker);
}
