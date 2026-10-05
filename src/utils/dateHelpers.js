/**
 * dateHelpers.js
 *
 * Date and time range utilities for the finance service layer.
 * All functions are pure (no side effects) so they are straightforward to test.
 */

// ─── Basic helpers ────────────────────────────────────────────────────────────

/** Returns a YYYY-MM-DD string for today's date in UTC. */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Returns a YYYY-MM-DD string for the date N calendar days before today. */
export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Formats a Date object or any value accepted by `new Date()` to YYYY-MM-DD. */
export function formatDate(dateish) {
  return new Date(dateish).toISOString().slice(0, 10);
}

// ─── Range params ─────────────────────────────────────────────────────────────

/**
 * Returns start/end date strings and Date objects for a named time range.
 *
 * Ranges:
 *   'day'     — from market open of the current trading day to now
 *               (used with a 5-minute intraday interval)
 *   'week'    — rolling 7 calendar days ending now
 *   'quarter' — start of the current calendar quarter to now
 *               (e.g. 1 Jan, 1 Apr, 1 Jul, 1 Oct)
 *
 * @param {'day' | 'week' | 'quarter'} range
 * @returns {{ startDate: string, endDate: string, period1: Date, period2: Date }}
 */
export function rangeParams(range) {
  const now = new Date();
  const end = now;
  let start;

  switch (range) {
    case 'day':
      // Start at midnight local time so the full trading day is covered
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;

    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      break;

    case 'quarter': {
      // Use the beginning of the current calendar quarter rather than a
      // rolling 90 days.  This gives a consistent "Q1 / Q2 / Q3 / Q4" view
      // regardless of when in the quarter the app is opened.
      const month         = now.getMonth();                   // 0–11
      const quarterStart  = Math.floor(month / 3) * 3;       // 0, 3, 6, 9
      start = new Date(now.getFullYear(), quarterStart, 1);
      break;
    }

    default:
      throw new Error(`Unknown range: ${range}`);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate:   end.toISOString().slice(0, 10),
    period1:   start,
    period2:   end,
  };
}

// ─── Market-state helpers ─────────────────────────────────────────────────────

/**
 * NYSE / NASDAQ regular session: 09:30–16:00 Eastern Time, Mon–Fri.
 * Returns true if the current moment falls inside regular trading hours.
 *
 * Note: this is a best-effort browser-side check and does not account for
 * market holidays.  It is used only to decide whether to show a "market open"
 * indicator badge in the UI.
 */
export function isMarketOpen() {
  const now = new Date();

  // Get current time in America/New_York
  const nyStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const ny    = new Date(nyStr);

  const day    = ny.getDay();         // 0 = Sunday
  const hour   = ny.getHours();
  const minute = ny.getMinutes();
  const mins   = hour * 60 + minute;  // minutes since midnight ET

  // Mon–Fri, 09:30–16:00 ET
  return day >= 1 && day <= 5 && mins >= 9 * 60 + 30 && mins < 16 * 60;
}

/**
 * Returns the beginning of the current calendar quarter as a Date.
 * Useful for display labels ("Q2 2025 to date").
 */
export function currentQuarterStart() {
  const now          = new Date();
  const quarterStart = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), quarterStart, 1);
}

/**
 * Returns a human-readable label for the current calendar quarter.
 * e.g. "Q2 2025"
 */
export function currentQuarterLabel() {
  const now     = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `Q${quarter} ${now.getFullYear()}`;
}

/**
 * Returns a human-readable label for a named range, used in UI headings.
 * @param {'day'|'week'|'quarter'} range
 */
export function rangeLabel(range) {
  switch (range) {
    case 'day':     return 'Today';
    case 'week':    return 'Last 7 Days';
    case 'quarter': return currentQuarterLabel();
    default:        return range;
  }
}
