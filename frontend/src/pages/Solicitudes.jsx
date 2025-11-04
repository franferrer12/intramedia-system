import { useState, useEffect } from 'react';
import { requestsAPI, djsAPI } from '../services/api';
import {
  FileText,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
  User,
  Calendar,
  Euro,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import ExportButton from '../components/ExportButton';
import Select from '../components/Select';

const STATUS_COLORS = {
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', icon: Clock },
  approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: CheckCircle },
  rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: XCircle },
  in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: TrendingUp },
  completed: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: CheckCircle },
};

const PRIORITY_COLORS = {
  low: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  urgent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  in_progress: 'En Progreso',
  completed: 'Completado',
};

const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const RequestDetailModal = ({ request, onClose, onUpdate }) => {
  const [status, setStatus] = useState(request.status);
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setLoading(true);
      await requestsAPI.update(request.id, { status: newStatus });
      setStatus(newStatus);
      onUpdate();
    } catch (error) {
      console.error('Error actualizando solicitud:', error);
      alert('Error al actualizar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = STATUS_COLORS[status]?.icon || Clock;
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.pending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusColor.bg}`}>
              <StatusIcon className={`w-6 h-6 ${statusColor.text}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{request.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Solicitud #{request.id} · {STATUS_LABELS[status]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* DJ Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Solicitante</p>
              <p className="font-medium text-gray-900 dark:text-white">{request.dj_nombre || `DJ #${request.dj_id}`}</p>
            </div>
          </div>

          {/* Description */}
          {request.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Descripción</h3>
              <p className="text-gray-900 dark:text-white">{request.description}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Prioridad</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${PRIORITY_COLORS[request.priority]?.bg} ${PRIORITY_COLORS[request.priority]?.text}`}>
                <AlertCircle className="w-4 h-4 mr-1" />
                {PRIORITY_LABELS[request.priority]}
              </span>
            </div>
            {request.budget && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Presupuesto</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  <Euro className="w-4 h-4" />
                  {parseFloat(request.budget).toLocaleString('es-ES')}
                </p>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Creado</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {new Date(request.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {request.updated_at && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Última actualización</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(request.updated_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {status === 'pending' && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => handleUpdateStatus('approved')}
                disabled={loading}
                className="flex-1 btn bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Aprobar
              </button>
              <button
                onClick={() => handleUpdateStatus('rejected')}
                disabled={loading}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Rechazar
              </button>
            </div>
          )}

          {status === 'approved' && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleUpdateStatus('in_progress')}
                disabled={loading}
                className="w-full btn btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Marcar como En Progreso
              </button>
            </div>
          )}

          {status === 'in_progress' && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleUpdateStatus('completed')}
                disabled={loading}
                className="w-full btn bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como Completado
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const RequestCard = ({ request, onClick }) => {
  const statusColor = STATUS_COLORS[request.status] || STATUS_COLORS.pending;
  const StatusIcon = statusColor.icon;
  const priorityColor = PRIORITY_COLORS[request.priority] || PRIORITY_COLORS.medium;

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="card hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Priority indicator stripe */}
      <div className={`absolute top-0 left-0 w-1 h-full ${priorityColor.bg}`} />

      <div className="pl-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{request.title}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {STATUS_LABELS[request.status]}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {request.dj_nombre || `DJ #${request.dj_id}`}
            </p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${priorityColor.bg} ${priorityColor.text}`}>
            {PRIORITY_LABELS[request.priority]}
          </span>
        </div>

        {request.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {request.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(request.created_at).toLocaleDateString('es-ES')}
            </div>
            {request.budget && (
              <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                <Euro className="w-4 h-4" />
                {parseFloat(request.budget).toLocaleString('es-ES')}
              </div>
            )}
          </div>
          <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            Ver detalles →
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const Solicitudes = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadRequests();
    loadStats();
  }, []);

  const loadRequests = async (filters = {}) => {
    try {
      setLoading(true);
      const res = await requestsAPI.getAll(filters);
      setRequests(res.data.data || []);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await requestsAPI.getStats();
      setStats(res.data.data || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && req.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Solicitudes de DJs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {requests.length} solicitudes totales
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <ExportButton
            datos={filteredRequests}
            nombreArchivo={`solicitudes-${new Date().toISOString().split('T')[0]}`}
            label="Exportar"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600 dark:text-yellow-400 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">Aprobadas</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.approved}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">Rechazadas</p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.rejected}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card bg-gray-50 dark:bg-gray-800/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'pending', label: 'Pendiente' },
                { value: 'approved', label: 'Aprobado' },
                { value: 'rejected', label: 'Rechazado' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'completed', label: 'Completado' }
              ]}
              placeholder="Seleccionar estado"
              fullWidth
            />
            <Select
              label="Prioridad"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todas las prioridades' },
                { value: 'low', label: 'Baja' },
                { value: 'medium', label: 'Media' },
                { value: 'high', label: 'Alta' },
                { value: 'urgent', label: 'Urgente' }
              ]}
              placeholder="Seleccionar prioridad"
              fullWidth
            />
          </div>
        </motion.div>
      )}

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay solicitudes</p>
            <p className="text-sm">Las solicitudes de los DJs aparecerán aquí</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onClick={() => setSelectedRequest(request)}
            />
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={() => {
            loadRequests();
            loadStats();
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
};

export default Solicitudes;
