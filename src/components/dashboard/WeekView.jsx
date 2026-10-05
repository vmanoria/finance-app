import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHistory } from '../../store/dashboardSlice';
import { TICKERS, TICKER_NAMES, COMPANY_META } from '../../services/companies';
import { summariseSeries } from '../../utils/normalise';
import PriceLineChart from '../charts/PriceLineChart';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBanner from '../common/ErrorBanner';
import './WeekView.css';

const RANGE = 'week';

export default function WeekView() {
  const dispatch = useDispatch();
  const { history, status, error } = useSelector(s => s.dashboard);

  useEffect(() => {
    for (const ticker of TICKERS) {
      const key = `${ticker}:${RANGE}`;
      if (!status.history[key] || status.history[key] === 'idle') {
        dispatch(fetchHistory({ ticker, range: RANGE }));
      }
    }
  }, [dispatch, status.history]);

  const loading = TICKERS.some(t => status.history[`${t}:${RANGE}`] === 'loading');
  if (loading) return <LoadingSpinner label="Fetching 7-day history…" />;

  const anyError = TICKERS.map(t => error.history?.[`${t}:${RANGE}`]).find(Boolean);

  const series = TICKERS
    .map(ticker => ({
      ticker,
      name: TICKER_NAMES[ticker] || ticker,
      data: history[`${ticker}:${RANGE}`] ?? [],
    }))
    .filter(s => s.data.length > 0);

  // Change-summary row — pct change over the 7-day window for each ticker
  const summaries = TICKERS.map(ticker => {
    const data = history[`${ticker}:${RANGE}`] ?? [];
    const s    = summariseSeries(data);
    return { ticker, name: TICKER_NAMES[ticker] || ticker, ...s };
  }).sort((a, b) => (b.pctChange ?? -Infinity) - (a.pctChange ?? -Infinity));

  return (
    <section>
      <h2 className="view-heading">Last 7 Days</h2>
      {anyError && <ErrorBanner message={anyError} />}

      <PriceLineChart series={series} title="Price — last 7 trading days" />

      {/* ── 7-day change summary strip ── */}
      {summaries.some(s => s.pctChange !== null) && (
        <div className="week-summary">
          <div className="week-summary__label">7-day performance</div>
          <div className="week-summary__row">
            {summaries.map(s => {
              const up    = (s.pctChange ?? 0) >= 0;
              const color = COMPANY_META[s.ticker]?.color ?? '#888';
              return (
                <div key={s.ticker} className="week-summary__cell">
                  <span className="week-summary__ticker" style={{ color }}>
                    {s.ticker}
                  </span>
                  <span className={`week-summary__pct ${up ? 'positive' : 'negative'}`}>
                    {s.pctChange != null
                      ? `${up ? '+' : ''}${s.pctChange}%`
                      : '—'}
                  </span>
                  <span className="week-summary__price">
                    {s.lastPrice != null ? `$${s.lastPrice.toFixed(2)}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
