import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.purple,
  COLORS.pink,
  COLORS.cyan,
  COLORS.danger
];

/**
 * Gráfico de Área con Gradiente
 */
export const GradientAreaChart = ({ data, dataKey, xKey, title, color = COLORS.primary }) => {
  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fillOpacity={1}
            fill={`url(#gradient-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Gráfico de Barras Apiladas
 */
export const StackedBarChart = ({ data, keys, xKey, title }) => {
  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
          <Legend />
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Gráfico de Dona (Donut Chart)
 */
export const DonutChart = ({ data, nameKey, valueKey, title }) => {
  const total = useMemo(() =>
    data.reduce((sum, item) => sum + item[valueKey], 0),
    [data, valueKey]
  );

  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>}
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={valueKey}
              label={(entry) => `${entry[nameKey]}: ${entry[valueKey]}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* Total en el centro */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Gráfico de Radar (Spider Chart)
 */
export const SpiderChart = ({ data, dataKey, subject, title }) => {
  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>}
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey={subject} tick={{ fontSize: 11 }} stroke="#6b7280" />
          <PolarRadiusAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
          <Radar
            dataKey={dataKey}
            stroke={COLORS.primary}
            fill={COLORS.primary}
            fillOpacity={0.6}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Gráfico de Líneas Múltiples
 */
export const MultiLineChart = ({ data, lines, xKey, title }) => {
  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color || CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default {
  GradientAreaChart,
  StackedBarChart,
  DonutChart,
  SpiderChart,
  MultiLineChart
};
