import Card from '../common/Card';
import { COMPANY_META } from '../../services/companies';
import './QuoteCard.css';

/** Format large numbers as compact strings: 1.2B, 345M, etc. */
function fmt(n) {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtVol(n) {
  if (n == null) return '—';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

/**
 * QuoteCard — displays the full current-day snapshot for one company.
 *
 * Props (all from NormalisedQuote):
 *   ticker, name, price, open, prevClose, change, pct, pctFromOpen,
 *   high, low, week52High, week52Low, volume, avgVolume, marketCap,
 *   marketState, error
 */
export default function QuoteCard({
  ticker, name,
  price, open, prevClose,
  change, pct, pctFromOpen,
  high, low,
  week52High, week52Low,
  volume, marketCap,
  marketState,
  error,
}) {
  const color = COMPANY_META[ticker]?.color ?? '#888';

  if (error) {
    return (
      <Card className="quote-card quote-card--error">
        <div className="quote-card__ticker" style={{ color }}>{ticker}</div>
        <div className="quote-card__error-msg">{error}</div>
      </Card>
    );
  }

  const up   = change >= 0;
  const sign = up ? '+' : '';

  /* 52-week range bar fill % */
  const rangeWidth =
    week52High != null && week52Low != null && week52High !== week52Low
      ? Math.max(0, Math.min(100,
          ((price - week52Low) / (week52High - week52Low)) * 100
        ))
      : null;

  return (
    <Card className={`quote-card ${up ? 'quote-card--up' : 'quote-card--down'}`}>

      {/* ── Header ── */}
      <div className="quote-card__header">
        <span className="quote-card__ticker" style={{ color }}>{ticker}</span>
        <div className="quote-card__header-right">
          {marketState && marketState !== 'REGULAR' && (
            <span className="quote-card__mkt-state">{marketState}</span>
          )}
          <span className="quote-card__name">{name}</span>
        </div>
      </div>

      {/* ── Price ── */}
      <div className="quote-card__price">
        ${price?.toFixed(2) ?? '—'}
      </div>

      {/* ── Change badges ── */}
      <div className="quote-card__badges">
        <span className={`badge ${up ? 'badge--up' : 'badge--down'}`}>
          {sign}{change?.toFixed(2)} ({sign}{pct?.toFixed(2)}%)
        </span>
        {pctFromOpen != null && (
          <span className={`badge badge--sm ${pctFromOpen >= 0 ? 'badge--up' : 'badge--down'}`}>
            vs open {pctFromOpen >= 0 ? '+' : ''}{pctFromOpen?.toFixed(2)}%
          </span>
        )}
      </div>

      {/* ── Day range ── */}
      <div className="quote-card__meta-row">
        <span className="quote-card__meta-label">Day range</span>
        <span className="quote-card__meta-value">
          ${low?.toFixed(2) ?? '—'} – ${high?.toFixed(2) ?? '—'}
        </span>
      </div>

      {/* ── Open / Prev close ── */}
      <div className="quote-card__meta-row">
        <span className="quote-card__meta-label">Open</span>
        <span className="quote-card__meta-value">${open?.toFixed(2) ?? '—'}</span>
      </div>
      <div className="quote-card__meta-row">
        <span className="quote-card__meta-label">Prev close</span>
        <span className="quote-card__meta-value">${prevClose?.toFixed(2) ?? '—'}</span>
      </div>

      {/* ── Volume / Mkt cap ── */}
      <div className="quote-card__meta-row">
        <span className="quote-card__meta-label">Volume</span>
        <span className="quote-card__meta-value">{fmtVol(volume)}</span>
      </div>
      <div className="quote-card__meta-row">
        <span className="quote-card__meta-label">Mkt cap</span>
        <span className="quote-card__meta-value">{fmt(marketCap)}</span>
      </div>

      {/* ── 52-week range bar ── */}
      {rangeWidth != null && (
        <div className="quote-card__range">
          <span className="quote-card__range-label">52w low</span>
          <div className="quote-card__range-track">
            <div
              className="quote-card__range-fill"
              style={{ width: `${rangeWidth}%`, background: color }}
            />
          </div>
          <span className="quote-card__range-label">52w high</span>
        </div>
      )}
    </Card>
  );
}
