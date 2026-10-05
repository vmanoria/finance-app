/**
 * Unit tests for mockData.js
 *
 * Covers:
 *   - getMockQuotes: output shape, positive prices, all enriched fields
 *   - getMockHistory (week): shape, ascending dates, pctFromBase on first point
 *   - getMockHistory (day): intraday intervals, all on today's date
 *   - getMockHistory (quarter): starts at quarter-start, ascending dates
 *   - Determinism: same ticker + range always produces the same series
 *   - getMockQuoteSummary: fundamentals fields present, null handling
 *   - Unknown ticker fallback: handled without throwing
 */

import {
  getMockQuotes,
  getMockHistory,
  getMockQuoteSummary,
} from '../../src/services/mockData';
import { TICKERS } from '../../src/services/companies';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ─── getMockQuotes ────────────────────────────────────────────────────────────

describe('getMockQuotes', () => {
  it('returns one NormalisedQuote per requested ticker', () => {
    const result = getMockQuotes(TICKERS);
    expect(Object.keys(result)).toHaveLength(TICKERS.length);
    for (const ticker of TICKERS) {
      expect(result[ticker]).toBeDefined();
    }
  });

  it('every quote has a positive price', () => {
    const result = getMockQuotes(TICKERS);
    for (const ticker of TICKERS) {
      expect(result[ticker].price).toBeGreaterThan(0);
    }
  });

  it('every quote includes all enriched fields', () => {
    const result = getMockQuotes(['IBM']);
    const q = result.IBM;

    expect(q.ticker).toBe('IBM');
    expect(typeof q.open).toBe('number');
    expect(typeof q.prevClose).toBe('number');
    expect(typeof q.change).toBe('number');
    expect(typeof q.pct).toBe('number');
    expect(typeof q.pctFromOpen).toBe('number');
    expect(typeof q.high).toBe('number');
    expect(typeof q.low).toBe('number');
    expect(typeof q.week52High).toBe('number');
    expect(typeof q.week52Low).toBe('number');
    expect(typeof q.volume).toBe('number');
    expect(typeof q.marketCap).toBe('number');
    expect(q.marketState).toBe('REGULAR');
    expect(q.error).toBeNull();
  });

  it('week52High > price > week52Low for all tickers', () => {
    const result = getMockQuotes(TICKERS);
    for (const ticker of TICKERS) {
      const q = result[ticker];
      expect(q.week52High).toBeGreaterThan(q.price);
      expect(q.price).toBeGreaterThan(q.week52Low);
    }
  });

  it('is deterministic — same ticker produces same price on repeated calls', () => {
    const a = getMockQuotes(['IBM']);
    const b = getMockQuotes(['IBM']);
    expect(a.IBM.price).toBe(b.IBM.price);
    expect(a.IBM.change).toBe(b.IBM.change);
  });

  it('produces distinct prices for different tickers', () => {
    const result = getMockQuotes(TICKERS);
    const prices = TICKERS.map(t => result[t].price);
    const unique = new Set(prices);
    expect(unique.size).toBe(TICKERS.length);
  });
});

// ─── getMockHistory — week range ─────────────────────────────────────────────

describe('getMockHistory (week)', () => {
  const series = getMockHistory('IBM', 'week');

  it('returns at least one point', () => {
    expect(series.length).toBeGreaterThan(0);
  });

  it('every point has required fields', () => {
    for (const p of series) {
      expect(p.ticker).toBe('IBM');
      expect(p.date).toMatch(ISO_DATE);
      expect(typeof p.price).toBe('number');
      expect(p.price).toBeGreaterThan(0);
      expect(typeof p.pctFromBase).toBe('number');
    }
  });

  it('pctFromBase is 0 on the first point', () => {
    expect(series[0].pctFromBase).toBe(0);
  });

  it('has variation in pctFromBase across the series', () => {
    const hasVariation = series.some(p => p.pctFromBase !== 0);
    expect(hasVariation).toBe(true);
  });

  it('dates are in ascending order', () => {
    for (let i = 1; i < series.length; i++) {
      expect(new Date(series[i].date).getTime()).toBeGreaterThanOrEqual(
        new Date(series[i - 1].date).getTime()
      );
    }
  });

  it('is deterministic — repeated call returns the same first price', () => {
    const again = getMockHistory('IBM', 'week');
    expect(again[0].price).toBe(series[0].price);
  });

  it('different tickers produce different series', () => {
    const ibm  = getMockHistory('IBM',  'week');
    const msft = getMockHistory('MSFT', 'week');
    expect(ibm[0].price).not.toBe(msft[0].price);
  });
});

// ─── getMockHistory — day range (intraday) ────────────────────────────────────

describe('getMockHistory (day)', () => {
  const series = getMockHistory('IBM', 'day');
  const todayStr = new Date().toISOString().slice(0, 10);

  it('returns multiple intraday points', () => {
    expect(series.length).toBeGreaterThan(1);
  });

  it('all points share today\'s date', () => {
    for (const p of series) {
      expect(p.date).toBe(todayStr);
    }
  });

  it('every point has a positive price', () => {
    for (const p of series) {
      expect(p.price).toBeGreaterThan(0);
    }
  });

  it('pctFromBase is 0 on the first point', () => {
    expect(series[0].pctFromBase).toBe(0);
  });
});

// ─── getMockHistory — quarter range ──────────────────────────────────────────

describe('getMockHistory (quarter)', () => {
  const series = getMockHistory('IBM', 'quarter');

  it('returns at least one point', () => {
    expect(series.length).toBeGreaterThan(0);
  });

  it('dates are in ascending order', () => {
    for (let i = 1; i < series.length; i++) {
      expect(new Date(series[i].date).getTime()).toBeGreaterThanOrEqual(
        new Date(series[i - 1].date).getTime()
      );
    }
  });

  it('all dates fall within the current calendar year', () => {
    const year = new Date().getFullYear().toString();
    for (const p of series) {
      expect(p.date.startsWith(year)).toBe(true);
    }
  });
});

// ─── getMockQuoteSummary ──────────────────────────────────────────────────────

describe('getMockQuoteSummary', () => {
  it('includes all base NormalisedQuote fields', () => {
    const s = getMockQuoteSummary('IBM');
    expect(s.ticker).toBe('IBM');
    expect(s.price).toBeGreaterThan(0);
    expect(s.marketState).toBe('REGULAR');
    expect(s.error).toBeNull();
  });

  it('includes IBM fundamentals', () => {
    const s = getMockQuoteSummary('IBM');
    expect(s.trailingPE).toBeGreaterThan(0);
    expect(s.forwardPE).toBeGreaterThan(0);
    expect(s.dividendYield).toBeGreaterThan(0);
    expect(s.beta).toBeGreaterThan(0);
    expect(typeof s.revenueGrowth).toBe('number');
    expect(typeof s.grossMargins).toBe('number');
  });

  it('CRM dividendYield is null (no dividend)', () => {
    expect(getMockQuoteSummary('CRM').dividendYield).toBeNull();
  });

  it('ORCL returnOnEquity is null', () => {
    expect(getMockQuoteSummary('ORCL').returnOnEquity).toBeNull();
  });

  it('does not throw for an unknown ticker', () => {
    expect(() => getMockQuoteSummary('UNKNOWN')).not.toThrow();
  });
});
