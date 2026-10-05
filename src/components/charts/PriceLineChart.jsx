import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { COMPANY_META } from '../../services/companies';

/**
 * PriceLineChart — multi-series absolute price line chart.
 *
 * @param {Array<{ticker, name, data: Array<{date, price}>}>} series
 * @param {string}  title
 * @param {boolean} showZeroLine  — draw a dashed zero reference line (off by default)
 */
export default function PriceLineChart({ series = [], title, showZeroLine = false }) {
  if (!series.length) return null;

  // Merge per-ticker data into one flat array keyed by date
  const dateMap = {};
  for (const s of series) {
    for (const point of s.data) {
      if (!dateMap[point.date]) dateMap[point.date] = { date: point.date };
      dateMap[point.date][s.ticker] = point.price;
    }
  }
  const chartData = Object.values(dateMap).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Abbreviate dates: "Mar 5" for daily, keep as-is for intraday
  const formatTick = (v) => {
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const tooltipFormatter = (value, name) => [
    `$${Number(value).toFixed(2)}`,
    name,
  ];

  return (
    <div className="chart-wrap">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#57606a' }}
            tickFormatter={formatTick}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#57606a' }}
            width={64}
            tickFormatter={v => `$${v}`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
            labelFormatter={formatTick}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="plainline"
          />
          {showZeroLine && <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="4 4" />}
          {series.map(s => (
            <Line
              key={s.ticker}
              type="monotone"
              dataKey={s.ticker}
              name={s.name || s.ticker}
              stroke={COMPANY_META[s.ticker]?.color ?? '#888'}
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
