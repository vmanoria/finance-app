/**
 * Unit tests for ComparisonChart.jsx
 *
 * Covers:
 *   - renders nothing when series is empty (early return)
 *   - renders chart-wrap container when series is provided
 *   - renders title when provided, hides it when not
 *   - falls back to local pct calculation when pctFromBase is absent
 *   - handles unknown ticker (fallback colour)
 *   - handles series entry with empty data array (skip without crash)
 *   - handles base price of 0 in fallback calculation (no divide-by-zero)
 *   - multiple series render without crash
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ComparisonChart from '../../src/components/charts/ComparisonChart';

const makePoint = (date, price, pctFromBase) => ({
  date,
  price,
  open:   price - 1,
  high:   price + 2,
  low:    price - 2,
  volume: 500_000,
  ...(pctFromBase != null ? { pctFromBase } : {}),
});

const makeSeriesWithPct = (ticker, entries) => ({
  ticker,
  name: ticker,
  data: entries.map(([date, price, pct]) => makePoint(date, price, pct)),
});

describe('ComparisonChart', () => {
  it('renders nothing when series array is empty', () => {
    const { container } = render(<ComparisonChart series={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when series prop is omitted', () => {
    const { container } = render(<ComparisonChart />);
    expect(container.firstChild).toBeNull();
  });

  it('renders chart-wrap container when data is provided', () => {
    const series = [makeSeriesWithPct('IBM', [
      ['2024-03-01', 185, 0],
      ['2024-03-04', 188, 1.62],
    ])];
    const { container } = render(<ComparisonChart series={series} />);
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });

  it('renders title when provided', () => {
    const series = [makeSeriesWithPct('IBM', [['2024-03-01', 185, 0]])];
    render(<ComparisonChart series={series} title="Q1 Comparison" />);
    expect(screen.getByText('Q1 Comparison')).toBeInTheDocument();
  });

  it('does not render title element when title prop is absent', () => {
    const series = [makeSeriesWithPct('IBM', [['2024-03-01', 185, 0]])];
    render(<ComparisonChart series={series} />);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('falls back to local pct calculation when pctFromBase is absent', () => {
    // Points without pctFromBase — ComparisonChart computes it from base price
    const series = [{
      ticker: 'IBM',
      name:   'IBM',
      data: [
        makePoint('2024-03-01', 185),    // no pctFromBase
        makePoint('2024-03-04', 188),    // no pctFromBase
        makePoint('2024-03-05', 182),    // no pctFromBase
      ],
    }];
    const { container } = render(<ComparisonChart series={series} />);
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });

  it('handles base price of 0 in fallback calculation without crashing', () => {
    const series = [{
      ticker: 'IBM',
      name:   'IBM',
      data: [
        makePoint('2024-03-01', 0),   // base = 0 → fallback returns 0
        makePoint('2024-03-04', 5),
      ],
    }];
    const { container } = render(<ComparisonChart series={series} />);
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });

  it('skips series with empty data array without crashing', () => {
    const series = [
      { ticker: 'IBM',  name: 'IBM',  data: [] },                           // empty
      makeSeriesWithPct('MSFT', [['2024-03-01', 420, 0], ['2024-03-04', 425, 1.19]]),
    ];
    const { container } = render(<ComparisonChart series={series} />);
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });

  it('handles unknown ticker (falls back to #888 colour)', () => {
    const series = [makeSeriesWithPct('NOOP_TICK', [
      ['2024-03-01', 100, 0],
      ['2024-03-04', 102, 2],
    ])];
    const { container } = render(<ComparisonChart series={series} />);
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });

  it('renders multiple series without crashing', () => {
    const series = [
      makeSeriesWithPct('IBM',  [['2024-03-01', 185, 0], ['2024-03-04', 188, 1.62]]),
      makeSeriesWithPct('MSFT', [['2024-03-01', 420, 0], ['2024-03-04', 425, 1.19]]),
      makeSeriesWithPct('ORCL', [['2024-03-01', 125, 0], ['2024-03-04', 127, 1.60]]),
    ];
    const { container } = render(<ComparisonChart series={series} />);
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });

  it('renders a single data point without crashing', () => {
    const series = [makeSeriesWithPct('IBM', [['2024-03-01', 185, 0]])];
    const { container } = render(<ComparisonChart series={series} />);
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });
});
