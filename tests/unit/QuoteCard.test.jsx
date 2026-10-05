/**
 * Unit tests for QuoteCard component.
 *
 * Covers:
 *   - price and change rendering for up/down quotes
 *   - pctFromOpen badge visibility
 *   - market-state badge (shown only when not REGULAR)
 *   - error state renders ticker + message, no price
 *   - 52-week range bar is shown when both bounds are present
 *   - 52-week range bar is absent when bounds are missing
 *   - volume and market-cap formatting helpers
 *   - all meta-rows (open, prev close, day range, volume, mkt cap)
 */

import { render, screen } from '@testing-library/react';
import QuoteCard from '../../src/components/charts/QuoteCard';

// Minimal valid props for a gaining quote
const baseProps = {
  ticker:      'IBM',
  name:        'International Business Machines',
  price:       182.50,
  open:        180.00,
  prevClose:   179.25,
  change:      3.25,
  pct:         1.81,
  pctFromOpen: 1.39,
  high:        183.10,
  low:         179.50,
  week52High:  225.00,
  week52Low:   140.00,
  volume:      3_500_000,
  marketCap:   165_000_000_000,
  marketState: 'REGULAR',
  error:       null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

describe('QuoteCard — price and change display', () => {
  it('renders the ticker symbol', () => {
    render(<QuoteCard {...baseProps} />);
    expect(screen.getAllByText('IBM').length).toBeGreaterThan(0);
  });

  it('renders the company name', () => {
    render(<QuoteCard {...baseProps} />);
    expect(screen.getByText('International Business Machines')).toBeInTheDocument();
  });

  it('renders the formatted price', () => {
    render(<QuoteCard {...baseProps} />);
    expect(screen.getByText('$182.50')).toBeInTheDocument();
  });

  it('renders a positive change badge with + prefix', () => {
    render(<QuoteCard {...baseProps} />);
    // Badge shows "+3.25 (+1.81%)"
    expect(screen.getByText(/\+3\.25/)).toBeInTheDocument();
    expect(screen.getByText(/\+1\.81%/)).toBeInTheDocument();
  });

  it('renders a negative change badge without + prefix', () => {
    render(<QuoteCard {...baseProps} change={-2.10} pct={-1.17} pctFromOpen={-0.8} />);
    expect(screen.getByText(/-2\.10/)).toBeInTheDocument();
  });

  it('applies quote-card--up class for positive change', () => {
    const { container } = render(<QuoteCard {...baseProps} />);
    expect(container.querySelector('.quote-card--up')).not.toBeNull();
  });

  it('applies quote-card--down class for negative change', () => {
    const { container } = render(
      <QuoteCard {...baseProps} change={-1} pct={-0.5} pctFromOpen={-0.5} />
    );
    expect(container.querySelector('.quote-card--down')).not.toBeNull();
  });
});

// ─── pctFromOpen badge ────────────────────────────────────────────────────────

describe('QuoteCard — pctFromOpen badge', () => {
  it('shows the vs-open badge when pctFromOpen is provided', () => {
    render(<QuoteCard {...baseProps} pctFromOpen={1.39} />);
    expect(screen.getByText(/vs open/i)).toBeInTheDocument();
    expect(screen.getByText(/\+1\.39%/)).toBeInTheDocument();
  });

  it('does not show vs-open badge when pctFromOpen is null', () => {
    render(<QuoteCard {...baseProps} pctFromOpen={null} />);
    expect(screen.queryByText(/vs open/i)).not.toBeInTheDocument();
  });
});

// ─── Market state badge ───────────────────────────────────────────────────────

describe('QuoteCard — market state badge', () => {
  it('hides the badge during REGULAR hours', () => {
    render(<QuoteCard {...baseProps} marketState="REGULAR" />);
    expect(screen.queryByText('REGULAR')).not.toBeInTheDocument();
  });

  it('shows PRE badge in pre-market', () => {
    render(<QuoteCard {...baseProps} marketState="PRE" />);
    expect(screen.getByText('PRE')).toBeInTheDocument();
  });

  it('shows POST badge in after-hours', () => {
    render(<QuoteCard {...baseProps} marketState="POST" />);
    expect(screen.getByText('POST')).toBeInTheDocument();
  });

  it('shows CLOSED badge when market is closed', () => {
    render(<QuoteCard {...baseProps} marketState="CLOSED" />);
    expect(screen.getByText('CLOSED')).toBeInTheDocument();
  });
});

// ─── Meta rows ────────────────────────────────────────────────────────────────

describe('QuoteCard — meta rows', () => {
  it('renders the Open row', () => {
    render(<QuoteCard {...baseProps} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('$180.00')).toBeInTheDocument();
  });

  it('renders the Prev close row', () => {
    render(<QuoteCard {...baseProps} />);
    expect(screen.getByText('Prev close')).toBeInTheDocument();
    expect(screen.getByText('$179.25')).toBeInTheDocument();
  });

  it('renders the Day range row', () => {
    render(<QuoteCard {...baseProps} />);
    expect(screen.getByText('Day range')).toBeInTheDocument();
    expect(screen.getByText(/\$179\.50.*\$183\.10/)).toBeInTheDocument();
  });

  it('renders Volume formatted in millions', () => {
    render(<QuoteCard {...baseProps} volume={3_500_000} />);
    expect(screen.getByText('3.5M')).toBeInTheDocument();
  });

  it('renders Volume formatted in thousands', () => {
    render(<QuoteCard {...baseProps} volume={42_000} />);
    expect(screen.getByText('42K')).toBeInTheDocument();
  });

  it('renders null volume as —', () => {
    render(<QuoteCard {...baseProps} volume={null} />);
    // Multiple — symbols may appear for other null fields; just confirm no crash
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('renders market cap in billions', () => {
    render(<QuoteCard {...baseProps} marketCap={165_000_000_000} />);
    expect(screen.getByText('$165.0B')).toBeInTheDocument();
  });

  it('renders market cap in trillions', () => {
    render(<QuoteCard {...baseProps} marketCap={3_200_000_000_000} />);
    expect(screen.getByText('$3.2T')).toBeInTheDocument();
  });

  it('renders market cap in millions', () => {
    render(<QuoteCard {...baseProps} marketCap={850_000_000} />);
    expect(screen.getByText('$850.0M')).toBeInTheDocument();
  });
});

// ─── 52-week range bar ────────────────────────────────────────────────────────

describe('QuoteCard — 52-week range bar', () => {
  it('renders 52w range labels when bounds are present', () => {
    render(<QuoteCard {...baseProps} />);
    expect(screen.getByText('52w low')).toBeInTheDocument();
    expect(screen.getByText('52w high')).toBeInTheDocument();
  });

  it('does not render range bar when week52High is null', () => {
    render(<QuoteCard {...baseProps} week52High={null} />);
    expect(screen.queryByText('52w low')).not.toBeInTheDocument();
  });

  it('does not render range bar when week52Low is null', () => {
    render(<QuoteCard {...baseProps} week52Low={null} />);
    expect(screen.queryByText('52w high')).not.toBeInTheDocument();
  });

  it('does not render range bar when high equals low (division by zero guard)', () => {
    render(<QuoteCard {...baseProps} week52High={180} week52Low={180} />);
    expect(screen.queryByText('52w low')).not.toBeInTheDocument();
  });

  it('fill width is clamped to 0% when price is below 52w low', () => {
    const { container } = render(
      <QuoteCard {...baseProps} price={130} week52Low={140} week52High={225} />
    );
    const fill = container.querySelector('.quote-card__range-fill');
    expect(fill.style.width).toBe('0%');
  });

  it('fill width is clamped to 100% when price is above 52w high', () => {
    const { container } = render(
      <QuoteCard {...baseProps} price={240} week52Low={140} week52High={225} />
    );
    const fill = container.querySelector('.quote-card__range-fill');
    expect(fill.style.width).toBe('100%');
  });

  it('fill width is 50% when price is midway between 52w low and high', () => {
    const { container } = render(
      <QuoteCard {...baseProps} price={182.5} week52Low={140} week52High={225} />
    );
    const fill = container.querySelector('.quote-card__range-fill');
    // (182.5 - 140) / (225 - 140) = 42.5 / 85 = 50%
    expect(fill.style.width).toBe('50%');
  });
});

// ─── Error state ──────────────────────────────────────────────────────────────

describe('QuoteCard — error state', () => {
  it('renders the ticker in error state', () => {
    render(<QuoteCard ticker="IBM" error="Rate limited" />);
    expect(screen.getByText('IBM')).toBeInTheDocument();
  });

  it('renders the error message', () => {
    render(<QuoteCard ticker="IBM" error="Rate limited" />);
    expect(screen.getByText('Rate limited')).toBeInTheDocument();
  });

  it('does not render a price in error state', () => {
    render(<QuoteCard ticker="IBM" error="Network error" price={180} />);
    expect(screen.queryByText('$180.00')).not.toBeInTheDocument();
  });

  it('applies quote-card--error class', () => {
    const { container } = render(<QuoteCard ticker="IBM" error="oops" />);
    expect(container.querySelector('.quote-card--error')).not.toBeNull();
  });
});
