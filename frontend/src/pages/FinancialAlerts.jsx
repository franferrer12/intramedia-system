import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, CheckCircle, X, Filter, RefreshCw, TrendingUp, FileDown, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportAlertsToPDF, exportAlertsToExcel } from '../utils/exportService';

const FinancialAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [filters, setFilters] = useState({
    severity: 'all',
    alert_type: 'all',
    is_read: 'all',
    is_resolved: false
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load stats
      const statsRes = await fetch('http://localhost:3001/api/financial-alerts/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Load alerts with filters
      const params = new URLSearchParams();
      if (filters.severity !== 'all') params.append('severity', filters.severity);
      if (filters.alert_type !== 'all') params.append('alert_type', filters.alert_type);
      if (filters.is_read !== 'all') params.append('is_read', filters.is_read);
      params.append('is_resolved', filters.is_resolved);
      params.append('limit', '100');

      const alertsRes = await fetch(`http://localhost:3001/api/financial-alerts?${params.toString()}`);
      const alertsData = await alertsRes.json();
      if (alertsData.success) {
        setAlerts(alertsData.data);
      }
    } catch (error) {
      console.error('Error al cargar alertas:', error);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/financial-alerts/generate', {
        method: 'POST'
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Alertas generadas correctamente');
        loadData();
      } else {
        toast.error('Error al generar alertas');
      }
    } catch (error) {
      console.error('Error al generar alertas:', error);
      toast.error('Error al generar alertas');
    }
  };

  const handleMarkAsRead = async (alertIds) => {
    try {
      const res = await fetch('http://localhost:3001/api/financial-alerts/bulk/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.isArray(alertIds) ? alertIds : [alertIds] })
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Alertas marcadas como leídas');
        setSelectedAlerts([]);
        loadData();
      }
    } catch (error) {
      console.error('Error al marcar alertas:', error);
      toast.error('Error al marcar alertas');
    }
  };

  const handleMarkAsResolved = async (alertIds) => {
    try {
      const res = await fetch('http://localhost:3001/api/financial-alerts/bulk/resolve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.isArray(alertIds) ? alertIds : [alertIds] })
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Alertas marcadas como resueltas');
        setSelectedAlerts([]);
        loadData();
      }
    } catch (error) {
      console.error('Error al resolver alertas:', error);
      toast.error('Error al resolver alertas');
    }
  };

  const toggleSelectAlert = (id) => {
    if (selectedAlerts.includes(id)) {
      setSelectedAlerts(selectedAlerts.filter(a => a !== id));
    } else {
      setSelectedAlerts([...selectedAlerts, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map(a => a.id));
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-300',
      warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      info: 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return colors[severity] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getSeverityBadgeColor = (severity) => {
    const colors = {
      critical: 'bg-red-600 text-white',
      warning: 'bg-yellow-600 text-white',
      info: 'bg-blue-600 text-white'
    };
    return colors[severity] || 'bg-gray-600 text-white';
  };

  const getAlertTypeLabel = (type) => {
    const labels = {
      cobro_critico: 'Cobro Crítico',
      cobro_urgente: 'Cobro Urgente',
      pago_dj_pendiente: 'Pago DJ Pendiente',
      cliente_inactivo: 'Cliente Inactivo',
      dj_bajo_rendimiento: 'DJ Bajo Rendimiento',
      evento_sin_asignar: 'Evento Sin Asignar',
      rentabilidad_baja: 'Rentabilidad Baja',
      cliente_riesgo_perdida: 'Cliente en Riesgo'
    };
    return labels[type] || type;
  };

  const getAlertTypeIcon = (type) => {
    if (type.includes('cobro') || type.includes('pago')) return '💰';
    if (type.includes('cliente')) return '👥';
    if (type.includes('dj')) return '🎧';
    if (type.includes('evento')) return '📅';
    return '⚠️';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Alertas Financieras</h1>
          <p className="text-gray-600 mt-1">Gestión y seguimiento de alertas críticas del sistema</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportAlertsToPDF(alerts, stats)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => exportAlertsToExcel(alerts, stats)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar
          </button>
          <button
            onClick={handleGenerateAlerts}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Generar Alertas
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600">Críticas</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.critical_count}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600">Advertencias</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.warning_count}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">No Leídas</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total_unread}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600">Cobros Críticos</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.cobros_criticos}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Pagos DJs</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.pagos_dj}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todas las severidades</option>
            <option value="critical">Críticas</option>
            <option value="warning">Advertencias</option>
            <option value="info">Informativas</option>
          </select>

          <select
            value={filters.alert_type}
            onChange={(e) => setFilters({ ...filters, alert_type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todos los tipos</option>
            <option value="cobro_critico">Cobro Crítico</option>
            <option value="cobro_urgente">Cobro Urgente</option>
            <option value="pago_dj_pendiente">Pago DJ Pendiente</option>
            <option value="cliente_inactivo">Cliente Inactivo</option>
            <option value="cliente_riesgo_perdida">Cliente en Riesgo</option>
          </select>

          <select
            value={filters.is_read}
            onChange={(e) => setFilters({ ...filters, is_read: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todas</option>
            <option value="false">No leídas</option>
            <option value="true">Leídas</option>
          </select>

          <button
            onClick={() => setFilters({ ...filters, is_resolved: !filters.is_resolved })}
            className={`px-3 py-2 rounded-lg text-sm ${
              filters.is_resolved
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            {filters.is_resolved ? 'Mostrando resueltas' : 'Mostrando activas'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAlerts.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-indigo-700 font-medium">
            {selectedAlerts.length} alerta(s) seleccionada(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleMarkAsRead(selectedAlerts)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Marcar como leídas
            </button>
            <button
              onClick={() => handleMarkAsResolved(selectedAlerts)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Marcar como resueltas
            </button>
            <button
              onClick={() => setSelectedAlerts([])}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Cargando alertas...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No hay alertas que mostrar</p>
          </div>
        ) : (
          <div>
            {/* Select All */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedAlerts.length === alerts.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700 font-medium">
                Seleccionar todas ({alerts.length})
              </span>
            </div>

            {/* Alerts */}
            <div className="divide-y divide-gray-200">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                    !alert.is_read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.includes(alert.id)}
                      onChange={() => toggleSelectAlert(alert.id)}
                      className="mt-1 w-4 h-4 rounded"
                    />

                    <div className="text-3xl">{getAlertTypeIcon(alert.alert_type)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                            {!alert.is_read && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                Nueva
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mt-1">{alert.message}</p>

                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                            <span className={`px-2 py-1 rounded border text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {getAlertTypeLabel(alert.alert_type)}
                            </span>
                            {alert.cliente_nombre && (
                              <span className="text-xs">Cliente: {alert.cliente_nombre}</span>
                            )}
                            {alert.dj_nombre && (
                              <span className="text-xs">DJ: {alert.dj_nombre}</span>
                            )}
                            {alert.evento_nombre && (
                              <span className="text-xs">Evento: {alert.evento_nombre}</span>
                            )}
                            <span className="text-xs text-gray-500">{formatDate(alert.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!alert.is_read && (
                            <button
                              onClick={() => handleMarkAsRead([alert.id])}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Marcar como leída"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          {!alert.is_resolved && (
                            <button
                              onClick={() => handleMarkAsResolved([alert.id])}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Marcar como resuelta"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialAlerts;
