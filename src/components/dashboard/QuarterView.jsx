import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHistory } from '../../store/dashboardSlice';
import { TICKERS, TICKER_NAMES, COMPANY_META } from '../../services/companies';
import { summariseSeries } from '../../utils/normalise';
import { currentQuarterLabel } from '../../utils/dateHelpers';
import ComparisonChart from '../charts/ComparisonChart';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBanner from '../common/ErrorBanner';
import './QuarterView.css';

const RANGE = 'quarter';

export default function QuarterView() {
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
  if (loading) return <LoadingSpinner label="Fetching quarter history…" />;

  const anyError = TICKERS.map(t => error.history?.[`${t}:${RANGE}`]).find(Boolean);

  const series = TICKERS
    .map(ticker => ({
      ticker,
      name: TICKER_NAMES[ticker] || ticker,
      data: history[`${ticker}:${RANGE}`] ?? [],
    }))
    .filter(s => s.data.length > 0);

  // Ranking: use summariseSeries for pctChange — same logic as the data layer
  const ranks = series.map(s => {
    const summary = summariseSeries(s.data);
    return {
      ticker:    s.ticker,
      name:      s.name,
      pctChange: summary.pctChange,
      lastPrice: summary.lastPrice,
      high:      summary.high,
      low:       summary.low,
    };
  }).sort((a, b) => (b.pctChange ?? -Infinity) - (a.pctChange ?? -Infinity));

  const quarterLabel = currentQuarterLabel();

  return (
    <section>
      {/* ── Heading ── */}
      <div className="quarter-heading-row">
        <h2 className="view-heading" style={{ margin: 0 }}>Last Quarter</h2>
        <span className="quarter-period-badge">{quarterLabel} to date</span>
      </div>
      {anyError && <ErrorBanner message={anyError} />}

      {/* ── Area comparison chart ── */}
      <ComparisonChart
        series={series}
        title={`% change from ${quarterLabel} open`}
      />

      {/* ── Rank table ── */}
      <div className="rank-table-wrap">
        <div className="rank-table-header">Performance ranking</div>
        <table className="rank-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ticker</th>
              <th>Company</th>
              <th>Quarter change</th>
              <th>Last price</th>
              <th>Period high</th>
              <th>Period low</th>
            </tr>
          </thead>
          <tbody>
            {ranks.map((r, i) => {
              const up    = (r.pctChange ?? 0) >= 0;
              const color = COMPANY_META[r.ticker]?.color ?? '#888';
              return (
                <tr key={r.ticker}>
                  <td className="rank-table__rank">{i + 1}</td>
                  <td>
                    <span className="rank-table__ticker-dot" style={{ background: color }} />
                    <strong style={{ color }}>{r.ticker}</strong>
                  </td>
                  <td>{r.name}</td>
                  <td>
                    <span className={`rank-change-badge ${up ? 'rank-change-badge--up' : 'rank-change-badge--down'}`}>
                      {r.pctChange != null
                        ? `${up ? '+' : ''}${r.pctChange}%`
                        : '—'}
                    </span>
                  </td>
                  <td>{r.lastPrice != null ? `$${r.lastPrice.toFixed(2)}` : '—'}</td>
                  <td className="muted">{r.high != null ? `$${r.high.toFixed(2)}` : '—'}</td>
                  <td className="muted">{r.low  != null ? `$${r.low.toFixed(2)}`  : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
