import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { COMPANY_META } from '../../services/companies';

/**
 * ComparisonChart — multi-series % change from period open.
 *
 * Each series' `data` array is expected to have `pctFromBase` set
 * (produced by normaliseHistory). If it is missing the chart falls back
 * to computing it locally from the price field.
 *
 * @param {Array<{ticker, name, data: HistoryPoint[]}>} series
 * @param {string} title
 */
export default function ComparisonChart({ series = [], title }) {
  if (!series.length) return null;

  const dateMap = {};
  for (const s of series) {
    if (!s.data.length) continue;
    const base = s.data[0].price;
    for (const point of s.data) {
      if (!dateMap[point.date]) dateMap[point.date] = { date: point.date };
      // Prefer pre-computed pctFromBase; fall back to local calculation
      dateMap[point.date][s.ticker] =
        point.pctFromBase != null
          ? point.pctFromBase
          : base ? +((point.price / base - 1) * 100).toFixed(3) : 0;
    }
  }
  const chartData = Object.values(dateMap).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const formatTick = (v) => {
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const tooltipFormatter = (value, name) => [
    `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`,
    name,
  ];

  return (
    <div className="chart-wrap">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 4 }}>
          <defs>
            {series.map(s => {
              const color = COMPANY_META[s.ticker]?.color ?? '#888';
              return (
                <linearGradient key={s.ticker} id={`grad-${s.ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              );
            })}
          </defs>
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
            width={52}
            tickFormatter={v => `${v}%`}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
            labelFormatter={formatTick}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="plainline"
          />
          {series.map(s => {
            const color = COMPANY_META[s.ticker]?.color ?? '#888';
            return (
              <Area
                key={s.ticker}
                type="monotone"
                dataKey={s.ticker}
                name={s.name || s.ticker}
                stroke={color}
                fill={`url(#grad-${s.ticker})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
