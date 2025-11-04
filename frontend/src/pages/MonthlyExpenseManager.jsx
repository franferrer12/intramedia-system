import { useState, useEffect } from 'react';
import { monthlyExpensesAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Calendar,
  Calculator,
  Save,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MonthlyExpenseManager = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Real expenses state
  const [realFixedExpenses, setRealFixedExpenses] = useState(0);
  const [realInvestment, setRealInvestment] = useState(0);
  const [expenseItems, setExpenseItems] = useState([]);

  // Load period data
  const loadPeriod = async () => {
    setLoading(true);
    try {
      const response = await monthlyExpensesAPI.getByPeriod(selectedYear, selectedMonth);
      setPeriod(response.data);
      setRealFixedExpenses(response.data.real_fixed_expenses || 0);
      setRealInvestment(response.data.real_investment || 0);
      setExpenseItems(response.data.expense_breakdown || []);
      toast.success('Periodo cargado correctamente');
    } catch (error) {
      if (error.response?.status === 404) {
        setPeriod(null);
        toast.error('No existe periodo para esta fecha');
      } else {
        toast.error('Error al cargar el periodo');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate budget
  const handleCalculateBudget = async () => {
    setLoading(true);
    try {
      const response = await monthlyExpensesAPI.calculateBudget(selectedYear, selectedMonth);
      setPeriod(response.data);
      setRealFixedExpenses(0);
      setRealInvestment(0);
      setExpenseItems([]);
      toast.success('Presupuesto calculado correctamente');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al calcular presupuesto');
    } finally {
      setLoading(false);
    }
  };

  // Save real expenses
  const handleSaveRealExpenses = async () => {
    if (!period) return;

    setLoading(true);
    try {
      await monthlyExpensesAPI.update(selectedYear, selectedMonth, {
        real_fixed_expenses: parseFloat(realFixedExpenses),
        real_investment: parseFloat(realInvestment),
        expense_breakdown: expenseItems
      });
      toast.success('Gastos reales guardados');
      loadPeriod();
    } catch (error) {
      toast.error('Error al guardar gastos reales');
    } finally {
      setLoading(false);
    }
  };

  // Redistribute surplus
  const handleRedistribute = async () => {
    if (!period) return;

    setLoading(true);
    try {
      const response = await monthlyExpensesAPI.redistribute(selectedYear, selectedMonth);
      setPeriod(response.data);
      toast.success('Excedentes redistribuidos correctamente');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al redistribuir excedentes');
    } finally {
      setLoading(false);
    }
  };

  // Close period
  const handleClosePeriod = async () => {
    if (!period) return;

    setLoading(true);
    try {
      await monthlyExpensesAPI.closePeriod(selectedYear, selectedMonth);
      toast.success('Periodo cerrado correctamente');
      loadPeriod();
      setShowCloseModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cerrar periodo');
    } finally {
      setLoading(false);
    }
  };

  // Add expense item
  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { concept: '', amount: 0 }]);
  };

  // Remove expense item
  const removeExpenseItem = (index) => {
    setExpenseItems(expenseItems.filter((_, i) => i !== index));
  };

  // Update expense item
  const updateExpenseItem = (index, field, value) => {
    const updated = [...expenseItems];
    updated[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setExpenseItems(updated);
  };

  // Calculate totals
  const totalExpenseItems = expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  const surplusFixed = period ? (period.budgeted_fixed_expenses - realFixedExpenses) : 0;
  const surplusInvestment = period ? (period.budgeted_investment - realInvestment) : 0;
  const totalSurplus = surplusFixed + surplusInvestment;
  const savingsPercentage = period && period.budgeted_fixed_expenses > 0
    ? ((surplusFixed / period.budgeted_fixed_expenses) * 100).toFixed(1)
    : 0;

  // Year options
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const monthOptions = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const isClosed = period?.status === 'closed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Gastos Mensuales
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestión de gastos reales y redistribución de excedentes
          </p>
        </div>
        {period && (
          <div className="flex items-center gap-2">
            {isClosed ? (
              <span className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-semibold">
                <Lock className="w-4 h-4" />
                CERRADO
              </span>
            ) : (
              <span className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-semibold">
                <Unlock className="w-4 h-4" />
                ABIERTO
              </span>
            )}
          </div>
        )}
      </div>

      {/* Section 1: Period Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Selector de Periodo
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              disabled={loading}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mes
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              disabled={loading}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadPeriod}
              disabled={loading}
              className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : 'Cargar Periodo'}
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCalculateBudget}
              disabled={loading}
              className="w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Calcular Presupuesto
            </button>
          </div>
        </div>
      </motion.div>

      {/* Show content only if period exists */}
      {period && (
        <>
          {/* Section 2: Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Budget Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Presupuesto</h3>
                <DollarSign className="w-8 h-8 opacity-80" />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-green-100 text-sm">Gastos Fijos</p>
                  <p className="text-2xl font-bold">{formatCurrency(period.budgeted_fixed_expenses)}</p>
                </div>
                <div>
                  <p className="text-green-100 text-sm">Inversión</p>
                  <p className="text-2xl font-bold">{formatCurrency(period.budgeted_investment)}</p>
                </div>
                <div>
                  <p className="text-green-100 text-sm">Socios</p>
                  <p className="text-2xl font-bold">{formatCurrency(period.budgeted_partners)}</p>
                </div>
              </div>
            </motion.div>

            {/* Real Expenses Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Gastos Reales</h3>
                <Receipt className="w-8 h-8 opacity-80" />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-blue-100 text-sm block mb-1">Gastos Fijos Reales</label>
                  <input
                    type="number"
                    value={realFixedExpenses}
                    onChange={(e) => setRealFixedExpenses(parseFloat(e.target.value) || 0)}
                    disabled={isClosed || loading}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-blue-100 text-sm block mb-1">Inversión Real</label>
                  <input
                    type="number"
                    value={realInvestment}
                    onChange={(e) => setRealInvestment(parseFloat(e.target.value) || 0)}
                    disabled={isClosed || loading}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={handleSaveRealExpenses}
                  disabled={isClosed || loading}
                  className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Gastos Reales
                </button>
              </div>
            </motion.div>

            {/* Surplus Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Excedentes</h3>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-purple-100 text-sm">Excedente Gastos Fijos</p>
                  <p className={`text-2xl font-bold ${surplusFixed >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {formatCurrency(surplusFixed)}
                  </p>
                </div>
                <div>
                  <p className="text-purple-100 text-sm">Excedente Inversión</p>
                  <p className={`text-2xl font-bold ${surplusInvestment >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {formatCurrency(surplusInvestment)}
                  </p>
                </div>
                <div className="pt-2 border-t border-purple-400/30">
                  <p className="text-purple-100 text-sm">Excedente Total</p>
                  <p className={`text-2xl font-bold ${totalSurplus >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {formatCurrency(totalSurplus)}
                  </p>
                </div>
                <div>
                  <p className="text-purple-100 text-sm">% de Ahorro</p>
                  <p className="text-xl font-bold">{savingsPercentage}%</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Section 3: Expense Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Desglose de Gastos
              </h2>
              <button
                onClick={addExpenseItem}
                disabled={isClosed || loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Gasto
              </button>
            </div>

            <div className="space-y-3">
              {expenseItems.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={item.concept}
                    onChange={(e) => updateExpenseItem(index, 'concept', e.target.value)}
                    placeholder="Concepto"
                    disabled={isClosed || loading}
                    className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateExpenseItem(index, 'amount', e.target.value)}
                    placeholder="Monto"
                    disabled={isClosed || loading}
                    step="0.01"
                    min="0"
                    className="w-32 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <button
                    onClick={() => removeExpenseItem(index)}
                    disabled={isClosed || loading}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {expenseItems.length === 0 && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No hay gastos agregados. Haz clic en "Agregar Gasto" para comenzar.
                </p>
              )}

              {expenseItems.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">Total:</span>
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(totalExpenseItems)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Section 4: Surplus Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Distribución de Excedentes
              </h2>
              {period.redistributed ? (
                <span className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Redistribuido
                </span>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  Pendiente
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">Total a Redistribuir</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(totalSurplus)}
                </p>
              </div>

              <div className="space-y-3">
                {/* Fran */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white">Fran</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Presupuesto:</span>
                      <span>{formatCurrency(period.budgeted_fran)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Excedente:</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        +{formatCurrency(period.surplus_fran || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold">Total Final:</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency((period.budgeted_fran || 0) + (period.surplus_fran || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Roberto */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white">Roberto</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Presupuesto:</span>
                      <span>{formatCurrency(period.budgeted_roberto)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Excedente:</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        +{formatCurrency(period.surplus_roberto || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold">Total Final:</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency((period.budgeted_roberto || 0) + (period.surplus_roberto || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pablo */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white">Pablo</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Presupuesto:</span>
                      <span>{formatCurrency(period.budgeted_pablo)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Excedente:</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        +{formatCurrency(period.surplus_pablo || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold">Total Final:</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency((period.budgeted_pablo || 0) + (period.surplus_pablo || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRedistribute}
                disabled={isClosed || loading || period.redistributed}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Redistribuir Excedentes
              </button>
            </div>
          </motion.div>

          {/* Section 5: Close Period */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Cerrar Periodo
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Una vez cerrado, no podrás editar los datos de este periodo. Asegúrate de que toda la información sea correcta antes de continuar.
                </p>
                <button
                  onClick={() => setShowCloseModal(true)}
                  disabled={isClosed || loading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  Cerrar Periodo
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Close Period Confirmation Modal */}
      <AnimatePresence>
        {showCloseModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowCloseModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Confirmar Cierre
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  ¿Estás seguro de que deseas cerrar este periodo? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleClosePeriod}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Cerrando...' : 'Sí, Cerrar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthlyExpenseManager;
