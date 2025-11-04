import { useState, useEffect } from 'react';
import { sociosAPI } from '../services/api';
import { Users, DollarSign, TrendingUp, Calendar, PieChart as PieChartIcon, Home } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { ExportButton, Breadcrumbs, Skeleton, SkeletonCard, Select } from '../components';

const SocioCard = ({ socio, index, colors }) => (
  <div className="card hover:shadow-lg transition-shadow">
    <div className="flex items-center gap-4 mb-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
        style={{ backgroundColor: colors[index] }}
      >
        {socio.nombre.charAt(0)}
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{socio.nombre}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{socio.porcentaje_participacion}% de participación</p>
      </div>
    </div>

    <div className="space-y-3">
      <div className="p-3 bg-green-50 dark:bg-gray-700/50 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos del Año</p>
        <p className="text-2xl font-bold text-green-600">
          €{parseFloat(socio.ingreso_total_año || 0).toLocaleString('es-ES', {minimumFractionDigits: 2})}
        </p>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">Eventos Gestionados</p>
        <p className="text-2xl font-bold text-blue-600">
          {socio.eventos_año || 0}
        </p>
      </div>

      <div className="p-3 bg-purple-50 dark:bg-gray-700/50 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">Comisión Total</p>
        <p className="text-lg font-bold text-purple-600">
          €{parseFloat(socio.comision_total_año || 0).toLocaleString('es-ES', {minimumFractionDigits: 2})}
        </p>
      </div>
    </div>
  </div>
);

const Socios = () => {
  const [dashboard, setDashboard] = useState(null);
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar dashboard de socios
      const dashboardRes = await sociosAPI.getDashboard();
      setDashboard(dashboardRes.data.data);

      // Cargar reporte detallado
      const reporteRes = await sociosAPI.getReporte(selectedYear);
      setReporte(reporteRes.data.data);

    } catch (error) {
      console.error('Error cargando datos de socios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  // Preparar datos para gráfico de pie
  const pieData = dashboard?.socios?.map((socio, idx) => ({
    name: socio.nombre,
    value: parseFloat(socio.ingreso_total_año || 0),
    porcentaje: parseFloat(socio.porcentaje_participacion)
  })) || [];

  // Preparar datos de evolución mensual
  const evolucionData = dashboard?.evolucion_mensual?.map(item => {
    const base = {
      mes: item.mes,
      comision_total: parseFloat(item.comision_total || 0)
    };

    // Añadir cada socio
    dashboard.socios.forEach(socio => {
      base[socio.nombre] = (parseFloat(item.comision_total || 0) * parseFloat(socio.porcentaje_participacion) / 100);
    });

    return base;
  }) || [];

  const totalIngresosAgencia = dashboard?.socios?.reduce(
    (sum, socio) => sum + parseFloat(socio.ingreso_total_año || 0), 0
  ) || 0;

  const totalEventos = dashboard?.socios?.[0]?.eventos_año || 0;

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Inicio', path: '/', icon: Home },
          { label: 'Socios', path: '/socios', icon: Users }
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Socios / Dueños</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Distribución de ingresos de la agencia</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Selector de año */}
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full sm:w-32"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>

          <ExportButton
            datos={reporte?.reporte_mensual || dashboard?.socios || []}
            nombreArchivo={`socios-${selectedYear}-${new Date().toISOString().split('T')[0]}`}
            label="Exportar"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:bg-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ingresos Totales</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            €{totalIngresosAgencia.toLocaleString('es-ES', {minimumFractionDigits: 2})}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total distribuido en {dashboard?.year || selectedYear}</p>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Eventos Gestionados</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">{totalEventos}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total en {dashboard?.year || selectedYear}</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:bg-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Socios Activos</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">{dashboard?.socios?.length || 0}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pablo, Roberto, Fran</p>
        </div>
      </div>

      {/* Cards de cada socio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboard?.socios?.map((socio, index) => (
          <SocioCard key={socio.id} socio={socio} index={index} colors={COLORS} />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pie - Distribución */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5" />
            Distribución de Ingresos
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, porcentaje }) => `${name} (${porcentaje}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `€${value.toLocaleString('es-ES', {minimumFractionDigits: 2})}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ingresos Mensuales por Socio */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Comisión Total Mensual
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="comision_total"
                stroke="#10b981"
                strokeWidth={2}
                name="Comisión Total"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evolución Individual por Socio */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Evolución Mensual por Socio</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={evolucionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
            <Legend />
            {dashboard?.socios?.map((socio, idx) => (
              <Bar
                key={socio.id}
                dataKey={socio.nombre}
                fill={COLORS[idx]}
                name={`${socio.nombre} (${socio.porcentaje_participacion}%)`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla de Reporte Mensual Detallado */}
      {reporte?.reporte_mensual && reporte.reporte_mensual.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reporte Mensual Detallado</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/20">
                  <th className="text-left py-3 px-4 text-gray-900 dark:text-white">Mes</th>
                  <th className="text-left py-3 px-4 text-gray-900 dark:text-white">Socio</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white">%</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white">Eventos</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white">Comisión Total</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white">Ingreso Socio</th>
                </tr>
              </thead>
              <tbody>
                {reporte.reporte_mensual.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{item.mes}</td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{item.socio}</td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{item.porcentaje_participacion}%</td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{item.eventos}</td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                      €{parseFloat(item.comision_total).toLocaleString('es-ES', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">
                      €{parseFloat(item.ingreso_socio).toLocaleString('es-ES', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Totales Anuales */}
      {reporte?.totales_anuales && reporte.totales_anuales.length > 0 && (
        <div className="card bg-gradient-to-r from-green-50 to-blue-50 dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Totales Anuales {selectedYear}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reporte.totales_anuales.map((total, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: COLORS[idx] }}
                  >
                    {total.socio.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{total.socio}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{total.porcentaje_participacion}%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Eventos:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{total.total_eventos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Comisión:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      €{parseFloat(total.total_comision).toLocaleString('es-ES', {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 dark:border-white/20 pt-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Ingreso Total:</span>
                    <span className="font-bold text-green-600">
                      €{parseFloat(total.total_ingreso).toLocaleString('es-ES', {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Socios;
