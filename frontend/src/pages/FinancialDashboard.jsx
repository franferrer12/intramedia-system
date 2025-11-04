import { useState, useEffect } from 'react';
import { profitDistributionAPI } from '../services/api';
import {
  Home,
  DollarSign,
  Calendar,
  TrendingUp,
  Download,
  Users,
  FileText,
  PieChart as PieChartIcon,
  Printer,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Breadcrumbs, Skeleton, SkeletonCard, Select, ExportButton } from '../components';
import { toast } from 'react-hot-toast';

const FinancialDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [partnersSummary, setPartnersSummary] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Colores por socio
  const PARTNER_COLORS = {
    'Fran': '#9333ea',      // Morado
    'Roberto': '#3b82f6',   // Azul
    'Pablo': '#10b981'      // Verde
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar datos en paralelo
      const [partnersRes, monthlyRes] = await Promise.all([
        profitDistributionAPI.getPartnersSummary(),
        profitDistributionAPI.getMonthlySummary()
      ]);

      setPartnersSummary(partnersRes.data.data || []);
      setMonthlySummary(monthlyRes.data.data || []);
    } catch (error) {
      console.error('Error cargando datos financieros:', error);
      toast.error('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filtrar datos por año
  const filteredMonthly = selectedYear
    ? monthlySummary.filter(item => {
        const year = item.mes_año ? parseInt(item.mes_año.split('-')[0]) : null;
        return year === selectedYear;
      })
    : monthlySummary;

  // Calcular totales
  const calculateTotals = () => {
    return filteredMonthly.reduce((acc, item) => {
      return {
        total_eventos: acc.total_eventos + (parseInt(item.total_eventos) || 0),
        ingresos_totales: acc.ingresos_totales + (parseFloat(item.ingresos_totales) || 0),
        beneficio_bruto: acc.beneficio_bruto + (parseFloat(item.beneficio_bruto) || 0),
        gastos_fijos_totales: acc.gastos_fijos_totales + (parseFloat(item.total_gastos_fijos) || 0),
        inversion_totales: acc.inversion_totales + (parseFloat(item.total_inversion) || 0),
        total_fran: acc.total_fran + (parseFloat(item.total_fran) || 0),
        total_roberto: acc.total_roberto + (parseFloat(item.total_roberto) || 0),
        total_pablo: acc.total_pablo + (parseFloat(item.total_pablo) || 0),
      };
    }, {
      total_eventos: 0,
      ingresos_totales: 0,
      beneficio_bruto: 0,
      gastos_fijos_totales: 0,
      inversion_totales: 0,
      total_fran: 0,
      total_roberto: 0,
      total_pablo: 0
    });
  };

  const totals = calculateTotals();

  // Preparar datos para gráfico de evolución
  const chartData = filteredMonthly.map(item => ({
    mes: item.mes_año,
    'Beneficio Bruto': parseFloat(item.beneficio_bruto) || 0,
    'Ingresos': parseFloat(item.ingresos_totales) || 0,
    'Gastos Fijos': parseFloat(item.total_gastos_fijos) || 0,
    'Inversión': parseFloat(item.total_inversion) || 0
  }));

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = [
      'Mes/Año',
      'Total Eventos',
      'Ingresos Totales',
      'Beneficio Bruto',
      'Gastos Fijos',
      'Inversión',
      'Fran',
      'Roberto',
      'Pablo',
      'Total Socios',
      'Margen %'
    ];

    const rows = filteredMonthly.map(item => {
      const totalSocios = (parseFloat(item.total_fran) || 0) +
                         (parseFloat(item.total_roberto) || 0) +
                         (parseFloat(item.total_pablo) || 0);
      const margen = item.ingresos_totales > 0
        ? ((parseFloat(item.beneficio_bruto) / parseFloat(item.ingresos_totales)) * 100).toFixed(2)
        : '0.00';

      return [
        item.mes_año,
        item.total_eventos,
        formatCurrency(item.ingresos_totales),
        formatCurrency(item.beneficio_bruto),
        formatCurrency(item.total_gastos_fijos),
        formatCurrency(item.total_inversion),
        formatCurrency(item.total_fran),
        formatCurrency(item.total_roberto),
        formatCurrency(item.total_pablo),
        formatCurrency(totalSocios),
        `${margen}%`
      ];
    });

    // Agregar fila de totales
    const totalSocios = totals.total_fran + totals.total_roberto + totals.total_pablo;
    const margenTotal = totals.ingresos_totales > 0
      ? ((totals.beneficio_bruto / totals.ingresos_totales) * 100).toFixed(2)
      : '0.00';

    rows.push([
      'TOTAL',
      totals.total_eventos,
      formatCurrency(totals.ingresos_totales),
      formatCurrency(totals.beneficio_bruto),
      formatCurrency(totals.gastos_fijos_totales),
      formatCurrency(totals.inversion_totales),
      formatCurrency(totals.total_fran),
      formatCurrency(totals.total_roberto),
      formatCurrency(totals.total_pablo),
      formatCurrency(totalSocios),
      `${margenTotal}%`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analisis-financiero-${selectedYear}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Archivo CSV descargado');
  };

  // Imprimir
  const handlePrint = () => {
    window.print();
    toast.success('Preparando impresión...');
  };

  // Años disponibles
  const availableYears = [...new Set(monthlySummary.map(item => {
    const year = item.mes_año ? parseInt(item.mes_año.split('-')[0]) : null;
    return year;
  }).filter(Boolean))].sort((a, b) => b - a);

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

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Inicio', path: '/', icon: Home },
          { label: 'Análisis Financiero', path: '/financial', icon: DollarSign }
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Análisis Financiero</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Resumen completo de ingresos, gastos y distribución</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Selector de año */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full sm:w-32"
            >
              <option value="">Todos</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: Resumen por Socios */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-600" />
          Resumen por Socios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partnersSummary.map((partner, index) => {
            const color = PARTNER_COLORS[partner.partner_name] || '#6b7280';
            const avgPerEvent = partner.total_events > 0
              ? partner.total_accumulated / partner.total_events
              : 0;

            return (
              <div
                key={partner.partner_name}
                className="card hover:shadow-lg transition-shadow border-t-4"
                style={{ borderTopColor: color }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                    style={{ backgroundColor: color }}
                  >
                    {partner.partner_name ? partner.partner_name.charAt(0) : '?'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {partner.partner_name || 'Sin nombre'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {partner.total_events || 0} eventos
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Total Acumulado</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(partner.total_accumulated)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Promedio/Evento</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(avgPerEvent)}
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Eventos</p>
                      <p className="text-lg font-bold text-purple-600">
                        {partner.total_events || 0}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Primer evento:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(partner.first_event_date)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Último evento:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(partner.last_event_date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 2: Resumen Mensual */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-600" />
          Resumen Mensual {selectedYear ? `- ${selectedYear}` : '(Todos los años)'}
        </h2>

        <div className="card overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-purple-600">
                <th className="text-left py-3 px-4 text-gray-900 dark:text-white font-bold">Mes/Año</th>
                <th className="text-center py-3 px-4 text-gray-900 dark:text-white font-bold">Eventos</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white font-bold">Ingresos</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white font-bold">Beneficio Bruto</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white font-bold">Gastos Fijos</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white font-bold">Inversión</th>
                <th className="text-right py-3 px-4 text-purple-600 dark:text-purple-400 font-bold">Fran</th>
                <th className="text-right py-3 px-4 text-blue-600 dark:text-blue-400 font-bold">Roberto</th>
                <th className="text-right py-3 px-4 text-green-600 dark:text-green-400 font-bold">Pablo</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white font-bold">Total Socios</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white font-bold">Margen %</th>
              </tr>
            </thead>
            <tbody>
              {filteredMonthly.map((item, idx) => {
                const totalSocios = (parseFloat(item.total_fran) || 0) +
                                   (parseFloat(item.total_roberto) || 0) +
                                   (parseFloat(item.total_pablo) || 0);
                const margen = item.ingresos_totales > 0
                  ? ((parseFloat(item.beneficio_bruto) / parseFloat(item.ingresos_totales)) * 100).toFixed(1)
                  : '0.0';

                return (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{item.mes_año}</td>
                    <td className="py-3 px-4 text-center text-gray-900 dark:text-white">{item.total_eventos}</td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                      {formatCurrency(item.ingresos_totales)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-green-600">
                      {formatCurrency(item.beneficio_bruto)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600">
                      {formatCurrency(item.total_gastos_fijos)}
                    </td>
                    <td className="py-3 px-4 text-right text-orange-600">
                      {formatCurrency(item.total_inversion)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-purple-600">
                      {formatCurrency(item.total_fran)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-blue-600">
                      {formatCurrency(item.total_roberto)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-green-600">
                      {formatCurrency(item.total_pablo)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(totalSocios)}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${
                      parseFloat(margen) >= 20 ? 'text-green-600' :
                      parseFloat(margen) >= 10 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {margen}%
                    </td>
                  </tr>
                );
              })}

              {/* Fila de totales */}
              <tr className="bg-purple-100 dark:bg-purple-900/30 font-bold border-t-2 border-purple-600">
                <td className="py-4 px-4 text-gray-900 dark:text-white">TOTAL</td>
                <td className="py-4 px-4 text-center text-gray-900 dark:text-white">{totals.total_eventos}</td>
                <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                  {formatCurrency(totals.ingresos_totales)}
                </td>
                <td className="py-4 px-4 text-right text-green-600">
                  {formatCurrency(totals.beneficio_bruto)}
                </td>
                <td className="py-4 px-4 text-right text-red-600">
                  {formatCurrency(totals.gastos_fijos_totales)}
                </td>
                <td className="py-4 px-4 text-right text-orange-600">
                  {formatCurrency(totals.inversion_totales)}
                </td>
                <td className="py-4 px-4 text-right text-purple-600">
                  {formatCurrency(totals.total_fran)}
                </td>
                <td className="py-4 px-4 text-right text-blue-600">
                  {formatCurrency(totals.total_roberto)}
                </td>
                <td className="py-4 px-4 text-right text-green-600">
                  {formatCurrency(totals.total_pablo)}
                </td>
                <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                  {formatCurrency(totals.total_fran + totals.total_roberto + totals.total_pablo)}
                </td>
                <td className={`py-4 px-4 text-right ${
                  totals.ingresos_totales > 0 && (totals.beneficio_bruto / totals.ingresos_totales * 100) >= 20
                    ? 'text-green-600'
                    : totals.ingresos_totales > 0 && (totals.beneficio_bruto / totals.ingresos_totales * 100) >= 10
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {totals.ingresos_totales > 0
                    ? ((totals.beneficio_bruto / totals.ingresos_totales) * 100).toFixed(1)
                    : '0.0'}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 3: Gráficos */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          Evolución Financiera
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Beneficio Bruto */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Evolución del Beneficio Bruto
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Beneficio Bruto"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Ingresos vs Gastos */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Ingresos vs Gastos e Inversión
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Ingresos" fill="#10b981" />
                <Bar dataKey="Gastos Fijos" fill="#ef4444" />
                <Bar dataKey="Inversión" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de distribución por socios */}
        <div className="card mt-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Distribución Mensual por Socios
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={filteredMonthly.map(item => ({
              mes: item.mes_año,
              'Fran': parseFloat(item.total_fran) || 0,
              'Roberto': parseFloat(item.total_roberto) || 0,
              'Pablo': parseFloat(item.total_pablo) || 0
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Fran" fill="#9333ea" />
              <Bar dataKey="Roberto" fill="#3b82f6" />
              <Bar dataKey="Pablo" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumen de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:bg-gray-800 border-t-4 border-green-600">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ingresos Totales</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totals.ingresos_totales)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {filteredMonthly.length} meses
          </p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:bg-gray-800 border-t-4 border-purple-600">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Beneficio Bruto</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(totals.beneficio_bruto)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Margen: {totals.ingresos_totales > 0
              ? ((totals.beneficio_bruto / totals.ingresos_totales) * 100).toFixed(1)
              : '0.0'}%
          </p>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gray-800 border-t-4 border-blue-600">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Eventos</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {totals.total_eventos}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Promedio: {filteredMonthly.length > 0
              ? (totals.total_eventos / filteredMonthly.length).toFixed(1)
              : '0'} eventos/mes
          </p>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:bg-gray-800 border-t-4 border-orange-600">
          <div className="flex items-center gap-3 mb-2">
            <PieChartIcon className="w-8 h-8 text-orange-600" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Socios</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(totals.total_fran + totals.total_roberto + totals.total_pablo)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Distribuido a 3 socios
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
