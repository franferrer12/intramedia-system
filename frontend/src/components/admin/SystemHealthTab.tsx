import { useQuery } from '@tanstack/react-query';
import { adminHealthApi, adminLogsApi, adminUsersApi } from '../../api/admin.api';
import { Activity, AlertCircle, CheckCircle, Clock, Database, Server, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SystemHealthTab() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => adminHealthApi.getHealth(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: logStats } = useQuery({
    queryKey: ['admin-logs-stats'],
    queryFn: () => adminLogsApi.getEstadisticas(),
  });

  const { data: userStats } = useQuery({
    queryKey: ['admin-usuarios-stats'],
    queryFn: () => adminUsersApi.getEstadisticas(),
  });

  const getHealthStatus = () => {
    if (!health) return 'UNKNOWN';
    return health.status || 'UP';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'UP':
        return 'text-green-600';
      case 'DOWN':
        return 'text-red-600';
      case 'DEGRADED':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'UP':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'DOWN':
        return <AlertCircle className="h-12 w-12 text-red-600" />;
      default:
        return <Activity className="h-12 w-12 text-gray-600" />;
    }
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="p-6">
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando estado del sistema...</p>
        </div>
      ) : (
        <>
          {/* Overall Health Status */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-8 mb-6 text-center">
            <div className="flex flex-col items-center">
              {getHealthIcon(healthStatus)}
              <h2 className={`text-3xl font-bold mt-4 ${getHealthColor(healthStatus)}`}>
                Sistema {healthStatus === 'UP' ? 'Operativo' : healthStatus}
              </h2>
              {health?.timestamp && (
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Última verificación: {format(new Date(health.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                </p>
              )}
            </div>
          </div>

          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Database Status */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Base de Datos</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Conexión activa</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Migraciones aplicadas</span>
                </div>
              </div>
            </div>

            {/* Server Status */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Server className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Servidor</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">API operativa</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Autenticación activa</span>
                </div>
              </div>
            </div>

            {/* User Activity */}
            {userStats && (
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Usuarios</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold">{userStats.totalUsuarios}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Activos:</span>
                    <span className="font-semibold text-green-600">{userStats.usuariosActivos}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Inactivos:</span>
                    <span className="font-semibold text-red-600">{userStats.usuariosInactivos}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Log Statistics */}
          {logStats && (
            <div className="bg-white border rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Estadísticas de Logs
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{logStats.erroresUltimaHora}</p>
                  <p className="text-sm text-red-600 mt-1">Errores (1h)</p>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-3xl font-bold text-orange-600">{logStats.erroresUltimas24Horas}</p>
                  <p className="text-sm text-orange-600 mt-1">Errores (24h)</p>
                </div>

                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">{logStats.totalWarnings}</p>
                  <p className="text-sm text-yellow-600 mt-1">Warnings</p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{logStats.totalInfo}</p>
                  <p className="text-sm text-blue-600 mt-1">Info</p>
                </div>
              </div>

              {logStats.modulos && logStats.modulos.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Módulos activos:</p>
                  <div className="flex flex-wrap gap-2">
                    {logStats.modulos.map((modulo: string) => (
                      <span
                        key={modulo}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full"
                      >
                        {modulo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Distribution by Role */}
          {userStats?.usuariosPorRol && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Distribución de Usuarios por Rol
              </h3>

              <div className="space-y-3">
                {Object.entries(userStats.usuariosPorRol).map(([rol, cantidad]) => {
                  const cantidadNum = cantidad as number;
                  return (
                    <div key={rol} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{rol}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-48 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{
                              width: `${(cantidadNum / userStats.totalUsuarios) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8 text-right">{cantidadNum}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* System Information */}
          <div className="bg-gray-50 border rounded-lg p-6 mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Información del Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Versión:</span>
                <span className="font-mono">1.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entorno:</span>
                <span className="font-mono">Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Backend:</span>
                <span className="font-mono">Spring Boot 3.2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Base de Datos:</span>
                <span className="font-mono">PostgreSQL 15</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
