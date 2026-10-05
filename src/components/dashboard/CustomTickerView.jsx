import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCustomQuote,
  fetchHistory,
  setCustomTicker,
  selectCustomTicker,
  selectCustomQuote,
  selectCustomQuoteStatus,
  selectCustomQuoteError,
} from '../../store/dashboardSlice';
import PriceLineChart from '../charts/PriceLineChart';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBanner from '../common/ErrorBanner';
import './CustomTickerView.css';

/** Basic ticker validation: 1–5 uppercase letters (NYSE/NASDAQ format). */
function validateTicker(raw) {
  const ticker = raw.trim().toUpperCase();
  if (!ticker) return { error: 'Please enter a ticker symbol.' };
  if (!/^[A-Z]{1,5}$/.test(ticker)) {
    return { error: `"${ticker}" is not a valid ticker symbol. Use 1–5 letters (e.g. AAPL).` };
  }
  return { ticker };
}

export default function CustomTickerView() {
  const dispatch = useDispatch();
  const [inputValue, setInputValue]     = useState('');
  const [inputError, setInputError]     = useState('');

  const customTicker = useSelector(selectCustomTicker);
  const customQuote  = useSelector(selectCustomQuote);
  const status       = useSelector(selectCustomQuoteStatus);
  const fetchError   = useSelector(selectCustomQuoteError);

  // History for the custom ticker (week range) — select the raw value (may be undefined),
  // then default outside the selector so the selector always returns the same reference.
  const historyKey    = customTicker ? `${customTicker}:week` : null;
  const historyRaw    = useSelector(s => historyKey ? s.dashboard.history[historyKey] : undefined);
  const history       = historyRaw ?? [];
  const historyStatus = useSelector(s => historyKey ? (s.dashboard.status.history[historyKey] ?? 'idle') : 'idle');

  function handleSubmit(e) {
    e.preventDefault();
    const { error, ticker } = validateTicker(inputValue);
    if (error) {
      setInputError(error);
      return;
    }
    setInputError('');
    dispatch(setCustomTicker(ticker));
    dispatch(fetchCustomQuote(ticker));
    dispatch(fetchHistory({ ticker, range: 'week' }));
  }

  const loading = status === 'loading' || historyStatus === 'loading';

  const chartSeries =
    customTicker && history.length > 0
      ? [{ ticker: customTicker, name: customQuote?.name || customTicker, data: history }]
      : [];

  return (
    <section className="custom-view">
      <h2 className="view-heading">Custom Ticker</h2>

      {/* ── Search form ── */}
      <form className="custom-view__form" onSubmit={handleSubmit} noValidate>
        <label className="custom-view__label" htmlFor="ticker-input">
          Enter a stock ticker symbol
        </label>
        <div className="custom-view__input-row">
          <input
            id="ticker-input"
            className={`custom-view__input ${inputError ? 'custom-view__input--error' : ''}`}
            type="text"
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); setInputError(''); }}
            placeholder="e.g. AAPL"
            maxLength={5}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={inputError ? 'ticker-input-error' : undefined}
          />
          <button className="custom-view__btn" type="submit" disabled={loading}>
            {loading ? 'Loading…' : 'Load Chart'}
          </button>
        </div>
        {inputError && (
          <p id="ticker-input-error" className="custom-view__input-error" role="alert">
            {inputError}
          </p>
        )}
      </form>

      {/* ── Fetch error ── */}
      {status === 'error' && <ErrorBanner message={fetchError} />}

      {/* ── Loading ── */}
      {loading && <LoadingSpinner label={`Fetching data for ${customTicker}…`} />}

      {/* ── Results ── */}
      {!loading && status === 'ok' && customQuote && (
        <div className="custom-view__results">
          {/* Quote summary strip */}
          <div className="custom-view__quote-strip">
            <span className="custom-view__ticker-label">{customQuote.ticker}</span>
            <span className="custom-view__company-name">{customQuote.name}</span>
            <span className="custom-view__price">${customQuote.price?.toFixed(2) ?? '—'}</span>
            {customQuote.change != null && (
              <span className={`custom-view__change ${customQuote.change >= 0 ? 'positive' : 'negative'}`}>
                {customQuote.change >= 0 ? '+' : ''}{customQuote.change.toFixed(2)}
                {' '}({customQuote.change >= 0 ? '+' : ''}{customQuote.pct?.toFixed(2)}%)
              </span>
            )}
            {customQuote.marketState && customQuote.marketState !== 'REGULAR' && (
              <span className="custom-view__mkt-state">{customQuote.marketState}</span>
            )}
          </div>

          {/* 7-day price chart */}
          {chartSeries.length > 0 ? (
            <PriceLineChart
              series={chartSeries}
              title={`${customQuote.name || customQuote.ticker} — last 7 trading days`}
            />
          ) : (
            historyStatus === 'error' && (
              <ErrorBanner message={`Could not load price history for ${customTicker}.`} />
            )
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {!customTicker && status === 'idle' && (
        <p className="custom-view__hint">
          Enter any valid NYSE or NASDAQ ticker above to see its current quote and 7-day price chart.
        </p>
      )}
    </section>
  );
}
