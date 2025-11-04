import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, AlertCircle, CheckCircle, Calendar, Star, FileDown, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportClientFinancialToPDF, exportClientFinancialToExcel } from '../utils/exportService';

const ClientesFinancial = () => {
  const navigate = useNavigate();
  const [clienteStats, setClienteStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    activo: true,
    orderBy: 'facturacion_total',
    orderDir: 'DESC'
  });

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`http://localhost:3001/api/clientes-financial/financial-stats?${query}`);
      const data = await response.json();

      if (data.success) {
        setClienteStats(data.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar estadísticas de clientes');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTotalStats = () => {
    return clienteStats.reduce((acc, cliente) => ({
      totalFacturacion: acc.totalFacturacion + parseFloat(cliente.facturacion_total || 0),
      totalPendiente: acc.totalPendiente + parseFloat(cliente.total_pendiente_cobro || 0),
      totalComision: acc.totalComision + parseFloat(cliente.comision_total_agencia || 0),
      totalEventos: acc.totalEventos + parseInt(cliente.total_eventos || 0)
    }), { totalFacturacion: 0, totalPendiente: 0, totalComision: 0, totalEventos: 0 });
  };

  const getClasificacionColor = (clasificacion) => {
    const colors = {
      'VIP': 'bg-purple-100 text-purple-700',
      'Premium': 'bg-blue-100 text-blue-700',
      'Regular': 'bg-green-100 text-green-700',
      'Nuevo': 'bg-yellow-100 text-yellow-700',
      'Sin eventos': 'bg-gray-100 text-gray-500'
    };
    return colors[clasificacion] || 'bg-gray-100 text-gray-500';
  };

  const getEstadoActividadBadge = (estado) => {
    const styles = {
      'Muy activo': 'bg-green-100 text-green-700',
      'Activo': 'bg-blue-100 text-blue-700',
      'Inactivo': 'bg-orange-100 text-orange-700',
      'Muy inactivo': 'bg-red-100 text-red-700',
      'Sin actividad': 'bg-gray-100 text-gray-500'
    };
    return styles[estado] || 'bg-gray-100 text-gray-500';
  };

  const stats = getTotalStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análisis Financiero de Clientes</h1>
          <p className="text-gray-600 mt-1">Rendimiento, facturación y cobros pendientes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportClientFinancialToPDF(clienteStats, stats)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => exportClientFinancialToExcel(clienteStats, stats)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Facturación Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalFacturacion)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cobros Pendientes</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(stats.totalPendiente)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Comisión Total Agencia</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(stats.totalComision)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Eventos</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {stats.totalEventos}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-4 items-center flex-wrap">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.activo}
              onChange={(e) => setFilters({ ...filters, activo: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Solo clientes activos</span>
          </label>

          <select
            value={filters.orderBy}
            onChange={(e) => setFilters({ ...filters, orderBy: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="facturacion_total">Facturación Total</option>
            <option value="comision_total_agencia">Comisión Agencia</option>
            <option value="total_eventos">Nº Eventos</option>
            <option value="total_pendiente_cobro">Pendiente Cobro</option>
            <option value="precio_medio_evento">Precio Medio</option>
          </select>

          <button
            onClick={() => navigate('/clientes-payments-pending')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Gestionar Cobros Pendientes
          </button>

          <button
            onClick={() => navigate('/clientes-loyalty')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Análisis de Fidelidad
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clasificación
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eventos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facturación Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comisión Agencia
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pendiente Cobro
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Cobrado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : clienteStats.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                clienteStats.map((cliente) => (
                  <tr
                    key={cliente.cliente_id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/cliente-metrics?id=${cliente.cliente_id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-700 font-semibold text-sm">
                            {cliente.cliente_nombre ? cliente.cliente_nombre.substring(0, 2).toUpperCase() : '??'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {cliente.cliente_nombre || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {cliente.cliente_ciudad || 'Sin ciudad'} • {cliente.cliente_email || 'Sin email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getClasificacionColor(cliente.clasificacion_cliente)}`}>
                        {cliente.clasificacion_cliente}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoActividadBadge(cliente.estado_actividad)}`}>
                        {cliente.estado_actividad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      <span className="font-medium">{cliente.total_eventos}</span>
                      <div className="text-xs text-gray-500">
                        {cliente.eventos_ultimo_mes} último mes
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(cliente.facturacion_total)}
                      <div className="text-xs text-gray-500">
                        {formatCurrency(cliente.precio_medio_evento)}/evento
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                      {formatCurrency(cliente.comision_total_agencia)}
                      <div className="text-xs text-gray-500">
                        {formatCurrency(cliente.comision_promedio_evento)}/evento
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {parseFloat(cliente.total_pendiente_cobro) > 0 ? (
                        <div className="text-sm font-medium text-orange-600">
                          {formatCurrency(cliente.total_pendiente_cobro)}
                          <div className="text-xs text-gray-500">
                            {cliente.eventos_pendiente_cobro} eventos
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-green-600 flex items-center justify-end gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Todo cobrado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-full max-w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(cliente.porcentaje_eventos_cobrados) > 80
                                ? 'bg-green-500'
                                : parseFloat(cliente.porcentaje_eventos_cobrados) > 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${cliente.porcentaje_eventos_cobrados}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 min-w-10 text-right">
                          {cliente.porcentaje_eventos_cobrados}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientesFinancial;
