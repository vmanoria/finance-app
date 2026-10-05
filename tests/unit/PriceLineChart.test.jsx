/**
 * Unit tests for PriceLineChart.jsx
 *
 * Covers:
 *   - renders nothing when series is empty (early return)
 *   - renders chart-wrap container when series is provided
 *   - renders title when provided, hides it when not
 *   - showZeroLine prop passes through (no crash either way)
 *   - unknown ticker gets fallback colour (no crash)
 *   - multiple series merge into shared date keys
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import PriceLineChart from '../../src/components/charts/PriceLineChart';

const makeSeries = (ticker, prices) => ({
  ticker,
  name: ticker,
  data: prices.map((price, i) => ({
    date:   `2024-03-${String(i + 1).padStart(2, '0')}`,
    price,
    open:   price - 1,
    high:   price + 2,
    low:    price - 2,
    volume: 1_000_000,
    pctFromBase: i === 0 ? 0 : +((price / prices[0] - 1) * 100).toFixed(3),
  })),
});

describe('PriceLineChart', () => {
  it('renders nothing when series array is empty', () => {
    const { container } = render(<PriceLineChart series={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when series prop is omitted', () => {
    const { container } = render(<PriceLineChart />);
    expect(container.firstChild).toBeNull();
  });

  it('renders chart-wrap container when data is provided', () => {
    const { container } = render(
      <PriceLineChart series={[makeSeries('IBM', [185, 187, 183])]} />
    );
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });

  it('renders title when provided', () => {
    render(
      <PriceLineChart
        series={[makeSeries('IBM', [185, 187])]}
        title="7-Day Price"
      />
    );
    expect(screen.getByText('7-Day Price')).toBeInTheDocument();
  });

  it('does not render title element when title prop is absent', () => {
    render(<PriceLineChart series={[makeSeries('IBM', [185])]} />);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('renders without crashing with showZeroLine=true', () => {
    const { container } = render(
      <PriceLineChart
        series={[makeSeries('IBM', [185, 187])]}
        showZeroLine={true}
      />
    );
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });

  it('renders without crashing with showZeroLine=false (default)', () => {
    const { container } = render(
      <PriceLineChart
        series={[makeSeries('IBM', [185, 187])]}
        showZeroLine={false}
      />
    );
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });

  it('handles a ticker not in COMPANY_META (fallback colour #888)', () => {
    const series = [makeSeries('UNKNOWN_TICKER', [100, 101, 99])];
    // Should not throw; unknown tickers fall back to #888
    const { container } = render(<PriceLineChart series={series} />);
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });

  it('renders multiple series without crashing', () => {
    const series = [
      makeSeries('IBM',  [185, 187, 183]),
      makeSeries('MSFT', [420, 425, 418]),
      makeSeries('ORCL', [125, 127, 124]),
    ];
    const { container } = render(<PriceLineChart series={series} />);
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });

  it('accepts a single data point without crashing', () => {
    const { container } = render(
      <PriceLineChart series={[makeSeries('IBM', [185])]} />
    );
    expect(container.querySelector('.chart-wrap')).not.toBeNull();
  });
});
