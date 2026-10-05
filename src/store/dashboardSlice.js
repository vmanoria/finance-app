import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getQuotes, getHistory } from '../services/financeService';

// ─── Async thunks ────────────────────────────────────────────────────────────

export const fetchQuotes = createAsyncThunk(
  'dashboard/fetchQuotes',
  async (tickers, { rejectWithValue }) => {
    try {
      return await getQuotes(tickers);
    } catch (err) {
      return rejectWithValue(err.message ?? 'Failed to fetch quotes');
    }
  }
);

export const fetchHistory = createAsyncThunk(
  'dashboard/fetchHistory',
  async ({ ticker, range }, { rejectWithValue }) => {
    try {
      const data = await getHistory(ticker, range);
      return { key: `${ticker}:${range}`, data };
    } catch (err) {
      return rejectWithValue({ key: `${ticker}:${range}`, message: err.message ?? 'Failed to fetch history' });
    }
  }
);

export const fetchCustomQuote = createAsyncThunk(
  'dashboard/fetchCustomQuote',
  async (ticker, { rejectWithValue }) => {
    try {
      const map = await getQuotes([ticker]);
      const quote = map[ticker];
      if (quote?.error) return rejectWithValue(quote.error);
      return quote;
    } catch (err) {
      return rejectWithValue(err.message ?? 'Failed to fetch quote');
    }
  }
);

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState = {
  quotes:  {},             // { [ticker]: NormalisedQuote }
  history: {},             // { [`${ticker}:${range}`]: HistoryPoint[] }
  status: {
    quotes:       'idle',  // 'idle' | 'loading' | 'ok' | 'error'
    history:      {},      // { [`${ticker}:${range}`]: same }
    customQuote:  'idle',  // 'idle' | 'loading' | 'ok' | 'error'
  },
  error: {
    quotes:      null,
    history:     {},       // { [`${ticker}:${range}`]: string | null }
    customQuote: null,
  },
  customTicker: null,      // string | null — user-entered symbol
  customQuote:  null,      // NormalisedQuote | null
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    resetQuotes(state) {
      state.quotes = {};
      state.status.quotes = 'idle';
      state.error.quotes   = null;
    },
    resetHistory(state, action) {
      const key = action.payload; // `${ticker}:${range}`
      delete state.history[key];
      delete state.status.history[key];
      delete state.error.history[key];
    },
    setCustomTicker(state, action) {
      state.customTicker       = action.payload;
      state.customQuote        = null;
      state.status.customQuote = 'idle';
      state.error.customQuote  = null;
      // Clear any previously fetched history for custom tickers
      for (const key of Object.keys(state.history)) {
        if (key.startsWith('__custom__:')) {
          delete state.history[key];
          delete state.status.history[key];
          delete state.error.history[key];
        }
      }
    },
  },
  extraReducers: builder => {
    // ── fetchQuotes ──────────────────────────────
    builder
      .addCase(fetchQuotes.pending, state => {
        state.status.quotes = 'loading';
        state.error.quotes  = null;
      })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.status.quotes = 'ok';
        state.quotes        = action.payload;
      })
      .addCase(fetchQuotes.rejected, (state, action) => {
        state.status.quotes = 'error';
        state.error.quotes  = action.payload ?? action.error.message;
      });

    // ── fetchHistory ─────────────────────────────
    builder
      .addCase(fetchHistory.pending, (state, action) => {
        const key = `${action.meta.arg.ticker}:${action.meta.arg.range}`;
        state.status.history[key] = 'loading';
        state.error.history[key]  = null;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        const { key, data } = action.payload;
        state.status.history[key] = 'ok';
        state.history[key]        = data;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        const { key, message } = action.payload ?? {};
        if (key) {
          state.status.history[key] = 'error';
          state.error.history[key]  = message ?? action.error.message;
        }
      });

    // ── fetchCustomQuote ──────────────────────────
    builder
      .addCase(fetchCustomQuote.pending, state => {
        state.status.customQuote = 'loading';
        state.error.customQuote  = null;
        state.customQuote        = null;
      })
      .addCase(fetchCustomQuote.fulfilled, (state, action) => {
        state.status.customQuote = 'ok';
        state.customQuote        = action.payload;
      })
      .addCase(fetchCustomQuote.rejected, (state, action) => {
        state.status.customQuote = 'error';
        state.error.customQuote  = action.payload ?? action.error.message;
      });
  },
});

export const { resetQuotes, resetHistory, setCustomTicker } = dashboardSlice.actions;
export default dashboardSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectQuotes             = state => state.dashboard.quotes;
export const selectHistory            = (ticker, range) => state => state.dashboard.history[`${ticker}:${range}`] ?? [];
export const selectQuoteStatus        = state => state.dashboard.status.quotes;
export const selectHistoryStatus      = (ticker, range) => state => state.dashboard.status.history[`${ticker}:${range}`] ?? 'idle';
export const selectQuoteError         = state => state.dashboard.error.quotes;
export const selectHistoryError       = (ticker, range) => state => state.dashboard.error.history[`${ticker}:${range}`] ?? null;
export const selectCustomTicker       = state => state.dashboard.customTicker;
export const selectCustomQuote        = state => state.dashboard.customQuote;
export const selectCustomQuoteStatus  = state => state.dashboard.status.customQuote;
export const selectCustomQuoteError   = state => state.dashboard.error.customQuote;
