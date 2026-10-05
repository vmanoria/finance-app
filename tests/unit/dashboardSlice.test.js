/**
 * Unit tests for dashboardSlice reducer
 */

import reducer, {
  resetQuotes,
  resetHistory,
  fetchQuotes,
  fetchHistory,
  fetchCustomQuote,
  setCustomTicker,
} from '../../src/store/dashboardSlice';

const INITIAL = {
  quotes:       {},
  history:      {},
  status:       { quotes: 'idle', history: {}, customQuote: 'idle' },
  error:        { quotes: null,   history: {}, customQuote: null   },
  customTicker: null,
  customQuote:  null,
};

describe('dashboardSlice reducer', () => {
  it('returns initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(INITIAL);
  });

  it('resetQuotes clears quotes and sets status to idle', () => {
    const state = {
      ...INITIAL,
      quotes: { IBM: { price: 180 } },
      status: { ...INITIAL.status, quotes: 'ok' },
    };
    const next = reducer(state, resetQuotes());
    expect(next.quotes).toEqual({});
    expect(next.status.quotes).toBe('idle');
    expect(next.error.quotes).toBeNull();
  });

  it('resetHistory removes a specific key', () => {
    const state = {
      ...INITIAL,
      history: { 'IBM:week': [{ price: 180 }] },
      status:  { ...INITIAL.status, history: { 'IBM:week': 'ok' } },
      error:   { ...INITIAL.error,  history: { 'IBM:week': null } },
    };
    const next = reducer(state, resetHistory('IBM:week'));
    expect(next.history['IBM:week']).toBeUndefined();
    expect(next.status.history['IBM:week']).toBeUndefined();
  });

  it('fetchQuotes.pending sets quotes status to loading', () => {
    const next = reducer(INITIAL, { type: fetchQuotes.pending.type });
    expect(next.status.quotes).toBe('loading');
    expect(next.error.quotes).toBeNull();
  });

  it('fetchQuotes.fulfilled stores quotes and sets status to ok', () => {
    const payload = { IBM: { ticker: 'IBM', price: 180 } };
    const next = reducer(INITIAL, { type: fetchQuotes.fulfilled.type, payload });
    expect(next.status.quotes).toBe('ok');
    expect(next.quotes.IBM.price).toBe(180);
  });

  it('fetchQuotes.rejected stores error message', () => {
    const next = reducer(INITIAL, {
      type: fetchQuotes.rejected.type,
      payload: 'Network error',
    });
    expect(next.status.quotes).toBe('error');
    expect(next.error.quotes).toBe('Network error');
  });

  it('fetchHistory.pending sets history key status to loading', () => {
    const next = reducer(INITIAL, {
      type: fetchHistory.pending.type,
      meta: { arg: { ticker: 'IBM', range: 'week' } },
    });
    expect(next.status.history['IBM:week']).toBe('loading');
  });

  it('fetchHistory.fulfilled stores history data', () => {
    const payload = { key: 'IBM:week', data: [{ date: '2024-01-01', price: 180 }] };
    const next = reducer(INITIAL, { type: fetchHistory.fulfilled.type, payload });
    expect(next.status.history['IBM:week']).toBe('ok');
    expect(next.history['IBM:week']).toHaveLength(1);
  });

  it('fetchHistory.rejected stores error for specific key', () => {
    const next = reducer(INITIAL, {
      type: fetchHistory.rejected.type,
      payload: { key: 'IBM:week', message: 'timeout' },
    });
    expect(next.status.history['IBM:week']).toBe('error');
    expect(next.error.history['IBM:week']).toBe('timeout');
  });
});

// ─── setCustomTicker ──────────────────────────────────────────────────────────

describe('dashboardSlice — setCustomTicker', () => {
  it('stores the ticker and resets custom state', () => {
    const state = {
      ...INITIAL,
      customTicker: 'IBM',
      customQuote:  { ticker: 'IBM', price: 180 },
      status: { ...INITIAL.status, customQuote: 'ok' },
    };
    const next = reducer(state, setCustomTicker('AAPL'));
    expect(next.customTicker).toBe('AAPL');
    expect(next.customQuote).toBeNull();
    expect(next.status.customQuote).toBe('idle');
    expect(next.error.customQuote).toBeNull();
  });

  it('clears __custom__ prefixed history keys', () => {
    const state = {
      ...INITIAL,
      history: { '__custom__:week': [{ price: 100 }], 'IBM:week': [{ price: 180 }] },
      status: {
        ...INITIAL.status,
        history: { '__custom__:week': 'ok', 'IBM:week': 'ok' },
      },
      error: { ...INITIAL.error, history: { '__custom__:week': null } },
    };
    const next = reducer(state, setCustomTicker('TSLA'));
    expect(next.history['__custom__:week']).toBeUndefined();
    // pre-existing non-custom history must not be affected
    expect(next.history['IBM:week']).toBeDefined();
  });

  it('accepts null to clear the custom ticker', () => {
    const state = { ...INITIAL, customTicker: 'AAPL' };
    const next = reducer(state, setCustomTicker(null));
    expect(next.customTicker).toBeNull();
  });
});

// ─── fetchCustomQuote thunk lifecycle ─────────────────────────────────────────

describe('dashboardSlice — fetchCustomQuote', () => {
  it('pending: sets customQuote status to loading and clears quote', () => {
    const state = {
      ...INITIAL,
      customQuote: { ticker: 'OLD', price: 100 },
      status: { ...INITIAL.status, customQuote: 'ok' },
    };
    const next = reducer(state, { type: fetchCustomQuote.pending.type });
    expect(next.status.customQuote).toBe('loading');
    expect(next.error.customQuote).toBeNull();
    expect(next.customQuote).toBeNull();
  });

  it('fulfilled: stores quote and sets status to ok', () => {
    const payload = { ticker: 'AAPL', name: 'Apple Inc.', price: 189.5 };
    const next = reducer(INITIAL, { type: fetchCustomQuote.fulfilled.type, payload });
    expect(next.status.customQuote).toBe('ok');
    expect(next.customQuote).toEqual(payload);
  });

  it('rejected: stores error message and sets status to error', () => {
    const next = reducer(INITIAL, {
      type:    fetchCustomQuote.rejected.type,
      payload: 'Ticker not found: FAKE',
    });
    expect(next.status.customQuote).toBe('error');
    expect(next.error.customQuote).toBe('Ticker not found: FAKE');
  });

  it('rejected without payload falls back to action.error.message', () => {
    const next = reducer(INITIAL, {
      type:  fetchCustomQuote.rejected.type,
      error: { message: 'Unknown error' },
    });
    expect(next.status.customQuote).toBe('error');
    expect(next.error.customQuote).toBe('Unknown error');
  });
});
