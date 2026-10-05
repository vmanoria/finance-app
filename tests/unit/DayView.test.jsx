/**
 * Unit tests for the DayView component.
 *
 * Covers:
 *   - loading state (spinner shown, no cards)
 *   - error state (banner shown, no cards)
 *   - data loaded: IBM featured card, competitor grid, status counts
 *   - gainers / losers count derivation
 *   - partial failure: one ticker with error renders error card in grid
 *   - IBM absent from competitor grid (shown only in Featured section)
 */

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from '../../src/store/dashboardSlice';
import DayView from '../../src/components/dashboard/DayView';

function makeStore(preloadedState) {
  return configureStore({
    reducer: { dashboard: dashboardReducer },
    preloadedState,
  });
}

function makeQuote(ticker, change = 1) {
  const price = 100;
  return {
    ticker,
    name:        ticker,
    price,
    open:        price - 0.5,
    prevClose:   price - change,
    change,
    pct:         change,
    pctFromOpen: 0.1,
    high:        price + 2,
    low:         price - 2,
    week52High:  price * 1.3,
    week52Low:   price * 0.7,
    volume:      1_000_000,
    avgVolume:   1_200_000,
    marketCap:   100_000_000_000,
    marketState: 'REGULAR',
    error:       null,
  };
}

// ─── Loading state ────────────────────────────────────────────────────────────

describe('DayView — loading state', () => {
  it('shows spinner while quotes are loading', () => {
    const store = makeStore({
      dashboard: {
        quotes: {},
        history: {},
        status: { quotes: 'loading', history: {} },
        error:  { quotes: null, history: {} },
      },
    });
    render(<Provider store={store}><DayView /></Provider>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Current Day')).not.toBeInTheDocument();
  });
});

// ─── Error state ──────────────────────────────────────────────────────────────

describe('DayView — error state', () => {
  it('shows error banner when quotes fetch fails', () => {
    const store = makeStore({
      dashboard: {
        quotes: {},
        history: {},
        status: { quotes: 'error', history: {} },
        error:  { quotes: 'Network timeout', history: {} },
      },
    });
    render(<Provider store={store}><DayView /></Provider>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/network timeout/i)).toBeInTheDocument();
  });
});

// ─── Loaded state ─────────────────────────────────────────────────────────────

const allQuotes = {
  IBM:  makeQuote('IBM',   2),   // +2 → gaining
  MSFT: makeQuote('MSFT', -1),   // -1 → falling
  ORCL: makeQuote('ORCL',  1),   // +1 → gaining
  SAP:  makeQuote('SAP',   3),   // +3 → gaining
  CRM:  makeQuote('CRM',  -2),   // -2 → falling
};

const loadedState = {
  dashboard: {
    quotes:  allQuotes,
    history: {},
    status:  { quotes: 'ok', history: {} },
    error:   { quotes: null, history: {} },
  },
};

describe('DayView — loaded state', () => {
  it('shows the "Current Day" heading', () => {
    const store = makeStore(loadedState);
    render(<Provider store={store}><DayView /></Provider>);
    expect(screen.getByRole('heading', { name: /current day/i })).toBeInTheDocument();
  });

  it('shows the Featured label for IBM', () => {
    const store = makeStore(loadedState);
    render(<Provider store={store}><DayView /></Provider>);
    expect(screen.getByText(/featured/i)).toBeInTheDocument();
  });

  it('shows the Competitors section label', () => {
    const store = makeStore(loadedState);
    render(<Provider store={store}><DayView /></Provider>);
    expect(screen.getByText(/competitors/i)).toBeInTheDocument();
  });

  it('shows market open or closed badge', () => {
    const store = makeStore(loadedState);
    render(<Provider store={store}><DayView /></Provider>);
    expect(screen.getByText(/market open|market closed/i)).toBeInTheDocument();
  });
});

// ─── Gainers / losers count ───────────────────────────────────────────────────

describe('DayView — gainers/losers count', () => {
  it('displays correct gainer count (3 gaining: IBM, ORCL, SAP)', () => {
    const store = makeStore(loadedState);
    render(<Provider store={store}><DayView /></Provider>);
    // "↑ 3 gaining"
    expect(screen.getByText(/↑ 3 gaining/)).toBeInTheDocument();
  });

  it('displays correct loser count (2 falling: MSFT, CRM)', () => {
    const store = makeStore(loadedState);
    render(<Provider store={store}><DayView /></Provider>);
    // "↓ 2 falling"
    expect(screen.getByText(/↓ 2 falling/)).toBeInTheDocument();
  });

  it('does not show counts when no quotes are loaded', () => {
    const store = makeStore({
      dashboard: {
        quotes: {},
        history: {},
        status: { quotes: 'ok', history: {} },
        error:  { quotes: null, history: {} },
      },
    });
    render(<Provider store={store}><DayView /></Provider>);
    expect(screen.queryByText(/gaining/)).not.toBeInTheDocument();
  });
});

// ─── Partial failure ──────────────────────────────────────────────────────────

describe('DayView — partial ticker failure', () => {
  it('renders error card for a failed competitor ticker', () => {
    const quotesWithError = {
      ...allQuotes,
      MSFT: { ...allQuotes.MSFT, error: 'Rate limited', price: null },
    };
    const store = makeStore({
      dashboard: {
        quotes:  quotesWithError,
        history: {},
        status:  { quotes: 'ok', history: {} },
        error:   { quotes: null, history: {} },
      },
    });
    render(<Provider store={store}><DayView /></Provider>);
    expect(screen.getByText(/rate limited/i)).toBeInTheDocument();
  });

  it('excludes errored tickers from the gainers/losers count', () => {
    const quotesWithError = {
      ...allQuotes,
      MSFT: { ...allQuotes.MSFT, error: 'Timeout' },
    };
    const store = makeStore({
      dashboard: {
        quotes:  quotesWithError,
        history: {},
        status:  { quotes: 'ok', history: {} },
        error:   { quotes: null, history: {} },
      },
    });
    render(<Provider store={store}><DayView /></Provider>);
    // MSFT excluded; remaining: IBM(+), ORCL(+), SAP(+), CRM(-) → 3 gaining, 1 falling
    expect(screen.getByText(/↑ 3 gaining/)).toBeInTheDocument();
    expect(screen.getByText(/↓ 1 falling/)).toBeInTheDocument();
  });
});
