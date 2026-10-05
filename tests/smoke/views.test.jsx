/**
 * Smoke tests — render each dashboard view without crashing.
 * Uses a pre-populated Redux store with mock data matching the full
 * NormalisedQuote shape (including fields added in the data layer upgrade).
 */

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from '../../src/store/dashboardSlice';
import DayView from '../../src/components/dashboard/DayView';
import WeekView from '../../src/components/dashboard/WeekView';
import QuarterView from '../../src/components/dashboard/QuarterView';
import CustomTickerView from '../../src/components/dashboard/CustomTickerView';

function makeStore(preloadedState) {
  return configureStore({
    reducer: { dashboard: dashboardReducer },
    preloadedState,
  });
}

// Full NormalisedQuote shape (mirrors what the data layer now produces)
function makeQuote(ticker, name, price, change, pct) {
  return {
    ticker, name, price, change, pct,
    open:        price - 0.5,
    prevClose:   price - change,
    pctFromOpen: 0.1,
    high:        price + 1.0,
    low:         price - 1.0,
    week52High:  price * 1.25,
    week52Low:   price * 0.78,
    volume:      4_500_000,
    avgVolume:   5_000_000,
    marketCap:   price * 1_200_000,
    marketState: 'REGULAR',
    error:       null,
  };
}

const mockQuotes = {
  IBM:  makeQuote('IBM',  'IBM',        180.5,  1.25,  0.7),
  MSFT: makeQuote('MSFT', 'Microsoft',  415.3, -2.10, -0.5),
  ORCL: makeQuote('ORCL', 'Oracle',     125.8,  0.50,  0.4),
  SAP:  makeQuote('SAP',  'SAP',        195.4,  1.00,  0.5),
  CRM:  makeQuote('CRM',  'Salesforce', 275.6, -0.90, -0.3),
};

// History points with pctFromBase set (as normaliseHistory now produces)
const mockHistoryPoints = (ticker, count = 5) =>
  Array.from({ length: count }, (_, i) => ({
    ticker,
    date:        `2024-0${i + 1}-01`,
    price:       180 + i,
    open:        179 + i,
    high:        181 + i,
    low:         178 + i,
    volume:      3_000_000,
    pctFromBase: i === 0 ? 0 : +((i / 180) * 100).toFixed(3),
  }));

const mockHistory = {
  'IBM:day':      mockHistoryPoints('IBM', 10),
  'MSFT:day':     mockHistoryPoints('MSFT', 10),
  'ORCL:day':     mockHistoryPoints('ORCL', 10),
  'SAP:day':      mockHistoryPoints('SAP', 10),
  'CRM:day':      mockHistoryPoints('CRM', 10),
  'IBM:week':     mockHistoryPoints('IBM'),
  'MSFT:week':    mockHistoryPoints('MSFT'),
  'ORCL:week':    mockHistoryPoints('ORCL'),
  'SAP:week':     mockHistoryPoints('SAP'),
  'CRM:week':     mockHistoryPoints('CRM'),
  'IBM:quarter':  mockHistoryPoints('IBM', 10),
  'MSFT:quarter': mockHistoryPoints('MSFT', 10),
  'ORCL:quarter': mockHistoryPoints('ORCL', 10),
  'SAP:quarter':  mockHistoryPoints('SAP', 10),
  'CRM:quarter':  mockHistoryPoints('CRM', 10),
};

const mockStatus = {
  quotes: 'ok',
  history: Object.fromEntries(
    Object.keys(mockHistory).map(k => [k, 'ok'])
  ),
};

const preloadedState = {
  dashboard: {
    quotes:       mockQuotes,
    history:      mockHistory,
    status:       { ...mockStatus, customQuote: 'idle' },
    error:        { quotes: null, history: {}, customQuote: null },
    customTicker: null,
    customQuote:  null,
  },
};

// ─── DayView ──────────────────────────────────────────────────────────────────

