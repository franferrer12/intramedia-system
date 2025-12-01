import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, User, Mail, Phone, MapPin,
  CheckCircle, XCircle, AlertCircle, PlayCircle,
  Eye, ThumbsUp, ThumbsDown, Trash2, RefreshCw,
  Filter, Search, TrendingUp, Users, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reservationsAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

/**
 * Reservations Management Page
 * Sprint 4.2 - Sistema de Reservas
 */
function Reservations() {
  const { user } = useAuthStore();

  // State
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 20
  });

  // Load reservations
  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getAll(filters);
      setReservations(response.data.data.reservations || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
      toast.error('Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load stats
  const loadStats = async () => {
    try {
      const response = await reservationsAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadReservations();
    loadStats();
  }, [loadReservations]);

  // Approve reservation
  const handleApprove = async (reservation) => {
    if (!window.confirm('¿Aprobar esta reserva?')) return;

    try {
      await reservationsAPI.approveReservation(reservation.id, {
        approved_by: user.id
      });
      toast.success('Reserva aprobada correctamente');
      loadReservations();
      loadStats();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error approving reservation:', error);
      toast.error('Error al aprobar reserva');
    }
  };

  // Reject reservation
  const handleReject = async (reservation) => {
    const reason = window.prompt('Motivo del rechazo:');
    if (!reason) return;

    try {
      await reservationsAPI.rejectReservation(reservation.id, reason);
      toast.success('Reserva rechazada');
      loadReservations();
      loadStats();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      toast.error('Error al rechazar reserva');
    }
  };

  // Cancel reservation
  const handleCancel = async (reservation) => {
    const reason = window.prompt('Motivo de cancelación:');
    if (!reason) return;

    try {
      await reservationsAPI.cancelReservation(reservation.id, reason);
      toast.success('Reserva cancelada');
      loadReservations();
      loadStats();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Error al cancelar reserva');
    }
  };

  // Convert to event
  const handleConvertToEvent = async (reservation) => {
    if (!window.confirm('¿Convertir esta reserva en un evento confirmado?')) return;

    try {
      await reservationsAPI.convertToEvento(reservation.id);
      toast.success('Reserva convertida a evento exitosamente');
      loadReservations();
      loadStats();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error converting to event:', error);
      toast.error('Error al convertir a evento');
    }
  };

  // Extend hold
  const handleExtendHold = async (reservation) => {
    try {
      await reservationsAPI.extendHold(reservation.id, 30);
      toast.success('Hold extendido por 30 minutos');
      loadReservations();
    } catch (error) {
      console.error('Error extending hold:', error);
      toast.error('Error al extender hold');
    }
  };

  // View status history
  const viewHistory = async (reservation) => {
    try {
      const response = await reservationsAPI.getStatusHistory(reservation.id);
      setStatusHistory(response.data.data || []);
      setSelectedReservation(reservation);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Error al cargar historial');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: AlertCircle, label: 'Pendiente' },
      on_hold: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: Clock, label: 'En Hold' },
      confirmed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle, label: 'Confirmada' },
      approved: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', icon: ThumbsUp, label: 'Aprobada' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle, label: 'Rechazada' },
      cancelled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: XCircle, label: 'Cancelada' },
      converted: { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400', icon: PlayCircle, label: 'Convertida' },
      expired: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: Clock, label: 'Expirada' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Reservas
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestión de reservas públicas y privadas
          </p>
        </div>

        <button
          onClick={() => window.location.href = '/booking'}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Calendar className="w-5 h-5" />
          Ver Formulario Público
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.total_count || 0}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pendientes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.pending_count || 0}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Confirmadas</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.confirmed_count || 0}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Este Mes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.this_month_count || 0}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, evento..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="on_hold">En Hold</option>
            <option value="confirmed">Confirmada</option>
            <option value="approved">Aprobada</option>
            <option value="rejected">Rechazada</option>
            <option value="cancelled">Cancelada</option>
            <option value="converted">Convertida</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />

          {/* Date To */}
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />

          {/* Refresh */}
          <button
            onClick={loadReservations}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Refrescar"
          >
            <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Reservations Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No hay reservas
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Las reservas aparecerán aquí cuando los clientes las creen
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                    Reserva
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                    Cliente
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                    Evento
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                    Fecha
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                    Estado
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {reservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                    onClick={() => {
                      setSelectedReservation(reservation);
                      setShowDetailModal(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          #{reservation.reservation_number}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(reservation.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {reservation.client_name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {reservation.client_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {reservation.event_type}
                        </p>
                        {reservation.event_location && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {reservation.event_location}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900 dark:text-white">
                          {formatDate(reservation.event_date)}
                        </span>
                      </div>
                      {reservation.event_start_time && (
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {reservation.event_start_time}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(reservation.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReservation(reservation);
                            setShowDetailModal(true);
                          }}
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>

                        {reservation.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(reservation);
                            }}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Aprobar"
                          >
                            <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </button>
                        )}

                        {reservation.status === 'on_hold' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExtendHold(reservation);
                            }}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Extender hold"
                          >
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                        )}

                        {(reservation.status === 'pending' || reservation.status === 'on_hold') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(reservation);
                            }}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Rechazar"
                          >
                            <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReservation(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onCancel={handleCancel}
          onConvertToEvent={handleConvertToEvent}
          onViewHistory={viewHistory}
        />
      )}

      {/* History Modal */}
      {showHistoryModal && selectedReservation && (
        <HistoryModal
          reservation={selectedReservation}
          history={statusHistory}
          onClose={() => {
            setShowHistoryModal(false);
            setStatusHistory([]);
          }}
        />
      )}
    </div>
  );
}

