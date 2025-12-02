import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  XMarkIcon,
  ClockIcon,
  UserIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

/**
 * Audit Log Detail Modal Component
 * Shows detailed information about a specific audit log entry
 */
const AuditLogDetail = ({ log, isOpen, onClose, className = '' }) => {
  if (!isOpen || !log) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'FAILURE':
      case 'ERROR':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const renderJsonDiff = (oldValues, newValues) => {
    if (!oldValues && !newValues) return null;

    const allKeys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {})
    ]);

    return (
      <div className="space-y-2">
        {Array.from(allKeys).map((key) => {
          const oldVal = oldValues?.[key];
          const newVal = newValues?.[key];
          const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

          if (!hasChanged) return null;

          return (
            <div key={key} className="border-l-4 border-blue-500 pl-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {key}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-red-600 dark:text-red-400 font-medium">Antes:</span>
                  <pre className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs overflow-auto">
                    {JSON.stringify(oldVal, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="text-green-600 dark:text-green-400 font-medium">Después:</span>
                  <pre className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs overflow-auto">
                    {JSON.stringify(newVal, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Detalle de Auditoría
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  ID: {log.id}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                {/* Event Information */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5" />
                    Información del Evento
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Tipo de Evento</label>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {log.event_type}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Estado</label>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-500 dark:text-gray-400">Acción</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{log.action}</p>
                    </div>
                    {log.entity_type && (
                      <>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Tipo de Entidad</label>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">{log.entity_type}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">ID de Entidad</label>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">{log.entity_id || '-'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* User Information */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Usuario
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{log.user_email || 'Sistema'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Rol</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{log.user_role || '-'}</p>
                    </div>
                    {log.user_name && (
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Nombre</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{log.user_name}</p>
                      </div>
                    )}
                    {log.user_dj_name && (
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Nombre Artístico</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{log.user_dj_name}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Request Information */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <GlobeAltIcon className="h-5 w-5" />
                    Información de Request
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Método</label>
                      <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">{log.method || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Duración</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {log.duration_ms ? `${log.duration_ms} ms` : '-'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-500 dark:text-gray-400">Endpoint</label>
                      <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white break-all bg-gray-50 dark:bg-gray-900 p-2 rounded">
                        {log.endpoint || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Dirección IP</label>
                      <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">{log.ip_address || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Fecha y Hora</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {format(new Date(log.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: es })}
                      </p>
                    </div>
                  </div>
                </section>

                {/* User Agent */}
                {log.user_agent && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <ComputerDesktopIcon className="h-5 w-5" />
                      Navegador/Cliente
                    </h3>
                    <p className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded break-all">
                      {log.user_agent}
                    </p>
                  </section>
                )}

                {/* Changes */}
                {(log.old_values || log.new_values) && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <ArrowPathIcon className="h-5 w-5" />
                      Cambios Realizados
                    </h3>
                    {log.changed_fields && log.changed_fields.length > 0 && (
                      <div className="mb-3">
                        <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                          Campos Modificados:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {log.changed_fields.map((field, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                      {renderJsonDiff(log.old_values, log.new_values)}
                    </div>
                  </section>
                )}

                {/* Error Message */}
                {log.error_message && (
                  <section>
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
                      Error
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4">
                      <p className="text-sm text-red-800 dark:text-red-300 font-mono">
                        {log.error_message}
                      </p>
                    </div>
                  </section>
                )}

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Metadata Adicional
                    </h3>
                    <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </section>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuditLogDetail;
