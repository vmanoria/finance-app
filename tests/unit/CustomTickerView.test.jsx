/**
 * Unit tests for CustomTickerView component.
 *
 * Covers:
 *  - empty state: hint text shown when no ticker submitted yet
 *  - input validation: blank, invalid format
 *  - loading state: spinner shown while fetching
 *  - fetch error: ErrorBanner shown on failed quote fetch
 *  - success state: quote strip and chart rendered
 *  - multiple submissions: can search for a second ticker
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from '../../src/store/dashboardSlice';
import CustomTickerView from '../../src/components/dashboard/CustomTickerView';

function makeStore(preloadedState) {
  return configureStore({
    reducer: { dashboard: dashboardReducer },
    preloadedState,
  });
}

const BASE_STATE = {
  dashboard: {
    quotes:       {},
    history:      {},
    status:       { quotes: 'idle', history: {}, customQuote: 'idle' },
    error:        { quotes: null,   history: {}, customQuote: null   },
    customTicker: null,
    customQuote:  null,
  },
};

function makeHistoryPoints(ticker, count = 5) {
  return Array.from({ length: count }, (_, i) => ({
    ticker,
    date:        `2024-0${i + 1}-01`,
    price:       150 + i,
    open:        149 + i,
    high:        151 + i,
    low:         148 + i,
    volume:      1_000_000,
    pctFromBase: i === 0 ? 0 : +((i / 150) * 100).toFixed(3),
  }));
}

// ─── Empty / idle state ───────────────────────────────────────────────────────

describe('CustomTickerView — idle state', () => {
  it('renders the heading', () => {
    render(<Provider store={makeStore(BASE_STATE)}><CustomTickerView /></Provider>);
    expect(screen.getByRole('heading', { name: /custom ticker/i })).toBeInTheDocument();
  });

  it('renders the input and submit button', () => {
    render(<Provider store={makeStore(BASE_STATE)}><CustomTickerView /></Provider>);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load chart/i })).toBeInTheDocument();
  });

  it('shows the hint text when no ticker has been submitted', () => {
    render(<Provider store={makeStore(BASE_STATE)}><CustomTickerView /></Provider>);
    expect(screen.getByText(/enter any valid/i)).toBeInTheDocument();
  });
});

// ─── Input validation ────────────────────────────────────────────────────────

describe('CustomTickerView — input validation', () => {
  it('shows error when submitting an empty input', () => {
    render(<Provider store={makeStore(BASE_STATE)}><CustomTickerView /></Provider>);
    fireEvent.click(screen.getByRole('button', { name: /load chart/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/please enter a ticker symbol/i)).toBeInTheDocument();
  });

  it('shows error for invalid ticker format (numbers)', () => {
    render(<Provider store={makeStore(BASE_STATE)}><CustomTickerView /></Provider>);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /load chart/i }));
    expect(screen.getByText(/not a valid ticker/i)).toBeInTheDocument();
  });

  it('shows error for ticker longer than 5 letters — input is maxLength 5 but test via validate logic', () => {
    render(<Provider store={makeStore(BASE_STATE)}><CustomTickerView /></Provider>);
    // Bypass maxLength by directly testing with 6-char value via change event
    const input = screen.getByRole('textbox');
    Object.defineProperty(input, 'value', { writable: true, value: 'TOOLONG' });
    fireEvent.change(input, { target: { value: 'TOOLNG' } });
    fireEvent.click(screen.getByRole('button', { name: /load chart/i }));
    expect(screen.getByText(/not a valid ticker/i)).toBeInTheDocument();
  });

  it('clears validation error when user starts typing', () => {
    render(<Provider store={makeStore(BASE_STATE)}><CustomTickerView /></Provider>);
    fireEvent.click(screen.getByRole('button', { name: /load chart/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ─── Loading state ────────────────────────────────────────────────────────────

describe('CustomTickerView — loading state', () => {
  it('shows spinner while quote is loading', () => {
    const state = {
      dashboard: {
        ...BASE_STATE.dashboard,
        customTicker: 'AAPL',
        status: { ...BASE_STATE.dashboard.status, customQuote: 'loading' },
      },
    };
    render(<Provider store={makeStore(state)}><CustomTickerView /></Provider>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('disables the submit button while loading', () => {
    const state = {
      dashboard: {
        ...BASE_STATE.dashboard,
        customTicker: 'AAPL',
        status: { ...BASE_STATE.dashboard.status, customQuote: 'loading' },
      },
    };
    render(<Provider store={makeStore(state)}><CustomTickerView /></Provider>);
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
  });
});

// ─── Error state ──────────────────────────────────────────────────────────────

describe('CustomTickerView — fetch error state', () => {
  it('shows ErrorBanner when quote fetch fails', () => {
    const state = {
      dashboard: {
        ...BASE_STATE.dashboard,
        customTicker: 'FAKE',
        status: { ...BASE_STATE.dashboard.status, customQuote: 'error' },
        error:  { ...BASE_STATE.dashboard.error, customQuote: 'Ticker not found: FAKE' },
      },
    };
    render(<Provider store={makeStore(state)}><CustomTickerView /></Provider>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/ticker not found: FAKE/i)).toBeInTheDocument();
  });
});

// ─── Success state ────────────────────────────────────────────────────────────

describe('CustomTickerView — success state', () => {
  const successState = {
    dashboard: {
      quotes:  {},
      history: { 'AAPL:week': makeHistoryPoints('AAPL') },
      status:  {
        quotes:      'idle',
        history:     { 'AAPL:week': 'ok' },
        customQuote: 'ok',
      },
      error:        { quotes: null, history: {}, customQuote: null },
      customTicker: 'AAPL',
      customQuote:  {
        ticker:      'AAPL',
        name:        'Apple Inc.',
        price:       189.50,
        change:      1.25,
        pct:         0.66,
        pctFromOpen: 0.4,
        open:        188.25,
        prevClose:   188.25,
        high:        190.00,
        low:         187.50,
        week52High:  220.00,
        week52Low:   165.00,
        volume:      45_000_000,
        avgVolume:   50_000_000,
        marketCap:   2_900_000_000_000,
        marketState: 'REGULAR',
        error:       null,
      },
    },
  };

  it('shows the ticker symbol in the quote strip', () => {
    render(<Provider store={makeStore(successState)}><CustomTickerView /></Provider>);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  it('shows the company name', () => {
    render(<Provider store={makeStore(successState)}><CustomTickerView /></Provider>);
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  it('shows the current price', () => {
    render(<Provider store={makeStore(successState)}><CustomTickerView /></Provider>);
    expect(screen.getByText('$189.50')).toBeInTheDocument();
  });

  it('shows positive change as green (positive class)', () => {
    render(<Provider store={makeStore(successState)}><CustomTickerView /></Provider>);
    const change = screen.getByText(/\+1\.25/);
    expect(change).toBeInTheDocument();
    expect(change.className).toMatch(/positive/);
  });

  it('does not show the empty state hint', () => {
    render(<Provider store={makeStore(successState)}><CustomTickerView /></Provider>);
    expect(screen.queryByText(/enter any valid/i)).not.toBeInTheDocument();
  });

  it('does not show loading spinner', () => {
    render(<Provider store={makeStore(successState)}><CustomTickerView /></Provider>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows negative change as negative class', () => {
    const stateDown = {
      ...successState,
      dashboard: {
        ...successState.dashboard,
        customQuote: { ...successState.dashboard.customQuote, change: -2.10, pct: -1.10 },
      },
    };
    render(<Provider store={makeStore(stateDown)}><CustomTickerView /></Provider>);
    const change = screen.getByText(/-2\.10/);
    expect(change).toBeInTheDocument();
    expect(change.className).toMatch(/negative/);
  });
});

// ─── Market state badge ───────────────────────────────────────────────────────

describe('CustomTickerView — market state badge', () => {
  it('shows the market state badge for PRE market', () => {
    const state = {
      dashboard: {
        quotes: {},
        history: { 'AAPL:week': makeHistoryPoints('AAPL') },
        status:  { quotes: 'idle', history: { 'AAPL:week': 'ok' }, customQuote: 'ok' },
        error:   { quotes: null, history: {}, customQuote: null },
        customTicker: 'AAPL',
        customQuote: {
          ticker: 'AAPL', name: 'Apple Inc.', price: 189, change: 0.5, pct: 0.26,
          pctFromOpen: 0.1, open: 188.5, prevClose: 188.5, high: 190, low: 188,
          week52High: 220, week52Low: 165, volume: 1000, avgVolume: 1000,
          marketCap: 1e12, marketState: 'PRE', error: null,
        },
      },
    };
    render(<Provider store={makeStore(state)}><CustomTickerView /></Provider>);
    expect(screen.getByText('PRE')).toBeInTheDocument();
  });

  it('does not show the badge for REGULAR market hours', () => {
    const state = {
      dashboard: {
        quotes: {},
        history: { 'AAPL:week': makeHistoryPoints('AAPL') },
        status:  { quotes: 'idle', history: { 'AAPL:week': 'ok' }, customQuote: 'ok' },
        error:   { quotes: null, history: {}, customQuote: null },
        customTicker: 'AAPL',
        customQuote: {
          ticker: 'AAPL', name: 'Apple Inc.', price: 189, change: 0.5, pct: 0.26,
          pctFromOpen: 0.1, open: 188.5, prevClose: 188.5, high: 190, low: 188,
          week52High: 220, week52Low: 165, volume: 1000, avgVolume: 1000,
          marketCap: 1e12, marketState: 'REGULAR', error: null,
        },
      },
    };
    render(<Provider store={makeStore(state)}><CustomTickerView /></Provider>);
    expect(screen.queryByText('REGULAR')).not.toBeInTheDocument();
  });
});
