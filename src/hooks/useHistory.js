import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHistory } from '../store/dashboardSlice';
import { TICKERS } from '../services/financeService';

/**
 * useHistory — fetches historical data for a set of tickers and a given range.
 * Skips tickers whose data is already loaded or in flight.
 *
 * @param {'day'|'week'|'quarter'} range
 * @param {string[]} tickers
 */
export function useHistory(range, tickers = TICKERS) {
  const dispatch = useDispatch();
  const history  = useSelector(s => s.dashboard.history);
  const status   = useSelector(s => s.dashboard.status.history);
  const error    = useSelector(s => s.dashboard.error.history);

  useEffect(() => {
    for (const ticker of tickers) {
      const key = `${ticker}:${range}`;
      if (!status[key] || status[key] === 'idle') {
        dispatch(fetchHistory({ ticker, range }));
      }
    }
  }, [dispatch, range, tickers, status]);

  const loading = tickers.some(t => status[`${t}:${range}`] === 'loading');
  const errors  = tickers
    .map(t => error[`${t}:${range}`])
    .filter(Boolean);

  const series = tickers.map(ticker => ({
    ticker,
    data: history[`${ticker}:${range}`] ?? [],
  }));

  return { series, loading, errors };
}