// Reservation Detail Modal Component
function ReservationDetailModal({ reservation, onClose, onApprove, onReject, onCancel, onConvertToEvent, onViewHistory }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Reserva #{reservation.reservation_number}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Estado</label>
            <div className="mt-2">
              {(() => {
                const badges = {
                  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
                  on_hold: { color: 'bg-blue-100 text-blue-800', label: 'En Hold' },
                  confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmada' },
                  approved: { color: 'bg-purple-100 text-purple-800', label: 'Aprobada' },
                  rejected: { color: 'bg-red-100 text-red-800', label: 'Rechazada' },
                  cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelada' }
                };
                const badge = badges[reservation.status] || badges.pending;
                return (
                  <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${badge.color}`}>
                    {badge.label}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Cliente</label>
              <p className="text-slate-900 dark:text-white mt-1">{reservation.client_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
              <p className="text-slate-900 dark:text-white mt-1">{reservation.client_email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Teléfono</label>
              <p className="text-slate-900 dark:text-white mt-1">{reservation.client_phone}</p>
            </div>
            {reservation.client_company && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Empresa</label>
                <p className="text-slate-900 dark:text-white mt-1">{reservation.client_company}</p>
              </div>
            )}
          </div>

          {/* Event Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Tipo de Evento</label>
              <p className="text-slate-900 dark:text-white mt-1">{reservation.event_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Fecha</label>
              <p className="text-slate-900 dark:text-white mt-1">
                {new Date(reservation.event_date).toLocaleDateString('es-ES')}
              </p>
            </div>
            {reservation.event_start_time && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Hora Inicio</label>
                <p className="text-slate-900 dark:text-white mt-1">{reservation.event_start_time}</p>
              </div>
            )}
            {reservation.event_duration_hours && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Duración</label>
                <p className="text-slate-900 dark:text-white mt-1">{reservation.event_duration_hours}h</p>
              </div>
            )}
            {reservation.event_location && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Ubicación</label>
                <p className="text-slate-900 dark:text-white mt-1">{reservation.event_location}</p>
              </div>
            )}
            {reservation.estimated_guests && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Invitados Estimados</label>
                <p className="text-slate-900 dark:text-white mt-1">{reservation.estimated_guests}</p>
              </div>
            )}
          </div>

          {reservation.event_description && (
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Descripción</label>
              <p className="text-slate-900 dark:text-white mt-1">{reservation.event_description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onViewHistory(reservation)}
              className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
            >
              Ver Historial
            </button>

            {reservation.status === 'pending' && (
              <>
                <button
                  onClick={() => onApprove(reservation)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => onReject(reservation)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Rechazar
                </button>
              </>
            )}

            {reservation.status === 'approved' && (
              <button
                onClick={() => onConvertToEvent(reservation)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Convertir a Evento
              </button>
            )}

            {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
              <button
                onClick={() => onCancel(reservation)}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// History Modal Component
function HistoryModal({ reservation, history, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Historial de Estados
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {history.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-8">
              No hay historial disponible
            </p>
          ) : (
            history.map((item, index) => (
              <div
                key={index}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {item.status}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(item.changed_at).toLocaleString('es-ES')}
                  </span>
                </div>
                {item.changed_by_name && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Por: {item.changed_by_name}
                  </p>
                )}
                {item.reason && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Motivo: {item.reason}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Reservations;
