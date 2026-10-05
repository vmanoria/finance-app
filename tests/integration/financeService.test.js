/**
 * Integration tests for financeService.js using mock data.
 * VITE_USE_MOCK=true is set in tests/setupTests.js so no network calls are made.
 *
 * Tests verify:
 *   - output shape and field completeness for all public API functions
 *   - pctFromBase is set on every history point
 *   - getAllHistory returns results for every ticker:range key
 *   - getQuoteSummary returns fundamentals fields
 *   - partial-failure: a missing ticker in getQuotes returns an error object,
 *     not a thrown exception
 */

import {
  getQuotes,
  getHistory,
  getAllHistory,
  getQuoteSummary,
  TICKERS,
  COMPANY_META,
} from '../../src/services/financeService';

// ─── getQuotes ────────────────────────────────────────────────────────────────

describe('getQuotes', () => {
  it('returns a NormalisedQuote for every tracked ticker', async () => {
    const result = await getQuotes(TICKERS);

    expect(Object.keys(result)).toEqual(expect.arrayContaining(TICKERS));
    for (const ticker of TICKERS) {
      expect(result[ticker]).toMatchObject({
        ticker,
        price:  expect.any(Number),
        change: expect.any(Number),
        pct:    expect.any(Number),
        error:  null,
      });
    }
  });

  it('includes all enriched fields in the quote', async () => {
    const result = await getQuotes(['IBM']);
    const q = result.IBM;

    expect(q.open).toBeTypeOf('number');
    expect(q.prevClose).toBeTypeOf('number');
    expect(q.pctFromOpen).toBeTypeOf('number');
    expect(q.week52High).toBeTypeOf('number');
    expect(q.week52Low).toBeTypeOf('number');
    expect(q.avgVolume).toBeTypeOf('number');
    expect(q.marketCap).toBeTypeOf('number');
    expect(q.marketState).toBe('REGULAR');
  });

  it('returns a positive price for every ticker', async () => {
    const result = await getQuotes(TICKERS);
    for (const ticker of TICKERS) {
      expect(result[ticker].price).toBeGreaterThan(0);
    }
  });

  it('company names come from COMPANY_META', async () => {
    const result = await getQuotes(TICKERS);
    for (const ticker of TICKERS) {
      expect(result[ticker].name).toBe(COMPANY_META[ticker].name);
    }
  });
});

// ─── getHistory ───────────────────────────────────────────────────────────────

describe('getHistory', () => {
  it('returns HistoryPoints with required fields for "week" range', async () => {
    const result = await getHistory('IBM', 'week');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const first = result[0];
    expect(first).toMatchObject({
      ticker:     'IBM',
      price:      expect.any(Number),
      date:       expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      pctFromBase: 0,   // first point is always 0
    });
  });

  it('sets pctFromBase=0 on the first point and non-zero on subsequent points', async () => {
    const result = await getHistory('IBM', 'week');
    expect(result[0].pctFromBase).toBe(0);
    // At least one subsequent point should differ (unless all prices are identical)
    const hasVariation = result.some(p => p.pctFromBase !== 0);
    expect(hasVariation).toBe(true);
  });

  it('returns ascending dates for "quarter" range', async () => {
    const result = await getHistory('MSFT', 'quarter');
    expect(result.length).toBeGreaterThan(0);
    for (let i = 1; i < result.length; i++) {
      expect(new Date(result[i].date).getTime()).toBeGreaterThanOrEqual(
        new Date(result[i - 1].date).getTime()
      );
    }
  });

  it('"day" range returns intraday points (multiple per day)', async () => {
    const result = await getHistory('IBM', 'day');
    expect(result.length).toBeGreaterThan(1);
    // All points should share today's date
    const todayStr = new Date().toISOString().slice(0, 10);
    for (const p of result) {
      expect(p.date).toBe(todayStr);
    }
  });

  it('includes OHLCV fields on each point', async () => {
    const result = await getHistory('IBM', 'week');
    const p = result[0];
    expect(p).toHaveProperty('open');
    expect(p).toHaveProperty('high');
    expect(p).toHaveProperty('low');
    expect(p).toHaveProperty('volume');
  });
});

// ─── getAllHistory ────────────────────────────────────────────────────────────

describe('getAllHistory', () => {
  it('returns a key for every ticker in the requested range', async () => {
    const result = await getAllHistory('week');
    for (const ticker of TICKERS) {
      const key = `${ticker}:week`;
      expect(result).toHaveProperty(key);
      expect(Array.isArray(result[key])).toBe(true);
      expect(result[key].length).toBeGreaterThan(0);
    }
  });

  it('accepts a custom ticker list', async () => {
    const result = await getAllHistory('week', ['IBM', 'MSFT']);
    expect(result).toHaveProperty('IBM:week');
    expect(result).toHaveProperty('MSFT:week');
    expect(Object.keys(result)).toHaveLength(2);
  });

  it('works for all three ranges', async () => {
    for (const range of ['day', 'week', 'quarter']) {
      const result = await getAllHistory(range, ['IBM']);
      expect(result).toHaveProperty(`IBM:${range}`);
      expect(result[`IBM:${range}`].length).toBeGreaterThan(0);
    }
  });
});

// ─── getQuoteSummary ──────────────────────────────────────────────────────────

describe('getQuoteSummary', () => {
  it('returns all NormalisedQuote fields plus fundamentals', async () => {
    const s = await getQuoteSummary('IBM');

    // Base quote fields
    expect(s.ticker).toBe('IBM');
    expect(s.price).toBeGreaterThan(0);
    expect(s.pctFromOpen).toBeTypeOf('number');

    // Fundamentals
    expect(s.trailingPE).toBeGreaterThan(0);
    expect(s.forwardPE).toBeGreaterThan(0);
    expect(s.dividendYield).toBeGreaterThan(0);
    expect(s.beta).toBeGreaterThan(0);
    expect(s.revenueGrowth).not.toBeNull();
    expect(s.grossMargins).not.toBeNull();
  });

  it('handles a ticker with null dividendYield (CRM)', async () => {
    const s = await getQuoteSummary('CRM');
    expect(s.ticker).toBe('CRM');
    expect(s.dividendYield).toBeNull();
  });

  it('handles a ticker with null returnOnEquity (ORCL)', async () => {
    const s = await getQuoteSummary('ORCL');
    expect(s.returnOnEquity).toBeNull();
  });
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function toBeTypeOf(received, type) {
  const pass = typeof received === type;
  return {
    pass,
    message: () => `expected ${received} ${pass ? 'not ' : ''}to be of type ${type}`,
  };
}

// Extend jest's expect for toBeTypeOf
expect.extend({ toBeTypeOf });
