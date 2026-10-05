import { normaliseQuote, normaliseHistory } from '../utils/normalise';
import { rangeParams } from '../utils/dateHelpers';

/**
 * yahooAdapter.js
 *
 * Thin wrapper around yahoo-finance2. All Yahoo Finance network calls live
 * here so swapping the data source (e.g. to a backend proxy) requires only
 * changing this file — nothing in services, hooks, or components changes.
 *
 * Browser note:
 *   yahoo-finance2 is a Node.js library and is externalised from the Vite
 *   browser bundle (see vite.config.js).  In the browser the app uses mock
 *   data (VITE_USE_MOCK=true) or a /api/finance proxy.  To add a proxy,
 *   replace the body of fetchQuotes / fetchHistory with fetch() calls to
 *   your backend without touching any caller.
 */

// ─── Error types ──────────────────────────────────────────────────────────────

/**
 * Typed error thrown by this adapter.  Callers can inspect `code` to decide
 * whether to retry, show a user message, or fall back to cached data.
 *
 * Codes:
 *   RATE_LIMITED   — HTTP 429 or Yahoo throttle message
 *   NOT_FOUND      — ticker symbol is unknown to Yahoo Finance
 *   NETWORK        — generic network / timeout failure
 *   UNKNOWN        — anything else
 */
export class ServiceError extends Error {
  constructor(code, message, ticker) {
    super(message);
    this.name    = 'ServiceError';
    this.code    = code;
    this.ticker  = ticker ?? null;
  }
}

function classifyError(err, ticker) {
  const msg = err?.message ?? '';
  if (err?.statusCode === 429 || /rate.?limit|too many/i.test(msg)) {
    return new ServiceError('RATE_LIMITED', `Rate limited fetching ${ticker}`, ticker);
  }
  if (err?.statusCode === 404 || /not found|no fundamentals/i.test(msg)) {
    return new ServiceError('NOT_FOUND', `Ticker not found: ${ticker}`, ticker);
  }
  if (/network|timeout|ENOTFOUND|ECONNREFUSED/i.test(msg)) {
    return new ServiceError('NETWORK', `Network error fetching ${ticker}: ${msg}`, ticker);
  }
  return new ServiceError('UNKNOWN', msg || `Unknown error fetching ${ticker}`, ticker);
}

// ─── yahoo-finance2 singleton ─────────────────────────────────────────────────

let yf;

async function getYf() {
  if (!yf) {
    const mod = await import('yahoo-finance2');
    yf = mod.default ?? mod;
  }
  return yf;
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

/**
 * Calls `fn()` up to `maxAttempts` times.
 * Waits `delayMs` before each retry.
 * Only retries on RATE_LIMITED and NETWORK errors; NOT_FOUND is terminal.
 */
async function withRetry(fn, maxAttempts = 2, delayMs = 800) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isRetryable =
        err instanceof ServiceError
          ? err.code === 'RATE_LIMITED' || err.code === 'NETWORK'
          : true;                    // raw errors are assumed retryable

      if (!isRetryable || attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, delayMs * attempt));
    }
  }
  throw lastErr;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch current quotes for an array of tickers.
 * Returns a map of ticker → NormalisedQuote.
 * Tickers that fail appear in the map with `error` set (partial success).
 *
 * @param {string[]} tickers
 * @returns {Promise<Object.<string, NormalisedQuote>>}
 */
export async function fetchQuotes(tickers) {
  const finance = await getYf();
  const results = {};

  await Promise.allSettled(
    tickers.map(async ticker => {
      try {
        const raw = await withRetry(
          () => finance.quote(ticker),
        );
        results[ticker] = normaliseQuote(raw);
      } catch (rawErr) {
        const err = rawErr instanceof ServiceError
          ? rawErr
          : classifyError(rawErr, ticker);

        results[ticker] = {
          ticker,
          name:        ticker,
          price:       null,
          open:        null,
          prevClose:   null,
          change:      null,
          pct:         null,
          pctFromOpen: null,
          high:        null,
          low:         null,
          week52High:  null,
          week52Low:   null,
          volume:      null,
          avgVolume:   null,
          marketCap:   null,
          marketState: 'CLOSED',
          error:       err.message,
        };
      }
    })
  );

  return results;
}

