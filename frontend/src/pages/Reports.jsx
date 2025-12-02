import React, { useState, useEffect } from 'react';
import * as reportsService from '../services/reportsService';
import './Reports.css';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState(reportsService.getDefaultDateRange());
  const [quickFilter, setQuickFilter] = useState('month');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Data states
  const [dashboard, setDashboard] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [kpis, setKPIs] = useState(null);
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [topDJs, setTopDJs] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [growth, setGrowth] = useState([]);

  // Load data on mount and when date range changes
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'profit-loss') {
      loadProfitLoss();
    } else if (activeTab === 'cash-flow') {
      loadCashFlow();
    } else if (activeTab === 'kpis') {
      loadKPIs();
    } else if (activeTab === 'analysis') {
      loadAnalysis();
    }
  }, [activeTab, dateRange]);

  // Load dashboard
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getFinancialDashboard(
        dateRange.fechaInicio,
        dateRange.fechaFin
      );
      setDashboard(data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al cargar dashboard'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load P&L
  const loadProfitLoss = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getProfitLoss(
        dateRange.fechaInicio,
        dateRange.fechaFin
      );
      setProfitLoss(data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al cargar P&L'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load Cash Flow
  const loadCashFlow = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getCashFlow(
        dateRange.fechaInicio,
        dateRange.fechaFin
      );
      setCashFlow(data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al cargar flujo de efectivo'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load KPIs
  const loadKPIs = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getFinancialKPIs(
        dateRange.fechaInicio,
        dateRange.fechaFin
      );
      setKPIs(data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al cargar KPIs'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load analysis data
  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const [revenue, djs, expenses, growthData] = await Promise.all([
        reportsService.getRevenueByCategory(dateRange.fechaInicio, dateRange.fechaFin),
        reportsService.getTopDJs(dateRange.fechaInicio, dateRange.fechaFin, 5),
        reportsService.getExpenseBreakdown(dateRange.fechaInicio, dateRange.fechaFin),
        reportsService.getMonthOverMonthGrowth(dateRange.fechaInicio, dateRange.fechaFin)
      ]);
      setRevenueByCategory(revenue);
      setTopDJs(djs);
      setExpenseBreakdown(expenses);
      setGrowth(growthData);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al cargar análisis'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle quick filter change
  const handleQuickFilterChange = (filter) => {
    setQuickFilter(filter);
    let newRange;

    switch (filter) {
      case 'month':
        newRange = reportsService.getDefaultDateRange();
        break;
      case '3months':
        newRange = reportsService.getLastNMonths(3);
        break;
      case '6months':
        newRange = reportsService.getLastNMonths(6);
        break;
      case 'ytd':
        newRange = reportsService.getYearToDate();
        break;
      default:
        newRange = reportsService.getDefaultDateRange();
    }

    setDateRange(newRange);
  };

  // Handle custom date change
  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
    setQuickFilter('custom');
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Reportes Financieros</h1>

        {message && (
          <div className={`alert ${message.type}`}>
            {message.text}
            <button onClick={() => setMessage(null)}>×</button>
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="reports-filters">
        <div className="quick-filters">
          <button
            className={quickFilter === 'month' ? 'active' : ''}
            onClick={() => handleQuickFilterChange('month')}
          >
            Este Mes
          </button>
          <button
            className={quickFilter === '3months' ? 'active' : ''}
            onClick={() => handleQuickFilterChange('3months')}
          >
            Últimos 3 Meses
          </button>
          <button
            className={quickFilter === '6months' ? 'active' : ''}
            onClick={() => handleQuickFilterChange('6months')}
          >
            Últimos 6 Meses
          </button>
          <button
            className={quickFilter === 'ytd' ? 'active' : ''}
            onClick={() => handleQuickFilterChange('ytd')}
          >
            Año a la Fecha
          </button>
        </div>

        <div className="custom-date-range">
          <label>
            Desde:
            <input
              type="date"
              value={dateRange.fechaInicio}
              onChange={(e) => handleDateChange('fechaInicio', e.target.value)}
            />
          </label>
          <label>
            Hasta:
            <input
              type="date"
              value={dateRange.fechaFin}
              onChange={(e) => handleDateChange('fechaFin', e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="reports-tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'profit-loss' ? 'active' : ''}
          onClick={() => setActiveTab('profit-loss')}
        >
          Estado de Resultados (P&L)
        </button>
        <button
          className={activeTab === 'cash-flow' ? 'active' : ''}
          onClick={() => setActiveTab('cash-flow')}
        >
          Flujo de Efectivo
        </button>
        <button
          className={activeTab === 'kpis' ? 'active' : ''}
          onClick={() => setActiveTab('kpis')}
        >
          KPIs Financieros
        </button>
        <button
          className={activeTab === 'analysis' ? 'active' : ''}
          onClick={() => setActiveTab('analysis')}
        >
          Análisis Detallado
        </button>
      </div>

      {/* Content */}
      <div className="reports-content">
        {loading ? (
          <div className="loading">Cargando datos...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && dashboard && (
              <DashboardTab data={dashboard} />
            )}
            {activeTab === 'profit-loss' && profitLoss && (
              <ProfitLossTab data={profitLoss} />
            )}
            {activeTab === 'cash-flow' && cashFlow && (
              <CashFlowTab data={cashFlow} />
            )}
            {activeTab === 'kpis' && kpis && (
              <KPIsTab data={kpis} />
            )}
            {activeTab === 'analysis' && (
              <AnalysisTab
                revenueByCategory={revenueByCategory}
                topDJs={topDJs}
                expenseBreakdown={expenseBreakdown}
                growth={growth}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// DASHBOARD TAB
// ============================================================================

const DashboardTab = ({ data }) => {
  const { profit_loss, cash_flow, kpis, revenue_by_category, top_djs, expense_breakdown, growth } = data;

  return (
    <div className="dashboard-tab">
      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Ingresos Totales</h3>
          <p className="metric-value">{reportsService.formatCurrency(profit_loss.total_ingresos)}</p>
          <span className="metric-label">Total de ventas</span>
        </div>
        <div className="metric-card">
          <h3>Utilidad Neta</h3>
          <p className="metric-value">{reportsService.formatCurrency(profit_loss.total_utilidad_neta)}</p>
          <span className="metric-label">Ganancia después de gastos</span>
        </div>
        <div className="metric-card">
          <h3>Margen Bruto</h3>
          <p className="metric-value">{reportsService.formatPercentage(profit_loss.avg_margen_bruto)}</p>
          <span className="metric-label">Promedio del período</span>
        </div>
        <div className="metric-card">
          <h3>Total Eventos</h3>
          <p className="metric-value">{reportsService.formatNumber(profit_loss.total_eventos)}</p>
          <span className="metric-label">Eventos realizados</span>
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div className="section">
        <h2>Resumen de Flujo de Efectivo</h2>
        <div className="cash-flow-summary">
          <div className="flow-item">
            <span>Entradas de Efectivo:</span>
            <strong>{reportsService.formatCurrency(cash_flow.total_entradas)}</strong>
          </div>
          <div className="flow-item">
            <span>Salidas de Efectivo:</span>
            <strong>{reportsService.formatCurrency(cash_flow.total_salidas)}</strong>
          </div>
          <div className="flow-item highlight">
            <span>Flujo Neto:</span>
            <strong className={cash_flow.total_flujo_neto >= 0 ? 'positive' : 'negative'}>
              {reportsService.formatCurrency(cash_flow.total_flujo_neto)}
            </strong>
          </div>
        </div>
      </div>

      {/* Revenue by Category */}
      {revenue_by_category && revenue_by_category.length > 0 && (
        <div className="section">
          <h2>Ingresos por Categoría</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Eventos</th>
                <th>Ingresos</th>
                <th>% del Total</th>
              </tr>
            </thead>
            <tbody>
              {revenue_by_category.map((cat, idx) => (
                <tr key={idx}>
                  <td>{cat.tipo_evento}</td>
                  <td>{reportsService.formatNumber(cat.total_eventos)}</td>
                  <td>{reportsService.formatCurrency(cat.ingresos_totales)}</td>
                  <td>{reportsService.formatPercentage(cat.porcentaje_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top DJs */}
      {top_djs && top_djs.length > 0 && (
        <div className="section">
          <h2>Top 5 DJs por Ingresos</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>DJ</th>
                <th>Eventos</th>
                <th>Ingresos Generados</th>
                <th>Costo DJ</th>
                <th>Margen</th>
              </tr>
            </thead>
            <tbody>
              {top_djs.map((dj, idx) => (
                <tr key={idx}>
                  <td>{dj.dj_nombre}</td>
                  <td>{reportsService.formatNumber(dj.total_eventos)}</td>
                  <td>{reportsService.formatCurrency(dj.ingresos_generados)}</td>
                  <td>{reportsService.formatCurrency(dj.costo_total_dj)}</td>
                  <td>{reportsService.formatCurrency(dj.margen_generado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Growth Trend */}
      {growth && growth.length > 0 && (
        <div className="section">
          <h2>Tendencia de Crecimiento</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Ingresos</th>
                <th>Utilidad</th>
                <th>Eventos</th>
                <th>Crecimiento Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {growth.slice(0, 3).map((period, idx) => (
                <tr key={idx}>
                  <td>{new Date(period.periodo).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })}</td>
                  <td>{reportsService.formatCurrency(period.ingresos_brutos)}</td>
                  <td>{reportsService.formatCurrency(period.utilidad_neta)}</td>
                  <td>{reportsService.formatNumber(period.total_eventos)}</td>
                  <td className={period.crecimiento_ingresos >= 0 ? 'positive' : 'negative'}>
                    {period.crecimiento_ingresos ? `${period.crecimiento_ingresos}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PROFIT & LOSS TAB
// ============================================================================

const ProfitLossTab = ({ data }) => {
  const { detail, summary } = data;

  return (
    <div className="profit-loss-tab">
      {/* Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Ingresos Brutos</h3>
          <p className="metric-value">{reportsService.formatCurrency(summary.total_ingresos)}</p>
        </div>
        <div className="metric-card">
          <h3>Margen Bruto</h3>
          <p className="metric-value">{reportsService.formatCurrency(summary.total_margen_bruto)}</p>
          <span className="metric-label">{reportsService.formatPercentage(summary.avg_margen_bruto)} promedio</span>
        </div>
        <div className="metric-card">
          <h3>Gastos Operativos</h3>
          <p className="metric-value">{reportsService.formatCurrency(summary.total_gastos_operativos)}</p>
        </div>
        <div className="metric-card highlight">
          <h3>Utilidad Neta</h3>
          <p className="metric-value">{reportsService.formatCurrency(summary.total_utilidad_neta)}</p>
          <span className="metric-label">{reportsService.formatPercentage(summary.avg_margen_operativo)} margen</span>
        </div>
      </div>

      {/* Detailed P&L by Period */}
      <div className="section">
        <h2>Estado de Resultados por Período</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Ingresos Brutos</th>
              <th>Costo DJs</th>
              <th>Margen Bruto</th>
              <th>% Margen</th>
              <th>Gastos Operativos</th>
              <th>Utilidad Neta</th>
              <th>Eventos</th>
            </tr>
          </thead>
          <tbody>
            {detail.map((period, idx) => (
              <tr key={idx}>
                <td>{new Date(period.periodo).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })}</td>
                <td>{reportsService.formatCurrency(period.ingresos_brutos)}</td>
                <td>{reportsService.formatCurrency(period.costo_djs)}</td>
                <td>{reportsService.formatCurrency(period.margen_bruto)}</td>
                <td>{reportsService.formatPercentage(period.porcentaje_margen_bruto)}</td>
                <td>{reportsService.formatCurrency(period.gastos_operativos)}</td>
                <td className={period.utilidad_neta >= 0 ? 'positive' : 'negative'}>
                  {reportsService.formatCurrency(period.utilidad_neta)}
                </td>
                <td>{reportsService.formatNumber(period.total_eventos)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td><strong>TOTAL</strong></td>
              <td><strong>{reportsService.formatCurrency(summary.total_ingresos)}</strong></td>
              <td><strong>{reportsService.formatCurrency(summary.total_costos_dj)}</strong></td>
              <td><strong>{reportsService.formatCurrency(summary.total_margen_bruto)}</strong></td>
              <td><strong>{reportsService.formatPercentage(summary.avg_margen_bruto)}</strong></td>
              <td><strong>{reportsService.formatCurrency(summary.total_gastos_operativos)}</strong></td>
              <td><strong>{reportsService.formatCurrency(summary.total_utilidad_neta)}</strong></td>
              <td><strong>{reportsService.formatNumber(summary.total_eventos)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// CASH FLOW TAB
// ============================================================================

const CashFlowTab = ({ data }) => {
  const { detail, summary } = data;

  return (
    <div className="cash-flow-tab">
      {/* Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card positive">
          <h3>Entradas Totales</h3>
          <p className="metric-value">{reportsService.formatCurrency(summary.total_entradas)}</p>
        </div>
        <div className="metric-card negative">
          <h3>Salidas Totales</h3>
          <p className="metric-value">{reportsService.formatCurrency(summary.total_salidas)}</p>
        </div>
        <div className="metric-card">
          <h3>Flujo Operativo</h3>
          <p className="metric-value">{reportsService.formatCurrency(summary.total_flujo_operativo)}</p>
        </div>
        <div className="metric-card highlight">
          <h3>Flujo Neto</h3>
          <p className="metric-value">{reportsService.formatCurrency(summary.total_flujo_neto)}</p>
        </div>
      </div>

      {/* Detailed Cash Flow */}
      <div className="section">
        <h2>Flujo de Efectivo por Período</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Entradas Operativas</th>
              <th>Salidas Operativas</th>
              <th>Flujo Operativo</th>
              <th>Flujo Neto</th>
              <th>Efectivo Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {detail.map((period, idx) => (
              <tr key={idx}>
                <td>{new Date(period.periodo).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })}</td>
                <td className="positive">{reportsService.formatCurrency(period.entrada_efectivo_operaciones)}</td>
                <td className="negative">{reportsService.formatCurrency(period.salida_efectivo_operaciones)}</td>
                <td className={period.flujo_efectivo_operativo >= 0 ? 'positive' : 'negative'}>
                  {reportsService.formatCurrency(period.flujo_efectivo_operativo)}
                </td>
                <td className={period.flujo_efectivo_neto >= 0 ? 'positive' : 'negative'}>
                  {reportsService.formatCurrency(period.flujo_efectivo_neto)}
                </td>
                <td><strong>{reportsService.formatCurrency(period.efectivo_acumulado)}</strong></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td><strong>TOTAL</strong></td>
              <td className="positive"><strong>{reportsService.formatCurrency(summary.total_entradas)}</strong></td>
              <td className="negative"><strong>{reportsService.formatCurrency(summary.total_salidas)}</strong></td>
              <td><strong>{reportsService.formatCurrency(summary.total_flujo_operativo)}</strong></td>
              <td><strong>{reportsService.formatCurrency(summary.total_flujo_neto)}</strong></td>
              <td><strong>{reportsService.formatCurrency(summary.efectivo_final)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// KPIs TAB
// ============================================================================

const KPIsTab = ({ data }) => {
  const { detail, summary } = data;

  return (
    <div className="kpis-tab">
      {/* Key KPIs */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>ROI Promedio</h3>
          <p className="metric-value">{reportsService.formatPercentage(summary.avg_roi)}</p>
        </div>
        <div className="metric-card">
          <h3>Margen de Contribución</h3>
          <p className="metric-value">{reportsService.formatPercentage(summary.avg_margin)}</p>
        </div>
        <div className="metric-card">
          <h3>Ingreso por Evento</h3>
          <p className="metric-value">{reportsService.formatCurrency(summary.avg_revenue_per_event)}</p>
        </div>
        <div className="metric-card">
          <h3>Costo por Evento</h3>
          <p className="metric-value">{reportsService.formatCurrency(summary.avg_cost_per_event)}</p>
        </div>
        <div className="metric-card highlight">
          <h3>Ganancia por Evento</h3>
          <p className="metric-value">{reportsService.formatCurrency(summary.avg_profit_per_event)}</p>
        </div>
        <div className="metric-card">
          <h3>Punto de Equilibrio</h3>
          <p className="metric-value">{reportsService.formatNumber(summary.avg_break_even, 1)} eventos</p>
        </div>
      </div>

      {/* Detailed KPIs by Period */}
      <div className="section">
        <h2>KPIs Financieros por Período</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Ingresos</th>
              <th>Utilidad</th>
              <th>Eventos</th>
              <th>ROI %</th>
              <th>Margen %</th>
              <th>$/Evento</th>
              <th>Break-Even</th>
            </tr>
          </thead>
          <tbody>
            {detail.map((period, idx) => (
              <tr key={idx}>
                <td>{new Date(period.periodo).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })}</td>
                <td>{reportsService.formatCurrency(period.ingresos_brutos)}</td>
                <td className={period.utilidad_neta >= 0 ? 'positive' : 'negative'}>
                  {reportsService.formatCurrency(period.utilidad_neta)}
                </td>
                <td>{reportsService.formatNumber(period.total_eventos)}</td>
                <td>{reportsService.formatPercentage(period.roi_porcentaje)}</td>
                <td>{reportsService.formatPercentage(period.margen_contribucion)}</td>
                <td>{reportsService.formatCurrency(period.revenue_per_event)}</td>
                <td>{reportsService.formatNumber(period.break_even_events, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// ANALYSIS TAB
// ============================================================================

const AnalysisTab = ({ revenueByCategory, topDJs, expenseBreakdown, growth }) => {
  return (
    <div className="analysis-tab">
      {/* Revenue by Category */}
      {revenueByCategory && revenueByCategory.length > 0 && (
        <div className="section">
          <h2>Análisis de Ingresos por Categoría</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo de Evento</th>
                <th>Total Eventos</th>
                <th>Ingresos Totales</th>
                <th>% del Total</th>
              </tr>
            </thead>
            <tbody>
              {revenueByCategory.map((cat, idx) => (
                <tr key={idx}>
                  <td><strong>{cat.tipo_evento}</strong></td>
                  <td>{reportsService.formatNumber(cat.total_eventos)}</td>
                  <td>{reportsService.formatCurrency(cat.ingresos_totales)}</td>
                  <td>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${cat.porcentaje_total}%` }}
                      ></div>
                      <span>{reportsService.formatPercentage(cat.porcentaje_total)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top DJs */}
      {topDJs && topDJs.length > 0 && (
        <div className="section">
          <h2>Top DJs por Ingresos</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>DJ</th>
                <th>Eventos</th>
                <th>Ingresos Generados</th>
                <th>Costo Total DJ</th>
                <th>Margen Generado</th>
              </tr>
            </thead>
            <tbody>
              {topDJs.map((dj, idx) => (
                <tr key={idx}>
                  <td><strong>{dj.dj_nombre}</strong></td>
                  <td>{reportsService.formatNumber(dj.total_eventos)}</td>
                  <td>{reportsService.formatCurrency(dj.ingresos_generados)}</td>
                  <td>{reportsService.formatCurrency(dj.costo_total_dj)}</td>
                  <td className="positive">{reportsService.formatCurrency(dj.margen_generado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expense Breakdown */}
      {expenseBreakdown && expenseBreakdown.length > 0 && (
        <div className="section">
          <h2>Desglose de Gastos</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Total Gastos</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {expenseBreakdown.map((expense, idx) => (
                <tr key={idx}>
                  <td><strong>{expense.categoria}</strong></td>
                  <td>{reportsService.formatCurrency(expense.total_gastos)}</td>
                  <td>{reportsService.formatNumber(expense.cantidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Growth Trend */}
      {growth && growth.length > 0 && (
        <div className="section">
          <h2>Análisis de Crecimiento Mes a Mes</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Ingresos</th>
                <th>Utilidad</th>
                <th>Eventos</th>
                <th>Δ Ingresos</th>
                <th>Δ Utilidad</th>
                <th>Δ Eventos</th>
              </tr>
            </thead>
            <tbody>
              {growth.map((period, idx) => (
                <tr key={idx}>
                  <td>{new Date(period.periodo).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })}</td>
                  <td>{reportsService.formatCurrency(period.ingresos_brutos)}</td>
                  <td>{reportsService.formatCurrency(period.utilidad_neta)}</td>
                  <td>{reportsService.formatNumber(period.total_eventos)}</td>
                  <td className={period.crecimiento_ingresos >= 0 ? 'positive' : 'negative'}>
                    {period.crecimiento_ingresos ? `${period.crecimiento_ingresos}%` : '-'}
                  </td>
                  <td className={period.crecimiento_utilidad >= 0 ? 'positive' : 'negative'}>
                    {period.crecimiento_utilidad ? `${period.crecimiento_utilidad}%` : '-'}
                  </td>
                  <td className={period.crecimiento_eventos >= 0 ? 'positive' : 'negative'}>
                    {period.crecimiento_eventos ? `${period.crecimiento_eventos}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
