import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuotes } from '../../store/dashboardSlice';
import { TICKERS, COMPANY_META } from '../../services/companies';
import QuoteCard from '../charts/QuoteCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBanner from '../common/ErrorBanner';
import { isMarketOpen } from '../../utils/dateHelpers';
import './DayView.css';

const MARKET_OPEN = isMarketOpen();

export default function DayView() {
  const dispatch = useDispatch();
  const { quotes, status, error } = useSelector(s => s.dashboard);

  useEffect(() => {
    if (status.quotes === 'idle') {
      dispatch(fetchQuotes(TICKERS));
    }
  }, [dispatch, status.quotes]);

  if (status.quotes === 'loading') return <LoadingSpinner label="Fetching quotes…" />;
  if (status.quotes === 'error')   return <ErrorBanner message={error.quotes} />;

  // Derived summary counts
  const loaded  = TICKERS.filter(t => quotes[t] && !quotes[t].error);
  const gainers = loaded.filter(t => quotes[t].change >= 0).length;
  const losers  = loaded.length - gainers;

  return (
    <section className="day-view">

      {/* ── Status bar ── */}
      <div className="day-view__status-bar">
        <div className="day-view__status-left">
          <h2 className="view-heading" style={{ margin: 0 }}>Current Day</h2>
          <span className={`day-view__mkt-badge ${MARKET_OPEN ? 'day-view__mkt-badge--open' : 'day-view__mkt-badge--closed'}`}>
            {MARKET_OPEN ? '● Market Open' : '● Market Closed'}
          </span>
        </div>
        {loaded.length > 0 && (
          <div className="day-view__summary-counts">
            <span className="day-view__count day-view__count--up">↑ {gainers} gaining</span>
            <span className="day-view__count day-view__count--down">↓ {losers} falling</span>
          </div>
        )}
      </div>

      {/* ── IBM — featured card ── */}
      {quotes.IBM && (
        <div className="day-view__featured">
          <div className="day-view__featured-label">
            <span
              className="day-view__featured-dot"
              style={{ background: COMPANY_META.IBM.color }}
            />
            Featured
          </div>
          <div className="day-view__featured-card">
            <QuoteCard
              ticker={quotes.IBM.ticker}
              name={quotes.IBM.name}
              price={quotes.IBM.price}
              open={quotes.IBM.open}
              prevClose={quotes.IBM.prevClose}
              change={quotes.IBM.change}
              pct={quotes.IBM.pct}
              pctFromOpen={quotes.IBM.pctFromOpen}
              high={quotes.IBM.high}
              low={quotes.IBM.low}
              week52High={quotes.IBM.week52High}
              week52Low={quotes.IBM.week52Low}
              volume={quotes.IBM.volume}
              marketCap={quotes.IBM.marketCap}
              marketState={quotes.IBM.marketState}
              error={quotes.IBM.error}
            />
          </div>
        </div>
      )}

      {/* ── Competitors grid ── */}
      <div className="day-view__grid-label">Competitors</div>
      <div className="day-view__grid">
        {TICKERS.filter(t => t !== 'IBM').map(ticker => {
          const q = quotes[ticker];
          if (!q) return <QuoteCard key={ticker} ticker={ticker} error="No data" />;
          return (
            <QuoteCard
              key={ticker}
              ticker={q.ticker}
              name={q.name}
              price={q.price}
              open={q.open}
              prevClose={q.prevClose}
              change={q.change}
              pct={q.pct}
              pctFromOpen={q.pctFromOpen}
              high={q.high}
              low={q.low}
              week52High={q.week52High}
              week52Low={q.week52Low}
              volume={q.volume}
              marketCap={q.marketCap}
              marketState={q.marketState}
              error={q.error}
            />
          );
        })}
      </div>
    </section>
  );
}
