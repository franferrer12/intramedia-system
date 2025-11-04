import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle, ArrowRight, FileDown, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportDJFinancialToPDF, exportDJFinancialToExcel } from '../utils/exportService';

const DJsFinancial = () => {
  const navigate = useNavigate();
  const [djStats, setDjStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    activo: true,
    orderBy: 'total_cobrado',
    orderDir: 'DESC'
  });

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`http://localhost:3001/api/djs-financial/financial-stats?${query}`);
      const data = await response.json();

      if (data.success) {
        setDjStats(data.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar estadísticas de DJs');
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
    return djStats.reduce((acc, dj) => ({
      totalCobrado: acc.totalCobrado + parseFloat(dj.total_cobrado || 0),
      totalPendiente: acc.totalPendiente + parseFloat(dj.total_pendiente_pago || 0),
      totalRentabilidad: acc.totalRentabilidad + parseFloat(dj.rentabilidad_total_agencia || 0),
      totalEventos: acc.totalEventos + parseInt(dj.total_eventos || 0)
    }), { totalCobrado: 0, totalPendiente: 0, totalRentabilidad: 0, totalEventos: 0 });
  };

  const stats = getTotalStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análisis Financiero de DJs</h1>
          <p className="text-gray-600 mt-1">Rendimiento, cobros y pagos pendientes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportDJFinancialToPDF(djStats, stats)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => exportDJFinancialToExcel(djStats, stats)}
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
              <p className="text-sm text-gray-600">Total Cobrado por DJs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalCobrado)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pagos Pendientes</p>
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
              <p className="text-sm text-gray-600">Rentabilidad Agencia</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {formatCurrency(stats.totalRentabilidad)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Eventos</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.totalEventos}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.activo}
              onChange={(e) => setFilters({ ...filters, activo: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Solo DJs activos</span>
          </label>

          <select
            value={filters.orderBy}
            onChange={(e) => setFilters({ ...filters, orderBy: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="total_cobrado">Total Cobrado</option>
            <option value="total_pendiente_pago">Pagos Pendientes</option>
            <option value="rentabilidad_total_agencia">Rentabilidad</option>
            <option value="total_eventos">Nº Eventos</option>
            <option value="precio_hora_medio">Precio/Hora</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DJ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eventos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cobrado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio/Hora
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pendiente Pago
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rentabilidad Agencia
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Pagado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : djStats.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                djStats.map((dj) => (
                  <tr
                    key={dj.dj_id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/dj-metrics?id=${dj.dj_id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-700 font-semibold text-sm">
                            {dj.dj_nombre.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {dj.dj_nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {dj.dj_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      <span className="font-medium">{dj.total_eventos}</span>
                      <div className="text-xs text-gray-500">
                        {dj.eventos_ultimo_trimestre} últimos 3m
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(dj.total_cobrado)}
                      <div className="text-xs text-gray-500">
                        {formatCurrency(dj.promedio_por_evento)}/evento
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {dj.precio_hora_medio > 0 ? (
                        <>
                          {formatCurrency(dj.precio_hora_medio)}
                          <div className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {dj.total_horas_trabajadas}h total
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {parseFloat(dj.total_pendiente_pago) > 0 ? (
                        <div className="text-sm font-medium text-orange-600">
                          {formatCurrency(dj.total_pendiente_pago)}
                          <div className="text-xs text-gray-500">
                            {dj.eventos_pendiente_pago} eventos
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-green-600 flex items-center justify-end gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Todo pagado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600">
                      {formatCurrency(dj.rentabilidad_total_agencia)}
                      <div className="text-xs text-gray-500">
                        {dj.margen_beneficio_porcentaje}% margen
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-full max-w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(dj.porcentaje_eventos_pagados) > 80
                                ? 'bg-green-500'
                                : parseFloat(dj.porcentaje_eventos_pagados) > 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${dj.porcentaje_eventos_pagados}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 min-w-10 text-right">
                          {dj.porcentaje_eventos_pagados}%
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

export default DJsFinancial;
