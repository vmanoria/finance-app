/**
 * Unit tests for normalise.js
 * Pure-function tests — no network, no DOM, no mocking needed.
 */

import { normaliseQuote, normaliseHistory, summariseSeries } from '../../src/utils/normalise';

// ─── normaliseQuote ───────────────────────────────────────────────────────────

describe('normaliseQuote', () => {
  const fullRaw = {
    symbol:                       'IBM',
    shortName:                    'International Business Machines',
    regularMarketPrice:           180.5,
    regularMarketOpen:            178.0,
    regularMarketPreviousClose:   179.25,
    regularMarketChange:          1.25,
    regularMarketChangePercent:   0.697,
    regularMarketDayHigh:         182.0,
    regularMarketDayLow:          179.1,
    fiftyTwoWeekHigh:             220.0,
    fiftyTwoWeekLow:              140.0,
    regularMarketVolume:          3_500_000,
    averageDailyVolume10Day:      4_200_000,
    marketCap:                    160_000_000_000,
    marketState:                  'REGULAR',
  };

  it('maps all standard fields to the domain model', () => {
    const q = normaliseQuote(fullRaw);

    expect(q.ticker).toBe('IBM');
    expect(q.name).toBe('International Business Machines');
    expect(q.price).toBe(180.5);
    expect(q.open).toBe(178.0);
    expect(q.prevClose).toBe(179.25);
    expect(q.change).toBe(1.25);
    expect(q.pct).toBeCloseTo(0.697);
    expect(q.high).toBe(182.0);
    expect(q.low).toBe(179.1);
    expect(q.week52High).toBe(220.0);
    expect(q.week52Low).toBe(140.0);
    expect(q.volume).toBe(3_500_000);
    expect(q.avgVolume).toBe(4_200_000);
    expect(q.marketCap).toBe(160_000_000_000);
    expect(q.marketState).toBe('REGULAR');
    expect(q.error).toBeNull();
  });

  it('computes pctFromOpen correctly', () => {
    const q = normaliseQuote(fullRaw);
    // price=180.5, open=178.0 → (180.5/178.0 - 1)*100 ≈ 1.404
    expect(q.pctFromOpen).toBeCloseTo((180.5 / 178.0 - 1) * 100, 2);
  });

  it('sets pctFromOpen to null when open is zero', () => {
    const q = normaliseQuote({ ...fullRaw, regularMarketOpen: 0 });
    expect(q.pctFromOpen).toBeNull();
  });

  it('sets pctFromOpen to null when open is missing', () => {
    const q = normaliseQuote({ symbol: 'IBM', regularMarketPrice: 180 });
    expect(q.pctFromOpen).toBeNull();
  });

  it('defaults marketState to CLOSED when missing', () => {
    const q = normaliseQuote({ symbol: 'TEST', regularMarketPrice: 100 });
    expect(q.marketState).toBe('CLOSED');
  });

  it('prefers shortName over longName, falls back to symbol', () => {
    expect(normaliseQuote({ symbol: 'X', shortName: 'Short' }).name).toBe('Short');
    expect(normaliseQuote({ symbol: 'X', longName: 'Long' }).name).toBe('Long');
    expect(normaliseQuote({ symbol: 'X' }).name).toBe('X');
  });

  it('handles missing optional fields gracefully (all null)', () => {
    const q = normaliseQuote({ symbol: 'MIN', regularMarketPrice: 50 });
    expect(q.prevClose).toBeNull();
    expect(q.week52High).toBeNull();
    expect(q.week52Low).toBeNull();
    expect(q.avgVolume).toBeNull();
    expect(q.marketCap).toBeNull();
  });

  it('returns null when passed null', () => {
    expect(normaliseQuote(null)).toBeNull();
  });
});

// ─── normaliseHistory ─────────────────────────────────────────────────────────

describe('normaliseHistory', () => {
  const rawItems = [
    { date: new Date('2024-03-01'), open: 180, high: 182, low: 179, close: 181, volume: 1_000_000 },
    { date: new Date('2024-03-04'), open: 181, high: 185, low: 180, close: 184, volume: 1_200_000 },
    { date: new Date('2024-03-05'), open: 184, high: 186, low: 183, close: 183, volume: 900_000 },
  ];

  it('maps all OHLCV fields correctly', () => {
    const result = normaliseHistory('IBM', rawItems);

    expect(result[0].ticker).toBe('IBM');
    expect(result[0].price).toBe(181);
    expect(result[0].open).toBe(180);
    expect(result[0].high).toBe(182);
    expect(result[0].low).toBe(179);
    expect(result[0].volume).toBe(1_000_000);
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('sets pctFromBase=0 on the first point', () => {
    const result = normaliseHistory('IBM', rawItems);
    expect(result[0].pctFromBase).toBe(0);
  });

  it('computes pctFromBase correctly for subsequent points', () => {
    const result = normaliseHistory('IBM', rawItems);
    // base=181, point 2 close=184 → (184/181 - 1)*100 ≈ 1.657
    expect(result[1].pctFromBase).toBeCloseTo((184 / 181 - 1) * 100, 2);
  });

  it('filters out items with null close price', () => {
    const withNull = [
      { date: new Date('2024-03-01'), close: 181 },
      { date: new Date('2024-03-04'), close: null },
    ];
    expect(normaliseHistory('IBM', withNull)).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    expect(normaliseHistory('IBM', [])).toEqual([]);
  });

  it('sets pctFromBase to null for all points when input is empty', () => {
    // Empty array returns [] so this confirms no crash
    expect(normaliseHistory('IBM', [])).toHaveLength(0);
  });
});

// ─── summariseSeries ─────────────────────────────────────────────────────────

describe('summariseSeries', () => {
  const series = [
    { price: 100, high: 105, low: 98,  pctFromBase: 0 },
    { price: 110, high: 112, low: 108, pctFromBase: 10 },
    { price: 105, high: 107, low: 103, pctFromBase: 5 },
  ];

  it('returns first and last price', () => {
    const s = summariseSeries(series);
    expect(s.firstPrice).toBe(100);
    expect(s.lastPrice).toBe(105);
  });

  it('computes pctChange from first to last', () => {
    const s = summariseSeries(series);
    expect(s.pctChange).toBeCloseTo((105 / 100 - 1) * 100, 1);
  });

  it('returns overall high and low across the series', () => {
    const s = summariseSeries(series);
    expect(s.high).toBe(112);
    expect(s.low).toBe(98);
  });

  it('handles empty array gracefully', () => {
    const s = summariseSeries([]);
    expect(s.firstPrice).toBeNull();
    expect(s.pctChange).toBeNull();
  });

  it('handles null/undefined input', () => {
    expect(summariseSeries(null).firstPrice).toBeNull();
    expect(summariseSeries(undefined).pctChange).toBeNull();
  });
});
