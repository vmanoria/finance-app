import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuotes } from '../store/dashboardSlice';
import { TICKERS } from '../services/financeService';

/**
 * useQuotes — fetches current-day quotes for the default TICKERS on first use.
 * Re-fetches when the status is reset to 'idle'.
 */
export function useQuotes(tickers = TICKERS) {
  const dispatch = useDispatch();
  const quotes = useSelector(s => s.dashboard.quotes);
  const status = useSelector(s => s.dashboard.status.quotes);
  const error  = useSelector(s => s.dashboard.error.quotes);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchQuotes(tickers));
    }
  }, [dispatch, status, tickers]);

  return { quotes, status, error };
}
