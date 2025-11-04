import { useMemo } from 'react';
import { motion } from 'framer-motion';
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
import { intraMediaColors } from '../styles/intraMediaTheme';

// Paleta de colores basada en el branding morado de Intra Media
const COLORS = {
  primary: '#9333ea',    // Morado principal (purple-600)
  secondary: '#a855f7',  // Morado claro (purple-500)
  accent: '#7c3aed',     // Morado oscuro (violet-600)
  dark: '#1a1a1a',
  success: '#047857',    // Emerald-700
  warning: '#d97706',    // Amber oscuro
  purple: '#9333ea',     // Morado principal
  cyan: '#0891b2'        // Cyan oscuro
};

// Paleta consistente - variaciones de morado para coherencia con el branding
const CHART_COLORS = [
  '#9333ea',  // Purple-600 (principal)
  '#a855f7',  // Purple-500 (claro)
  '#7c3aed',  // Violet-600 (oscuro)
  '#c084fc',  // Purple-400 (muy claro)
  '#6b21a8',  // Purple-800 (muy oscuro)
  '#d8b4fe',  // Purple-300 (pastel)
  '#581c87',  // Purple-900 (profundo)
];

/**
 * Tooltip personalizado MEJORADO con glassmorphism y colores vibrantes
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        backgroundColor: 'rgba(30, 30, 30, 0.97)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        padding: '12px',
        backdropFilter: 'blur(8px)'
      }}
    >
      <p style={{ color: '#E5E7EB', fontWeight: '500', fontSize: '0.75rem', marginBottom: '8px' }}>
        {label}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-3 text-xs mb-1.5 last:mb-0">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: entry.color
              }}
            />
            <span className="text-gray-400 font-normal">{entry.name}:</span>
          </div>
          <span className="text-white font-medium text-sm">{entry.value.toLocaleString('es-ES')}</span>
        </div>
      ))}
    </motion.div>
  );
};

/**
 * Gráfico de Área 3D con Gradiente Intra Media - MEJORADO
 */
