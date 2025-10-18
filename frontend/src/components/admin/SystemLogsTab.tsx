import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminLogsApi, type LogsFilters, type SystemLog } from '../../api/admin.api';
import { RefreshCw, AlertCircle, AlertTriangle, Info, Bug, Trash2, FileText } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SystemLogsTab() {
  const [filters, setFilters] = useState<LogsFilters>({
    page: 0,
    size: 50,
  });

  const { data: logsPage, isLoading, refetch } = useQuery({
    queryKey: ['admin-logs', filters],
    queryFn: () => adminLogsApi.getLogs(filters),
  });

  const { data: estadisticas } = useQuery({
    queryKey: ['admin-logs-stats'],
    queryFn: () => adminLogsApi.getEstadisticas(),
  });

  const { data: modulos } = useQuery({
    queryKey: ['admin-logs-modulos'],
    queryFn: () => adminLogsApi.getModulos(),
  });

  const getNivelIcon = (nivel: string) => {
    switch (nivel) {
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-600" />;
      case 'DEBUG':
        return <Bug className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLimpiarLogsAntiguos = async () => {
    const fecha30DiasAtras = format(subDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm:ss");
    if (window.confirm('¿Estás seguro de eliminar logs de más de 30 días?')) {
      await adminLogsApi.limpiarLogsAntiguos(fecha30DiasAtras);
      refetch();
    }
  };

  return (
    <div className="p-6">
      {/* Statistics Cards */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Errores (1h)</p>
                <p className="text-2xl font-bold text-red-900">{estadisticas.erroresUltimaHora}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Warnings</p>
                <p className="text-2xl font-bold text-yellow-900">{estadisticas.totalWarnings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Info</p>
                <p className="text-2xl font-bold text-blue-900">{estadisticas.totalInfo}</p>
              </div>
              <Info className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalLogs}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
            <select
              value={filters.nivel || ''}
              onChange={(e) => setFilters({ ...filters, nivel: e.target.value as any, page: 0 })}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Todos</option>
              <option value="ERROR">Error</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Módulo</label>
            <select
              value={filters.modulo || ''}
              onChange={(e) => setFilters({ ...filters, modulo: e.target.value, page: 0 })}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Todos</option>
              {modulos?.map((modulo) => (
                <option key={modulo} value={modulo}>
                  {modulo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>

            <button
              onClick={handleLimpiarLogsAntiguos}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar Antiguos
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando logs...</p>
        </div>
      ) : logsPage && logsPage.content.length > 0 ? (
        <div className="space-y-2">
          {logsPage.content.map((log: SystemLog) => (
            <div
              key={log.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{getNivelIcon(log.nivel)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNivelColor(log.nivel)}`}>
                      {log.nivel}
                    </span>
                    <span className="text-sm font-medium text-indigo-600">{log.modulo}</span>
                    <span className="text-sm text-gray-500">{log.accion}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {format(new Date(log.fechaHora), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                    </span>
                  </div>

                  <p className="text-sm text-gray-900 mb-2">{log.mensaje}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {log.usuarioNombre && <span>Usuario: {log.usuarioNombre}</span>}
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                  </div>

                  {log.stackTrace && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                        Ver Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                        {log.stackTrace}
                      </pre>
                    </details>
                  )}

                  {log.detalles && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">
                        Ver Detalles
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                        {JSON.stringify(log.detalles, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {logsPage && logsPage.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => setFilters({ ...filters, page: (filters.page || 0) - 1 })}
                disabled={filters.page === 0}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {(filters.page || 0) + 1} de {logsPage.totalPages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: (filters.page || 0) + 1 })}
                disabled={(filters.page || 0) >= logsPage.totalPages - 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p>No se encontraron logs con los filtros seleccionados</p>
        </div>
      )}
    </div>
  );
}