describe('DayView smoke test', () => {
  it('renders without crashing and shows ticker symbols', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><DayView /></Provider>);
    // IBM appears in both Featured and Competitors labels; use getAllByText
    expect(screen.getAllByText('IBM').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MSFT').length).toBeGreaterThan(0);
  });

  it('shows the market status badge', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><DayView /></Provider>);
    // Badge text is either "Market Open" or "Market Closed"
    expect(
      screen.getByText(/market open|market closed/i)
    ).toBeInTheDocument();
  });

  it('shows the Featured section label', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><DayView /></Provider>);
    expect(screen.getByText(/featured/i)).toBeInTheDocument();
  });

  it('shows the Competitors section label', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><DayView /></Provider>);
    expect(screen.getByText(/competitors/i)).toBeInTheDocument();
  });
});

// ─── WeekView ─────────────────────────────────────────────────────────────────

describe('WeekView smoke test', () => {
  it('renders without crashing and shows section heading', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><WeekView /></Provider>);
    expect(screen.getByRole('heading', { name: /last 7 days/i, level: 2 })).toBeInTheDocument();
  });

  it('shows the 7-day performance strip label', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><WeekView /></Provider>);
    expect(screen.getByText(/7-day performance/i)).toBeInTheDocument();
  });
});

// ─── QuarterView ──────────────────────────────────────────────────────────────

describe('QuarterView smoke test', () => {
  it('renders without crashing and shows section heading', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><QuarterView /></Provider>);
    expect(screen.getByRole('heading', { name: /last quarter/i })).toBeInTheDocument();
  });

  it('shows the quarter period badge', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><QuarterView /></Provider>);
    // currentQuarterLabel returns e.g. "Q2 2025 to date"
    expect(screen.getByText(/Q[1-4] \d{4} to date/)).toBeInTheDocument();
  });

  it('shows the performance ranking table label', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><QuarterView /></Provider>);
    expect(screen.getByText(/performance ranking/i)).toBeInTheDocument();
  });

  it('renders the ranking table with IBM', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><QuarterView /></Provider>);
    expect(screen.getAllByText('IBM').length).toBeGreaterThan(0);
  });
});

// ─── CustomTickerView ─────────────────────────────────────────────────────────

describe('CustomTickerView smoke test', () => {
  it('renders without crashing and shows the heading', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><CustomTickerView /></Provider>);
    expect(screen.getByRole('heading', { name: /custom ticker/i })).toBeInTheDocument();
  });

  it('renders the ticker input and submit button', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><CustomTickerView /></Provider>);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load chart/i })).toBeInTheDocument();
  });

  it('shows hint text in idle state', () => {
    const store = makeStore(preloadedState);
    render(<Provider store={store}><CustomTickerView /></Provider>);
    expect(screen.getByText(/enter any valid/i)).toBeInTheDocument();
  });

  it('renders quote strip and chart when data is loaded', () => {
    const loadedState = {
      dashboard: {
        ...preloadedState.dashboard,
        customTicker: 'TSLA',
        customQuote: {
          ticker: 'TSLA', name: 'Tesla Inc.', price: 250.00,
          change: 3.50, pct: 1.42, pctFromOpen: 0.8,
          open: 246.50, prevClose: 246.50, high: 251, low: 245,
          week52High: 300, week52Low: 180,
          volume: 80_000_000, avgVolume: 90_000_000,
          marketCap: 800_000_000_000, marketState: 'REGULAR', error: null,
        },
        history: {
          ...preloadedState.dashboard.history,
          'TSLA:week': Array.from({ length: 5 }, (_, i) => ({
            ticker: 'TSLA', date: `2024-0${i+1}-01`,
            price: 250 + i, open: 249 + i, high: 252 + i, low: 248 + i,
            volume: 5_000_000, pctFromBase: i === 0 ? 0 : i * 0.4,
          })),
        },
        status: {
          ...preloadedState.dashboard.status,
          customQuote: 'ok',
          history: { ...preloadedState.dashboard.status.history, 'TSLA:week': 'ok' },
        },
      },
    };
    render(<Provider store={makeStore(loadedState)}><CustomTickerView /></Provider>);
    expect(screen.getByText('TSLA')).toBeInTheDocument();
    expect(screen.getByText('Tesla Inc.')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });
});
