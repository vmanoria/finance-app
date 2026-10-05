/**
 * Unit tests for companies.js
 *
 * Covers:
 *   - COMPANY_META contains IBM and all expected competitors
 *   - every entry has the required fields (name, sector, color)
 *   - every color is a valid hex string
 *   - TICKERS is derived from COMPANY_META and is in the expected order
 *   - TICKER_NAMES maps every ticker to its display name
 *   - IBM is the first ticker (primary subject of the dashboard)
 *   - adding a new entry to COMPANY_META would automatically appear in TICKERS
 */

import {
  COMPANY_META,
  TICKERS,
  TICKER_NAMES,
} from '../../src/services/companies';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

describe('COMPANY_META', () => {
  it('contains IBM', () => {
    expect(COMPANY_META).toHaveProperty('IBM');
  });

  it('contains all five tracked companies', () => {
    for (const ticker of ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']) {
      expect(COMPANY_META).toHaveProperty(ticker);
    }
  });

  it('every entry has a non-empty name', () => {
    for (const [, meta] of Object.entries(COMPANY_META)) {
      expect(typeof meta.name).toBe('string');
      expect(meta.name.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a sector field', () => {
    for (const [, meta] of Object.entries(COMPANY_META)) {
      expect(typeof meta.sector).toBe('string');
      expect(meta.sector.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a valid hex color', () => {
    for (const [ticker, meta] of Object.entries(COMPANY_META)) {
      expect(meta.color).toMatch(HEX_COLOR),
        `${ticker} color "${meta.color}" is not a valid hex color`;
    }
  });

  it('all hex colors are distinct', () => {
    const colors = Object.values(COMPANY_META).map(m => m.color.toLowerCase());
    const unique  = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });
});

describe('TICKERS', () => {
  it('is an array', () => {
    expect(Array.isArray(TICKERS)).toBe(true);
  });

  it('contains exactly the keys of COMPANY_META', () => {
    expect(TICKERS).toEqual(Object.keys(COMPANY_META));
  });

  it('IBM is the first element', () => {
    expect(TICKERS[0]).toBe('IBM');
  });

  it('has no duplicates', () => {
    expect(new Set(TICKERS).size).toBe(TICKERS.length);
  });

  it('length matches COMPANY_META entry count', () => {
    expect(TICKERS.length).toBe(Object.keys(COMPANY_META).length);
  });
});

describe('TICKER_NAMES', () => {
  it('maps every ticker to a non-empty string', () => {
    for (const ticker of TICKERS) {
      expect(typeof TICKER_NAMES[ticker]).toBe('string');
      expect(TICKER_NAMES[ticker].length).toBeGreaterThan(0);
    }
  });

  it('name matches COMPANY_META for every ticker', () => {
    for (const ticker of TICKERS) {
      expect(TICKER_NAMES[ticker]).toBe(COMPANY_META[ticker].name);
    }
  });

  it('IBM maps to "IBM"', () => {
    expect(TICKER_NAMES.IBM).toBe('IBM');
  });
});
