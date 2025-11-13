import { useState, useEffect } from 'react';
import { monthlyExpensesAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
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
  ResponsiveContainer
} from 'recharts';

const BudgetComparison = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterYear) params.year = filterYear;
      if (filterStatus) params.status = filterStatus;

      const response = await monthlyExpensesAPI.getBudgetVsReal(params);
      setData(response.data || []);
    } catch (error) {
      toast.error('Error al cargar datos de comparativa');
      console.error(error);
      setData([]); // Always set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    loadData();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  };

  const getMonthName = (month) => {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return months[month - 1] || month;
  };

  // Calculate KPIs
  const totalSurplus = data.reduce((sum, item) => sum + (item.surplus_total || 0), 0);
  const avgSavings = data.length > 0
    ? data.reduce((sum, item) => sum + (item.savings_percentage || 0), 0) / data.length
    : 0;

  const bestMonth = data.reduce((best, item) => {
    if (!best || (item.surplus_total || 0) > (best.surplus_total || 0)) {
      return item;
    }
    return best;
  }, null);

  const worstMonth = data.reduce((worst, item) => {
    if (!worst || (item.surplus_total || 0) < (worst.surplus_total || 0)) {
      return item;
    }
    return worst;
  }, null);

  // Prepare chart data
  const chartData = data.map(item => ({
    name: `${getMonthName(item.month)}/${item.year}`,
    surplus: item.surplus_total || 0,
    budgetFixed: item.budgeted_fixed_expenses || 0,
    realFixed: item.real_fixed_expenses || 0,
    budgetInvestment: item.budgeted_investment || 0,
    realInvestment: item.real_investment || 0,
    fran: (item.budgeted_fran || 0) + (item.surplus_fran || 0),
    roberto: (item.budgeted_roberto || 0) + (item.surplus_roberto || 0),
    pablo: (item.budgeted_pablo || 0) + (item.surplus_pablo || 0)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Comparativa Presupuesto vs Real
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Dashboard de análisis financiero y evolución de excedentes
          </p>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Filtros
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Año
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos los años</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos</option>
              <option value="open">Abiertos</option>
              <option value="closed">Cerrados</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFilterChange}
              disabled={loading}
              className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Aplicar Filtros'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Excedentes</h3>
            <DollarSign className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalSurplus)}</p>
          <p className="text-sm opacity-75 mt-1">Acumulado</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">% Ahorro Promedio</h3>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatPercent(avgSavings)}</p>
          <p className="text-sm opacity-75 mt-1">Media histórica</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Mejor Mes</h3>
            <Award className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-2xl font-bold">
            {bestMonth ? `${getMonthName(bestMonth.month)}/${bestMonth.year}` : '-'}
          </p>
          <p className="text-sm opacity-75 mt-1">
            {bestMonth ? formatCurrency(bestMonth.surplus_total) : '-'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Peor Mes</h3>
            <AlertCircle className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-2xl font-bold">
            {worstMonth ? `${getMonthName(worstMonth.month)}/${worstMonth.year}` : '-'}
          </p>
          <p className="text-sm opacity-75 mt-1">
            {worstMonth ? formatCurrency(worstMonth.surplus_total) : '-'}
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Surplus Evolution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Evolución de Excedentes Mensuales
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="surplus"
                stroke="#9333ea"
                strokeWidth={3}
                name="Excedente"
                dot={{ fill: '#9333ea', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar Chart: Budget vs Real */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Presupuesto vs Real
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="budgetFixed" fill="#10b981" name="Presup. Gastos Fijos" />
              <Bar dataKey="realFixed" fill="#3b82f6" name="Real Gastos Fijos" />
              <Bar dataKey="budgetInvestment" fill="#f59e0b" name="Presup. Inversión" />
              <Bar dataKey="realInvestment" fill="#ef4444" name="Real Inversión" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Stacked Bar Chart: Partner Totals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Totales Finales por Socio (Presupuesto + Excedente)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => formatCurrency(value)}
            />
            <Legend />
            <Bar dataKey="fran" stackId="a" fill="#3b82f6" name="Fran" />
            <Bar dataKey="roberto" stackId="a" fill="#10b981" name="Roberto" />
            <Bar dataKey="pablo" stackId="a" fill="#f59e0b" name="Pablo" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Comparative Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Tabla Comparativa Detallada
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Presup. Fijos
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Real Fijos
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Exc. Fijos
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  % Ahorro
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Exc. Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Total Fran
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Total Roberto
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Total Pablo
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Cargando datos...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  const surplusFixed = (item.budgeted_fixed_expenses || 0) - (item.real_fixed_expenses || 0);
                  const totalFran = (item.budgeted_fran || 0) + (item.surplus_fran || 0);
                  const totalRoberto = (item.budgeted_roberto || 0) + (item.surplus_roberto || 0);
                  const totalPablo = (item.budgeted_pablo || 0) + (item.surplus_pablo || 0);

                  return (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {getMonthName(item.month)}/{item.year}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                        {formatCurrency(item.budgeted_fixed_expenses)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                        {formatCurrency(item.real_fixed_expenses)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${
                          surplusFixed >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrency(surplusFixed)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          {formatPercent(item.savings_percentage)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold ${
                          (item.surplus_total || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrency(item.surplus_total)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(totalFran)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(totalRoberto)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(totalPablo)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.status === 'closed' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold">
                            <Lock className="w-3 h-3" />
                            Cerrado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            Abierto
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default BudgetComparison;