/**
 * Fetch historical close prices for a single ticker.
 *
 * For 'day' range, uses the Yahoo Finance `chart()` API with a 5-minute
 * interval so the intraday curve is visible in the Day view.
 * For 'week' and 'quarter', uses `historical()` with a 1-day interval.
 *
 * @param {string}                     ticker
 * @param {'day' | 'week' | 'quarter'} range
 * @returns {Promise<HistoryPoint[]>}
 */
export async function fetchHistory(ticker, range) {
  const finance             = await getYf();
  const { period1, period2 } = rangeParams(range);

  try {
    if (range === 'day') {
      // Use chart() for intraday data — returns { quotes: [{date, open, high, low, close, volume}] }
      const chart = await withRetry(() =>
        finance.chart(ticker, {
          period1,
          period2,
          interval: '5m',
        })
      );

      // Yahoo chart() wraps data under chart.quotes or chart.indicators
      const items =
        chart?.quotes ??
        chart?.indicators?.quote?.[0]?.close?.map((close, i) => ({
          date:   new Date(chart.timestamp[i] * 1000),
          close,
          open:   chart.indicators?.quote?.[0]?.open?.[i]   ?? null,
          high:   chart.indicators?.quote?.[0]?.high?.[i]   ?? null,
          low:    chart.indicators?.quote?.[0]?.low?.[i]    ?? null,
          volume: chart.indicators?.quote?.[0]?.volume?.[i] ?? null,
        })) ?? [];

      return normaliseHistory(ticker, items);
    }

    // Daily / quarterly — use historical()
    const raw = await withRetry(() =>
      finance.historical(ticker, {
        period1,
        period2,
        interval: '1d',
      })
    );

    return normaliseHistory(ticker, raw);

  } catch (rawErr) {
    const err = rawErr instanceof ServiceError
      ? rawErr
      : classifyError(rawErr, ticker);
    throw err;
  }
}

/**
 * Fetch a richer fundamentals snapshot for a single ticker using
 * yahoo-finance2's `quoteSummary()` endpoint.
 *
 * Returns selected modules merged into a flat object alongside a
 * normalised quote so consumers have one call for everything they need.
 *
 * @param {string} ticker
 * @returns {Promise<QuoteSummary>}
 */
export async function fetchQuoteSummary(ticker) {
  const finance = await getYf();

  try {
    const [quote, summary] = await Promise.all([
      withRetry(() => finance.quote(ticker)),
      withRetry(() =>
        finance.quoteSummary(ticker, {
          modules: ['summaryDetail', 'financialData', 'defaultKeyStatistics'],
        })
      ),
    ]);

    const base = normaliseQuote(quote);

    return {
      ...base,
      // summaryDetail
      trailingPE:   summary?.summaryDetail?.trailingPE       ?? null,
      forwardPE:    summary?.summaryDetail?.forwardPE        ?? null,
      dividendYield: summary?.summaryDetail?.dividendYield   ?? null,
      // financialData
      revenueGrowth:      summary?.financialData?.revenueGrowth      ?? null,
      grossMargins:       summary?.financialData?.grossMargins        ?? null,
      returnOnEquity:     summary?.financialData?.returnOnEquity      ?? null,
      // defaultKeyStatistics
      beta:               summary?.defaultKeyStatistics?.beta         ?? null,
      enterpriseValue:    summary?.defaultKeyStatistics?.enterpriseValue ?? null,
      priceToBook:        summary?.defaultKeyStatistics?.priceToBook   ?? null,
    };
  } catch (rawErr) {
    const err = rawErr instanceof ServiceError
      ? rawErr
      : classifyError(rawErr, ticker);
    throw err;
  }
}
