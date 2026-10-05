/**
 * Unit tests for dashboardSlice reducer
 */

import reducer, {
  resetQuotes,
  resetHistory,
  fetchQuotes,
  fetchHistory,
} from '../../src/store/dashboardSlice';

const INITIAL = {
  quotes:  {},
  history: {},
  status: { quotes: 'idle', history: {} },
  error:  { quotes: null, history: {} },
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
