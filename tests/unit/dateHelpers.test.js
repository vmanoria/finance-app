/**
 * Unit tests for dateHelpers.js
 */

import {
  today, daysAgo, rangeParams, formatDate,
  isMarketOpen, currentQuarterStart, currentQuarterLabel, rangeLabel,
} from '../../src/utils/dateHelpers';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ─── Basic helpers ────────────────────────────────────────────────────────────

describe('today', () => {
  it('returns a YYYY-MM-DD string matching today', () => {
    const result = today();
    expect(result).toMatch(ISO_DATE);
    expect(result).toBe(new Date().toISOString().slice(0, 10));
  });
});

describe('daysAgo', () => {
  it('returns a date N days in the past', () => {
    const result = daysAgo(7);
    expect(result).toMatch(ISO_DATE);
    const diff = (new Date(today()) - new Date(result)) / (1000 * 60 * 60 * 24);
    expect(diff).toBe(7);
  });
});

describe('formatDate', () => {
  it('formats a Date to YYYY-MM-DD', () => {
    const d = new Date('2024-06-15T12:00:00Z');
    expect(formatDate(d)).toBe('2024-06-15');
  });

  it('formats a timestamp number', () => {
    const ts = new Date('2024-01-01T00:00:00Z').getTime();
    expect(formatDate(ts)).toBe('2024-01-01');
  });
});

// ─── rangeParams ──────────────────────────────────────────────────────────────

describe('rangeParams', () => {
  it('returns valid start/end objects for "week" range', () => {
    const { startDate, endDate, period1, period2 } = rangeParams('week');
    expect(startDate).toMatch(ISO_DATE);
    expect(endDate).toMatch(ISO_DATE);
    expect(period1).toBeInstanceOf(Date);
    expect(period2).toBeInstanceOf(Date);
    const diff = (period2 - period1) / (1000 * 60 * 60 * 24);
    expect(diff).toBeCloseTo(7, 0);
  });

  it('"quarter" starts at the first day of the current calendar quarter', () => {
    const { period1 } = rangeParams('quarter');
    const now    = new Date();
    const qStart = Math.floor(now.getMonth() / 3) * 3;
    // day-of-month should be 1, month should be the quarter start month
    expect(period1.getDate()).toBe(1);
    expect(period1.getMonth()).toBe(qStart);
    expect(period1.getFullYear()).toBe(now.getFullYear());
  });

  it('"day" starts at midnight today', () => {
    const { period1 } = rangeParams('day');
    expect(period1.getHours()).toBe(0);
    expect(period1.getMinutes()).toBe(0);
  });

  it('throws for unknown range', () => {
    expect(() => rangeParams('year')).toThrow('Unknown range');
  });
});

// ─── Market-state helpers ─────────────────────────────────────────────────────

describe('isMarketOpen', () => {
  it('returns a boolean', () => {
    expect(typeof isMarketOpen()).toBe('boolean');
  });
});

describe('currentQuarterStart', () => {
  it('returns a Date on the 1st of a quarter-start month', () => {
    const d = currentQuarterStart();
    expect(d).toBeInstanceOf(Date);
    expect(d.getDate()).toBe(1);
    expect([0, 3, 6, 9]).toContain(d.getMonth());
  });
});

describe('currentQuarterLabel', () => {
  it('returns a string like "Q2 2025"', () => {
    const label = currentQuarterLabel();
    expect(label).toMatch(/^Q[1-4] \d{4}$/);
  });
});

describe('rangeLabel', () => {
  it('returns "Today" for "day"', () => {
    expect(rangeLabel('day')).toBe('Today');
  });

  it('returns "Last 7 Days" for "week"', () => {
    expect(rangeLabel('week')).toBe('Last 7 Days');
  });

  it('returns a quarter label for "quarter"', () => {
    expect(rangeLabel('quarter')).toMatch(/^Q[1-4] \d{4}$/);
  });

  it('returns the range string unchanged for unknown ranges', () => {
    expect(rangeLabel('custom')).toBe('custom');
  });
});
