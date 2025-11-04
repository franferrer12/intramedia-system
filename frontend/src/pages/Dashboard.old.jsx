import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { estadisticasAPI } from '../services/api';
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  Home
} from 'lucide-react';
import ComparisonCard3D from '../components/ComparisonCard3D';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ExportButton, Breadcrumbs, Skeleton, SkeletonCard } from '../components';
import StatCard3D from '../components/StatCard3D';
import { GradientAreaChart3D, BarChart3D, DonutChart3D, MultiLineChart3D } from '../components/Charts3D';
import DJCarousel3D from '../components/DJCarousel3D';
import MinimalBackground from '../components/MinimalBackground';
import AnimatedLogo from '../components/AnimatedLogo';
import ThemeToggle from '../components/ThemeToggle';
import { motion } from 'framer-motion';
import AgencyDashboard from './AgencyDashboard';

const Dashboard = () => {
  const { user, isAgency, isIndividualDJ } = useAuth();

  // Route to appropriate dashboard based on user type
  if (isAgency()) {
    return <AgencyDashboard />;
  }

  // For individual DJs, we'll show a placeholder for now (will create DJDashboard next)
  if (isIndividualDJ()) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          DJ Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Panel de control para DJ Individual (próximamente)
        </p>
      </div>
    );
  }

  // Admin dashboard (existing dashboard)
  const [kpis, setKpis] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [crecimiento, setCrecimiento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar KPIs principales
      const kpisRes = await estadisticasAPI.getKPIs();
      setKpis(kpisRes.data.data);

      // Cargar dashboard financiero
      const dashboardRes = await estadisticasAPI.getDashboardFinanciero(selectedYear);
      setDashboardData(dashboardRes.data.data);

      // Cargar análisis de crecimiento
      const crecimientoRes = await estadisticasAPI.getCrecimiento();
      setCrecimiento(crecimientoRes.data.data);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <MinimalBackground />
        <div className="relative space-y-8 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Skeleton breadcrumbs */}
          <Skeleton className="h-6 w-32" />

          {/* Skeleton header */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>

          {/* Skeleton KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>

          {/* Skeleton charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </>
    );
  }

  // Preparar datos para gráficos
  const evolucionMensual = dashboardData?.evolucion_mensual?.map(item => ({
    mes: item.mes,
    eventos: parseInt(item.eventos) || 0,
    facturacion: parseFloat(item.facturacion) || 0,
    bolo_promedio: parseFloat(item.bolo_promedio) || 0
  })) || [];

  const topClientes = dashboardData?.top_clientes?.slice(0, 5).map(item => ({
    nombre: item.cliente_nombre?.substring(0, 20) || 'N/A',
    facturacion: parseFloat(item.facturacion_total) || 0
  })) || [];

  // Paleta de colores morados - coherente con el branding
  const COLORS = ['#9333ea', '#a855f7', '#7c3aed', '#c084fc', '#6b21a8'];

  return (
    <>
      {/* Fondo minimalista */}
      <MinimalBackground />

      <div className="relative space-y-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Breadcrumbs
            items={[
              { label: 'Inicio', path: '/', icon: Home }
            ]}
            showHome={false}
          />
        </motion.div>

        {/* Header minimalista con logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        >
          {/* Logo pequeño en la esquina */}
          <div className="flex items-center gap-5">
            <AnimatedLogo variant="isotipo" size="sm" animated={false} />
            <div>
              <h1 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-white mb-1">
                Dashboard
              </h1>
              <p className="text-base font-normal text-gray-600 dark:text-gray-400">
                Análisis financiero
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Toggle de tema */}
            <ThemeToggle />

            {/* Selector de año minimalista */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-normal rounded-lg px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full sm:w-32"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year} className="bg-gray-900">{year}</option>
              ))}
            </select>

            <ExportButton
              datos={evolucionMensual}
              nombreArchivo={`dashboard-${selectedYear}-${new Date().toISOString().split('T')[0]}`}
              label="Exportar"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-white/10 dark:hover:bg-blue-500/20 text-white font-normal text-sm px-5 py-2.5 rounded-lg border border-blue-600 dark:border-white/20 dark:hover:border-blue-500/50 transition-all"
            />
          </div>
        </motion.div>

        {/* Separador sutil */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />

        {/* KPIs Principales - Grid de 4 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard3D
            title="Eventos Este Mes"
            value={kpis?.eventos_mes_actual || 0}
            icon={Calendar}
            color="blue"
            subtitle={`${kpis?.eventos_proximos_7dias || 0} próximos en 7 días`}
            delay={0}
          />
          <StatCard3D
            title="Facturación Mes"
            value={`€${parseFloat(kpis?.facturacion_mes_actual || 0).toLocaleString('es-ES', {minimumFractionDigits: 2})}`}
            icon={DollarSign}
            color="green"
            subtitle={`Bolo promedio: €${parseFloat(kpis?.bolo_promedio_mes || 0).toFixed(2)}`}
            delay={100}
          />
          <StatCard3D
            title="Eventos Año"
            value={dashboardData?.resumen?.eventos_totales || 0}
            icon={BarChart3}
            color="orange"
            subtitle={`€${parseFloat(dashboardData?.resumen?.facturacion_total || 0).toLocaleString('es-ES')} total`}
            delay={200}
          />
          <StatCard3D
            title="Pendiente Cobro"
            value={kpis?.eventos_pendiente_cobro || 0}
            icon={Clock}
            color="red"
            subtitle={`€${parseFloat(kpis?.monto_pendiente_cobro || 0).toLocaleString('es-ES', {minimumFractionDigits: 2})}`}
            delay={300}
          />
        </div>

        {/* Segunda fila de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard3D
            title="Comisión Agencia"
            value={`€${parseFloat(dashboardData?.resumen?.comision_agencia || 0).toLocaleString('es-ES', {minimumFractionDigits: 2})}`}
            icon={DollarSign}
            color="green"
            subtitle={`De €${parseFloat(dashboardData?.resumen?.facturacion_total || 0).toLocaleString('es-ES')} total`}
            delay={0}
          />
          <StatCard3D
            title="Bolo Promedio"
            value={`€${parseFloat(dashboardData?.resumen?.bolo_promedio || 0).toFixed(2)}`}
            icon={TrendingUp}
            color="orange"
            delay={100}
          />
          <StatCard3D
            title="Próximos 30 días"
            value={kpis?.eventos_proximos_30dias || 0}
            icon={Calendar}
            color="purple"
            subtitle="Eventos confirmados"
            delay={200}
          />
        </div>

        {/* Sección: Gráficos */}
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white px-1">Evolución Temporal</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 px-1 mb-4">Análisis de eventos y facturación por mes</p>
        </div>

        {/* Gráficos minimalistas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Gráfico de Evolución Mensual - Eventos */}
          <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/20 p-6 transition-all shadow-sm hover:shadow-md">
            <BarChart3D
              data={evolucionMensual}
              dataKey="eventos"
              xKey="mes"
              title="Evolución Mensual - Eventos"
            />
          </div>

          {/* Gráfico de Evolución Mensual - Facturación 3D */}
          <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/20 p-6 transition-all shadow-sm hover:shadow-md">
            <GradientAreaChart3D
              data={evolucionMensual}
              dataKey="facturacion"
              xKey="mes"
              title="Evolución Mensual - Facturación"
            />
          </div>
        </div>

        {/* Gráfico Multi-Línea 3D: Facturación y Bolo Promedio */}
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/20 p-6 transition-all shadow-sm hover:shadow-md">
          <MultiLineChart3D
            data={evolucionMensual}
            xKey="mes"
            title="Evolución de Facturación y Bolo Promedio"
            lines={[
              { key: 'facturacion', name: 'Facturación €', color: '#9333ea' },
              { key: 'bolo_promedio', name: 'Bolo Promedio €', color: '#a855f7' }
            ]}
          />
        </div>

        {/* Carrusel 3D de DJs */}
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/20 p-6 transition-all shadow-sm hover:shadow-md">
          <DJCarousel3D />
        </div>

        {/* Sección: Top Clientes */}
        <div className="space-y-2 mt-8">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white px-1">Clientes Principales</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 px-1 mb-4">Top 5 clientes por facturación</p>
        </div>

        {/* Top Clientes con Gráfico de Dona 3D */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Lista de Top Clientes minimalista */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/20 p-6 hover:bg-gray-50 dark:hover:bg-gray-800/90 transition-all shadow-sm"
          >
            <h3 className="text-gray-900 dark:text-white font-medium text-lg mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full" />
              Ranking
            </h3>
            {topClientes.length > 0 ? (
              <div className="space-y-2.5">
                {topClientes.map((cliente, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-sm text-base"
                        style={{
                          background: `linear-gradient(135deg, ${COLORS[idx]}, ${COLORS[idx]}dd)`,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span className="font-normal text-gray-900 dark:text-white text-base">{cliente.nombre}</span>
                    </div>
                    <span className="text-lg font-medium text-green-600 dark:text-green-400">
                      €{cliente.facturacion.toLocaleString('es-ES', {minimumFractionDigits: 2})}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-300 text-center py-8 text-base">No hay datos disponibles</p>
            )}
          </motion.div>

          {/* Gráfico de Dona 3D de Top Clientes */}
          {topClientes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/20 p-6 hover:bg-gray-50 dark:hover:bg-gray-800/90 transition-all shadow-sm"
            >
              <DonutChart3D
                data={topClientes}
                nameKey="nombre"
                valueKey="facturacion"
                title="Distribución de Facturación"
              />
            </motion.div>
          )}
        </div>

        {/* Sección: Analytics Avanzados - Year over Year */}
        {dashboardData?.comparativa_anio_anterior && (
          <>
            <div className="space-y-2 mt-8">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white px-1">Analytics Avanzados</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 px-1 mb-4">Comparativa Year-over-Year con tendencias</p>
            </div>

            {/* Tarjetas comparativas 3D con sparklines */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <ComparisonCard3D
                title="Total Eventos"
                currentValue={dashboardData.resumen?.eventos_totales || 0}
                previousValue={dashboardData.comparativa_anio_anterior.eventos || 0}
                data={evolucionMensual.map(m => ({ value: m.eventos }))}
                color="blue"
                icon={Calendar}
              />

              <ComparisonCard3D
                title="Facturación Total"
                currentValue={`€${parseFloat(dashboardData.resumen?.facturacion_total || 0).toLocaleString('es-ES', {maximumFractionDigits: 0})}`}
                previousValue={parseFloat(dashboardData.comparativa_anio_anterior.facturacion || 0).toLocaleString('es-ES', {maximumFractionDigits: 0})}
                data={evolucionMensual.map(m => ({ value: m.facturacion }))}
                color="green"
                icon={DollarSign}
              />

              <ComparisonCard3D
                title="Bolo Promedio"
                currentValue={`€${parseFloat(dashboardData.resumen?.bolo_promedio || 0).toFixed(0)}`}
                previousValue={parseFloat(dashboardData.comparativa_anio_anterior.bolo_promedio || 0).toFixed(0)}
                data={evolucionMensual.map(m => ({ value: m.bolo_promedio }))}
                color="purple"
                icon={TrendingUp}
              />
            </div>
          </>
        )}

        {/* Sección: Crecimiento */}
        {crecimiento?.crecimiento_mensual && crecimiento.crecimiento_mensual.length > 0 && (
          <>
            <div className="space-y-2 mt-8">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white px-1">Análisis de Crecimiento</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 px-1 mb-4">Evolución mensual últimos 12 meses</p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/20 p-6 hover:bg-gray-50 dark:hover:bg-gray-800/90 transition-all shadow-sm"
            >
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-medium text-xs uppercase tracking-wider">Mes</th>
                    <th className="text-right py-3 px-3 text-gray-700 dark:text-gray-300 font-medium text-xs uppercase tracking-wider">Eventos</th>
                    <th className="text-right py-3 px-3 text-gray-700 dark:text-gray-300 font-medium text-xs uppercase tracking-wider">Facturación</th>
                    <th className="text-right py-3 px-3 text-gray-700 dark:text-gray-300 font-medium text-xs uppercase tracking-wider">Crecimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {crecimiento.crecimiento_mensual.slice(0, 12).map((item, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-3 px-3 text-gray-900 dark:text-white font-normal text-sm">{item.periodo}</td>
                      <td className="py-3 px-3 text-right text-gray-900 dark:text-white font-normal text-sm">{item.eventos}</td>
                      <td className="py-3 px-3 text-right text-gray-900 dark:text-white font-normal text-sm">
                        €{parseFloat(item.facturacion).toLocaleString('es-ES', {minimumFractionDigits: 2})}
                      </td>
                      <td className={`py-3 px-3 text-right font-medium text-sm ${
                        item.crecimiento_porcentaje > 0 ? 'text-green-600 dark:text-green-400' :
                        item.crecimiento_porcentaje < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {item.crecimiento_porcentaje ? `${item.crecimiento_porcentaje}%` : '-'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;
