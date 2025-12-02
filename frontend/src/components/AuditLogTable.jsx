import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

/**
 * Audit Log Table Component
 * Displays audit logs in a sortable, filterable table
 */
const AuditLogTable = ({
  logs = [],
  onLogClick,
  onSort,
  sortBy = 'created_at',
  sortOrder = 'DESC',
  className = ''
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getEventTypeIcon = (eventType) => {
    switch (eventType) {
      case 'CREATE':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'UPDATE':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'DELETE':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'LOGIN':
      case 'LOGOUT':
        return <UserIcon className="h-5 w-5 text-purple-500" />;
      case 'SECURITY':
        return <ShieldCheckIcon className="h-5 w-5 text-yellow-500" />;
      case 'VIEW':
      case 'ACCESS':
        return <GlobeAltIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <CalendarIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      FAILURE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
        {status}
      </span>
    );
  };

  const getEventTypeBadge = (eventType) => {
    const styles = {
      CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      LOGOUT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      SECURITY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      VIEW: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      ACCESS: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      EXPORT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      IMPORT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[eventType] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
        {eventType}
      </span>
    );
  };

  const handleSort = (column) => {
    if (onSort) {
      const newOrder = sortBy === column && sortOrder === 'DESC' ? 'ASC' : 'DESC';
      onSort(column, newOrder);
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'DESC' ? (
      <ChevronDownIcon className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronUpIcon className="h-4 w-4 inline ml-1" />
    );
  };

  if (logs.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay registros</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No se encontraron logs de auditoría con los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('created_at')}
                className="flex items-center hover:text-gray-700 dark:hover:text-gray-200"
              >
                Fecha
                <SortIcon column="created_at" />
              </button>
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('event_type')}
                className="flex items-center hover:text-gray-700 dark:hover:text-gray-200"
              >
                Tipo
                <SortIcon column="event_type" />
              </button>
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acción
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('user_email')}
                className="flex items-center hover:text-gray-700 dark:hover:text-gray-200"
              >
                Usuario
                <SortIcon column="user_email" />
              </button>
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Entidad
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('status')}
                className="flex items-center hover:text-gray-700 dark:hover:text-gray-200"
              >
                Estado
                <SortIcon column="status" />
              </button>
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Duración
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {logs.map((log) => (
            <>
              <tr
                key={log.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => onLogClick && onLogClick(log)}
              >
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <div className="flex items-center gap-2">
                    {getEventTypeIcon(log.event_type)}
                    <div>
                      <div className="font-medium">
                        {format(new Date(log.created_at), 'dd MMM yyyy', { locale: es })}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {getEventTypeBadge(log.event_type)}
                </td>
                <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                  {log.action}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <div className="text-gray-900 dark:text-gray-100">{log.user_email || 'Sistema'}</div>
                  {log.user_role && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{log.user_role}</div>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  {log.entity_type && (
                    <div>
                      <div className="text-gray-900 dark:text-gray-100">{log.entity_type}</div>
                      {log.entity_id && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {log.entity_id}</div>
                      )}
                    </div>
                  )}
                  {!log.entity_type && <span className="text-gray-400">-</span>}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {getStatusBadge(log.status)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(log.id);
                    }}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {expandedRows.has(log.id) ? 'Ocultar' : 'Detalles'}
                  </button>
                </td>
              </tr>
              {expandedRows.has(log.id) && (
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <td colSpan="8" className="px-3 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Información de Request</h4>
                        <dl className="space-y-1">
                          <div>
                            <dt className="text-gray-500 dark:text-gray-400 inline">Método:</dt>
                            <dd className="text-gray-900 dark:text-gray-100 inline ml-2">{log.method || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500 dark:text-gray-400 inline">Endpoint:</dt>
                            <dd className="text-gray-900 dark:text-gray-100 inline ml-2 break-all">{log.endpoint || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500 dark:text-gray-400 inline">IP:</dt>
                            <dd className="text-gray-900 dark:text-gray-100 inline ml-2">{log.ip_address || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500 dark:text-gray-400 inline">User Agent:</dt>
                            <dd className="text-gray-900 dark:text-gray-100 inline ml-2 text-xs break-all">{log.user_agent ? log.user_agent.substring(0, 80) + '...' : '-'}</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Cambios</h4>
                        {log.changed_fields && log.changed_fields.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-xs">
                              <span className="text-gray-500 dark:text-gray-400">Campos modificados:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {log.changed_fields.map((field, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                    {field}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Sin cambios registrados</p>
                        )}
                        {log.error_message && (
                          <div className="mt-2">
                            <span className="text-red-600 dark:text-red-400 text-xs font-semibold">Error:</span>
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{log.error_message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogTable;
