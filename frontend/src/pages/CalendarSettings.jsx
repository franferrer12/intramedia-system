/**
 * Calendar Settings Page
 * Sprint 5.2 - Google Calendar Integration
 */

import { useState, useEffect, useCallback } from 'react';
import { calendarAPI } from '../services/api';
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CloudIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const CalendarSettings = () => {
  // State
  const [connections, setConnections] = useState([]);
  const [syncStats, setSyncStats] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSyncHistoryModal, setShowSyncHistoryModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [syncHistory, setSyncHistory] = useState([]);
  const [selectedConflict, setSelectedConflict] = useState(null);

  // Form state
  const [settingsForm, setSettingsForm] = useState({
    sync_enabled: true,
    sync_direction: 'bidirectional',
    auto_sync: true,
    sync_interval_minutes: 15,
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [connectionsRes, statsRes, conflictsRes] = await Promise.all([
        calendarAPI.getConnections(),
        calendarAPI.getSyncStats(),
        calendarAPI.getConflicts(),
      ]);

      setConnections(connectionsRes.data.data);
      setSyncStats(statsRes.data.data);
      setConflicts(conflictsRes.data.data);
    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError(err.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Connect Google Calendar
  const handleConnect = async () => {
    try {
      const response = await calendarAPI.getAuthUrl();
      const authUrl = response.data.data.authUrl;
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error getting auth URL:', err);
      alert('Error al iniciar conexión con Google Calendar');
    }
  };

  // Trigger manual sync
  const handleSync = async (connectionId, direction = 'bidirectional') => {
    try {
      await calendarAPI.triggerSync(connectionId, direction);
      alert('Sincronización completada exitosamente');
      loadData();
    } catch (err) {
      console.error('Error triggering sync:', err);
      alert(err.response?.data?.error || 'Error al sincronizar');
    }
  };

  // Open settings modal
  const handleOpenSettings = (connection) => {
    setSelectedConnection(connection);
    setSettingsForm({
      sync_enabled: connection.sync_enabled,
      sync_direction: connection.sync_direction,
      auto_sync: connection.auto_sync,
      sync_interval_minutes: connection.sync_interval_minutes,
    });
    setShowSettingsModal(true);
  };

  // Save settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!selectedConnection) return;

    try {
      await calendarAPI.updateConnection(selectedConnection.id, settingsForm);
      alert('Configuración guardada exitosamente');
      setShowSettingsModal(false);
      loadData();
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Error al guardar configuración');
    }
  };

  // Delete connection
  const handleDeleteConnection = async (connectionId) => {
    if (!confirm('¿Estás seguro de desconectar Google Calendar?')) return;

    try {
      await calendarAPI.deleteConnection(connectionId);
      alert('Conexión eliminada exitosamente');
      loadData();
    } catch (err) {
      console.error('Error deleting connection:', err);
      alert('Error al eliminar conexión');
    }
  };

  // View sync history
  const handleViewSyncHistory = async (connectionId) => {
    try {
      const response = await calendarAPI.getSyncHistory(connectionId, 50, 0);
      setSyncHistory(response.data.data);
      setShowSyncHistoryModal(true);
    } catch (err) {
      console.error('Error loading sync history:', err);
      alert('Error al cargar historial');
    }
  };

  // Resolve conflict
  const handleResolveConflict = async (conflictId, strategy) => {
    try {
      await calendarAPI.resolveConflict(conflictId, {
        resolution_strategy: strategy,
        resolution_notes: `Resolved as ${strategy}`,
      });
      alert('Conflicto resuelto exitosamente');
      setShowConflictModal(false);
      loadData();
    } catch (err) {
      console.error('Error resolving conflict:', err);
      alert('Error al resolver conflicto');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      active: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircleIcon,
        label: 'Activo',
      },
      expired: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: ClockIcon,
        label: 'Expirado',
      },
      error: {
        color: 'bg-red-100 text-red-800',
        icon: XCircleIcon,
        label: 'Error',
      },
      revoked: {
        color: 'bg-gray-100 text-gray-800',
        icon: XCircleIcon,
        label: 'Revocado',
      },
    };

    const badge = badges[status] || badges.active;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-indigo-600" />
            Integración con Google Calendar
          </h1>
          <p className="text-slate-600 mt-1">
            Sincroniza tus eventos con Google Calendar automáticamente
          </p>
        </div>
        {connections.length === 0 && (
          <button
            onClick={handleConnect}
            className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <CloudIcon className="w-5 h-5" />
            Conectar Google Calendar
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <ArrowPathIcon className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <XCircleIcon className="w-12 h-12 text-red-500 mb-2" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {syncStats && syncStats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Sincronizaciones</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {syncStats[0]?.total_syncs || 0}
                    </p>
                  </div>
                  <ArrowPathIcon className="w-10 h-10 text-slate-400" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Exitosas</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {syncStats[0]?.successful_syncs || 0}
                    </p>
                  </div>
                  <CheckCircleIcon className="w-10 h-10 text-green-400" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Fallidas</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {syncStats[0]?.failed_syncs || 0}
                    </p>
                  </div>
                  <XCircleIcon className="w-10 h-10 text-red-400" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Conflictos</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {conflicts.length}
                    </p>
                  </div>
                  <ExclamationTriangleIcon className="w-10 h-10 text-yellow-400" />
                </div>
              </div>
            </div>
          )}

          {/* Connections */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Conexiones Activas</h2>
            </div>

            {connections.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <CalendarIcon className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 mb-4">
                  No hay conexiones con Google Calendar configuradas
                </p>
                <button
                  onClick={handleConnect}
                  className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Conectar Google Calendar
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-slate-900">
                            {connection.calendar_name || 'Google Calendar'}
                          </h3>
                          {getStatusBadge(connection.status)}
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          {connection.google_email}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Última sincronización:</span>
                            <p className="font-medium text-slate-900">
                              {formatDate(connection.last_sync_at)}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Dirección:</span>
                            <p className="font-medium text-slate-900 capitalize">
                              {connection.sync_direction}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Eventos mapeados:</span>
                            <p className="font-medium text-slate-900">
                              {connection.mapped_events_count || 0}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Conflictos:</span>
                            <p className="font-medium text-yellow-600">
                              {connection.conflicts_count || 0}
                            </p>
                          </div>
                        </div>

                        {connection.error_count > 0 && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <p className="font-medium">Error en sincronización</p>
                            <p className="text-xs mt-1">
                              {connection.error_message || 'Error desconocido'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleSync(connection.id, connection.sync_direction)}
                          className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50 transition-colors flex items-center gap-1"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                          Sincronizar
                        </button>
                        <button
                          onClick={() => handleViewSyncHistory(connection.id)}
                          className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-700 border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
                          <ClockIcon className="w-4 h-4" />
                          Historial
                        </button>
                        <button
                          onClick={() => handleOpenSettings(connection)}
                          className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-700 border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
                          <Cog6ToothIcon className="w-4 h-4" />
                          Configurar
                        </button>
                        <button
                          onClick={() => handleDeleteConnection(connection.id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Desconectar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Conflicts */}
          {conflicts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  Conflictos Pendientes
                </h2>
                <span className="text-sm text-slate-600">
                  {conflicts.length} conflicto{conflicts.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {conflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">
                          {conflict.evento_nombre}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {conflict.conflict_reason}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>Fecha: {formatDate(conflict.evento_fecha)}</span>
                          <span>Ubicación: {conflict.evento_ubicacion || '-'}</span>
                          <span>Detectado: {formatDate(conflict.detected_at)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedConflict(conflict);
                          setShowConflictModal(true);
                        }}
                        className="px-3 py-1.5 text-sm text-yellow-700 hover:text-yellow-800 border border-yellow-400 rounded hover:bg-yellow-100 transition-colors"
                      >
                        Resolver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">
                Configuración de Sincronización
              </h3>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              {/* Sync Enabled */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Sincronización activa
                </label>
                <input
                  type="checkbox"
                  checked={settingsForm.sync_enabled}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, sync_enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>

              {/* Sync Direction */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dirección de sincronización
                </label>
                <select
                  value={settingsForm.sync_direction}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, sync_direction: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="bidirectional">Bidireccional</option>
                  <option value="import">Solo importar (Google → Sistema)</option>
                  <option value="export">Solo exportar (Sistema → Google)</option>
                </select>
              </div>

              {/* Auto Sync */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Sincronización automática
                </label>
                <input
                  type="checkbox"
                  checked={settingsForm.auto_sync}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, auto_sync: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>

              {/* Sync Interval */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Intervalo de sincronización (minutos)
                </label>
                <input
                  type="number"
                  min="5"
                  value={settingsForm.sync_interval_minutes}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      sync_interval_minutes: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Mínimo: 5 minutos</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sync History Modal */}
      {showSyncHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                Historial de Sincronización
              </h3>
              <button
                onClick={() => setShowSyncHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {syncHistory.length === 0 ? (
                <p className="text-center text-slate-500 py-12">
                  No hay historial de sincronización
                </p>
              ) : (
                <div className="space-y-3">
                  {syncHistory.map((log) => (
                    <div
                      key={log.id}
                      className="border border-slate-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-slate-900">
                              {formatDate(log.sync_started_at)}
                            </span>
                            {log.status === 'completed' ? (
                              <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircleIcon className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs text-slate-600">
                            <div>
                              <span className="text-slate-500">Importados:</span>{' '}
                              {log.events_imported}
                            </div>
                            <div>
                              <span className="text-slate-500">Exportados:</span>{' '}
                              {log.events_exported}
                            </div>
                            <div>
                              <span className="text-slate-500">Actualizados:</span>{' '}
                              {log.events_updated}
                            </div>
                            <div>
                              <span className="text-slate-500">Conflictos:</span>{' '}
                              {log.conflicts_detected}
                            </div>
                          </div>
                          {log.duration_seconds && (
                            <p className="text-xs text-slate-500 mt-1">
                              Duración: {log.duration_seconds}s
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {showConflictModal && selectedConflict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Resolver Conflicto</h3>
              <p className="text-sm text-slate-600 mt-1">
                {selectedConflict.evento_nombre}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {selectedConflict.conflict_reason}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Selecciona una estrategia de resolución:
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleResolveConflict(selectedConflict.id, 'local_wins')}
                    className="w-full px-4 py-3 text-left border border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                  >
                    <p className="font-medium text-slate-900">
                      Mantener datos locales (Sistema)
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Los datos del sistema sobrescribirán Google Calendar
                    </p>
                  </button>

                  <button
                    onClick={() => handleResolveConflict(selectedConflict.id, 'google_wins')}
                    className="w-full px-4 py-3 text-left border border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                  >
                    <p className="font-medium text-slate-900">
                      Mantener datos de Google Calendar
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Los datos de Google Calendar sobrescribirán el sistema
                    </p>
                  </button>

                  <button
                    onClick={() => handleResolveConflict(selectedConflict.id, 'manual')}
                    className="w-full px-4 py-3 text-left border border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                  >
                    <p className="font-medium text-slate-900">Resolver manualmente</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Marca como resuelto sin aplicar cambios automáticos
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConflictModal(false)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSettings;