export const GradientAreaChart3D = ({ data, dataKey, xKey, title, color = COLORS.primary }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-3"
    >
      {title && (
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-900 dark:text-white font-medium text-lg flex items-center gap-2 mb-3"
        >
          <span className="w-0.5 h-5 bg-blue-500 rounded-full" />
          {title}
        </motion.h3>
      )}
      <div className="relative">
        {/* SIN glow effect - solo el gráfico limpio */}
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              {/* Gradiente morado coherente con el branding */}
              <linearGradient id={`gradient3d-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9333ea" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.2} />
              </linearGradient>
              {/* Sombra 3D MÁS DRAMÁTICA */}
              <filter id="shadow3d" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                <feOffset dx="0" dy="6" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Glow effect para la línea */}
              <filter id="glow-area">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(147, 51, 234, 0.1)"
              vertical={false}
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: 'currentColor', fontWeight: 400 }}
              className="text-gray-600 dark:text-gray-300"
              axisLine={{ stroke: 'rgba(147, 51, 234, 0.15)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'currentColor', fontWeight: 400 }}
              className="text-gray-600 dark:text-gray-300"
              axisLine={{ stroke: 'rgba(147, 51, 234, 0.15)' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9333ea', strokeWidth: 2 }} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={COLORS.primary}
              strokeWidth={4}
              fillOpacity={1}
              fill={`url(#gradient3d-${dataKey})`}
              filter="url(#glow-area)"
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

/**
 * Gráfico de Barras 3D - MEJORADO
 */
export const BarChart3D = ({ data, dataKey, xKey, title, color = COLORS.primary }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-4"
    >
      {title && (
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-900 dark:text-white font-medium text-lg flex items-center gap-2 mb-3"
        >
          <span className="w-0.5 h-5 bg-blue-500 rounded-full" />
          {title}
        </motion.h3>
      )}
      <div className="relative">
        {/* SIN glow effect en BarChart */}
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <defs>
              {/* Gradiente morado coherente con el branding */}
              <linearGradient id="barGradient3d" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9333ea" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.5} />
              </linearGradient>
              {/* Sombra para barras */}
              <filter id="bar-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                <feOffset dx="0" dy="4" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.4" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(147, 51, 234, 0.1)"
              vertical={false}
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: 'currentColor', fontWeight: 400 }}
              className="text-gray-600 dark:text-gray-300"
              axisLine={{ stroke: 'rgba(147, 51, 234, 0.15)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'currentColor', fontWeight: 400 }}
              className="text-gray-600 dark:text-gray-300"
              axisLine={{ stroke: 'rgba(147, 51, 234, 0.15)' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(147, 51, 234, 0.1)' }} />
            <Bar
              dataKey={dataKey}
              fill="url(#barGradient3d)"
              radius={[10, 10, 0, 0]}
              filter="url(#bar-shadow)"
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

/**
 * Gráfico de Dona 3D - MEJORADO
 */
export const DonutChart3D = ({ data, nameKey, valueKey, title }) => {
  const total = useMemo(() =>
    data.reduce((sum, item) => sum + item[valueKey], 0),
    [data, valueKey]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-4"
    >
      {title && (
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-900 dark:text-white font-medium text-lg flex items-center gap-2 mb-3"
        >
          <span className="w-0.5 h-5 bg-blue-500 rounded-full" />
          {title}
        </motion.h3>
      )}
      <div className="relative">
        {/* SIN glow effect en DonutChart */}
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <defs>
              {CHART_COLORS.map((color, index) => (
                <linearGradient key={index} id={`donutGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                </linearGradient>
              ))}
              {/* Sombra para el donut */}
              <filter id="donut-shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.4"/>
              </filter>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={85}
              outerRadius={130}
              paddingAngle={4}
              dataKey={valueKey}
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
              filter="url(#donut-shadow)"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#donutGradient-${index % CHART_COLORS.length})`}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={3}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Total en el centro con glassmorphism profesional */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            className="text-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-full w-44 h-44 flex flex-col items-center justify-center border-2 border-blue-500/50 dark:border-blue-400/50 shadow-2xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-3xl font-medium text-gray-900 dark:text-white"
            >
              {total.toLocaleString('es-ES')}
            </motion.div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-normal">Total</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Gráfico de Líneas Múltiples 3D - MEJORADO
 */
export const MultiLineChart3D = ({ data, lines, xKey, title }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-4"
    >
      {title && (
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-900 dark:text-white font-medium text-lg flex items-center gap-2 mb-3"
        >
          <span className="w-0.5 h-5 bg-blue-500 rounded-full" />
          {title}
        </motion.h3>
      )}
      <div className="relative">
        {/* SIN glow effect en MultiLineChart */}
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <defs>
              {/* Glow MÁS INTENSO para líneas */}
              <filter id="glow-line">
                <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(147, 51, 234, 0.1)"
              vertical={false}
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: 'currentColor', fontWeight: 400 }}
              className="text-gray-600 dark:text-gray-300"
              axisLine={{ stroke: 'rgba(147, 51, 234, 0.15)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'currentColor', fontWeight: 400 }}
              className="text-gray-600 dark:text-gray-300"
              axisLine={{ stroke: 'rgba(147, 51, 234, 0.15)' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => <span className="text-gray-600 dark:text-gray-300 font-medium">{value}</span>}
            />
            {lines.map((line, index) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color || CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={4}
                dot={{
                  r: 6,
                  strokeWidth: 3,
                  fill: '#1a1a1a',
                  stroke: line.color || CHART_COLORS[index % CHART_COLORS.length]
                }}
                activeDot={{
                  r: 9,
                  strokeWidth: 3,
                  fill: line.color || CHART_COLORS[index % CHART_COLORS.length],
                  style: { filter: 'drop-shadow(0 0 6px currentColor)' }
                }}
                filter="url(#glow-line)"
                animationBegin={index * 200}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

/**
 * Gráfico Radar 3D
 */
export const RadarChart3D = ({ data, dataKey, subject, title }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-2"
    >
      {title && (
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded" />
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.8} />
              <stop offset="100%" stopColor={COLORS.secondary} stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
          <PolarAngleAxis
            dataKey={subject}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
          />
          <PolarRadiusAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          />
          <Radar
            dataKey={dataKey}
            stroke={COLORS.primary}
            strokeWidth={2}
            fill="url(#radarGradient)"
            fillOpacity={0.7}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default {
  GradientAreaChart3D,
  BarChart3D,
  DonutChart3D,
  MultiLineChart3D,
  RadarChart3D
};
