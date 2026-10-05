/**
 * companies.js
 *
 * Single source of truth for the companies tracked by the dashboard.
 * Extracted into its own module to avoid a circular dependency between
 * financeService.js (which imports mockData.js) and mockData.js.
 *
 * ─── Extending the company list ──────────────────────────────────────────────
 * 1. Add an entry to COMPANY_META below.
 * 2. That is the only code change required — TICKERS and TICKER_NAMES are
 *    derived automatically, and all service / UI layers iterate TICKERS.
 */

export const COMPANY_META = {
  IBM:  { name: 'IBM',        sector: 'Technology', color: '#3b82d4' },
  MSFT: { name: 'Microsoft',  sector: 'Technology', color: '#7c5cd8' },
  ORCL: { name: 'Oracle',     sector: 'Technology', color: '#e05b2e' },
  SAP:  { name: 'SAP',        sector: 'Technology', color: '#15803d' },
  CRM:  { name: 'Salesforce', sector: 'Technology', color: '#b45309' },
};

/** Ordered list of tracked ticker symbols (IBM first). */
export const TICKERS = Object.keys(COMPANY_META);

/** Convenience map of ticker → display name. */
export const TICKER_NAMES = Object.fromEntries(
  Object.entries(COMPANY_META).map(([t, m]) => [t, m.name])
);
