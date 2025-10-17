import { FC, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Monitor, Smartphone, Package, Edit, Trash2, Power, Wifi, WifiOff, User, Clock, CheckCircle, AlertTriangle, Zap, RefreshCw, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { dispositivosPosApi, DispositivoPOS } from '../../api/dispositivos-pos.api';
import { DispositivoPOSModal } from './DispositivoPOSModal';
import { QuickStartModal } from './QuickStartModal';
import { SyncModal } from './SyncModal';
import { DevicePairingModal } from '../../components/dispositivos-pos/DevicePairingModal';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const DispositivosPOSPage: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickStartModalOpen, setIsQuickStartModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [selectedDispositivo, setSelectedDispositivo] = useState<DispositivoPOS | undefined>();
  const queryClient = useQueryClient();

  // Query para listar todos los dispositivos
  const { data: dispositivos = [], isLoading, isFetching, refetch: refetchDispositivos } = useQuery({
    queryKey: ['dispositivos-pos'],
    queryFn: dispositivosPosApi.listarTodos,
    refetchInterval: isModalOpen ? false : 5000, // Refetch cada 5 segundos para actualizar estado de sync
    staleTime: 2000, // Considerar datos obsoletos después de 2 segundos
    refetchOnWindowFocus: true, // Refetch cuando la ventana recupera el foco
  });

  // Mutation para eliminar
  const eliminarMutation = useMutation({
    mutationFn: dispositivosPosApi.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos-pos'] });
      toast.success('Dispositivo eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar dispositivo');
    },
  });

  const handleCreate = () => {
    setSelectedDispositivo(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (dispositivo: DispositivoPOS) => {
    setSelectedDispositivo(dispositivo);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, nombre: string) => {
    if (confirm(`¿Eliminar dispositivo "${nombre}"?`)) {
      eliminarMutation.mutate(id);
    }
  };

  const handleQuickStart = (dispositivo: DispositivoPOS) => {
    setSelectedDispositivo(dispositivo);
    setIsQuickStartModalOpen(true);
  };

  const handleSync = (dispositivo: DispositivoPOS) => {
    setSelectedDispositivo(dispositivo);
    setIsSyncModalOpen(true);
  };

  const handleSyncModalClose = () => {
    setIsSyncModalOpen(false);
    // Refetch dispositivos después de cerrar el modal de sync para mostrar datos actualizados
    refetchDispositivos();
  };

  const handlePairing = (dispositivo: DispositivoPOS) => {
    setSelectedDispositivo(dispositivo);
    setIsPairingModalOpen(true);
  };

  const getIconByTipo = (tipo: string) => {
    switch (tipo) {
      case 'CAJA':
        return <Package className="h-6 w-6" />;
      case 'BARRA':
        return <Monitor className="h-6 w-6" />;
      case 'MOVIL':
        return <Smartphone className="h-6 w-6" />;
      default:
        return <Monitor className="h-6 w-6" />;
    }
  };

  const getEstadoConexion = (dispositivo: DispositivoPOS) => {
    if (!dispositivo.ultimaConexion) {
      return { estado: 'nunca', color: 'text-gray-400', icon: <WifiOff className="h-4 w-4" /> };
    }

    // IMPORTANTE: El backend envía timestamps en UTC sin 'Z', forzar interpretación UTC
    const timestamp = dispositivo.ultimaConexion.endsWith('Z')
      ? dispositivo.ultimaConexion
      : dispositivo.ultimaConexion + 'Z';
    const ultimaConexion = new Date(timestamp);
    const ahora = new Date();
    const diferencia = ahora.getTime() - ultimaConexion.getTime();
    const minutos = Math.floor(diferencia / 60000);

    if (minutos < 5) {
      return { estado: 'online', color: 'text-green-600', icon: <Wifi className="h-4 w-4" /> };
    } else if (minutos < 30) {
      return { estado: 'idle', color: 'text-yellow-600', icon: <Clock className="h-4 w-4" /> };
    } else {
      return { estado: 'offline', color: 'text-red-600', icon: <WifiOff className="h-4 w-4" /> };
    }
  };

  const getEstadoSincronizacion = (dispositivo: DispositivoPOS) => {
    if (!dispositivo.ultimaSincronizacion) {
      return { estado: 'nunca', color: 'text-gray-400', icon: <AlertTriangle className="h-4 w-4" /> };
    }

    // IMPORTANTE: El backend envía timestamps en UTC sin 'Z', forzar interpretación UTC
    const timestamp = dispositivo.ultimaSincronizacion.endsWith('Z')
      ? dispositivo.ultimaSincronizacion
      : dispositivo.ultimaSincronizacion + 'Z';
    const ultimaSync = new Date(timestamp);
    const ahora = new Date();
    const diferencia = ahora.getTime() - ultimaSync.getTime();
    const minutos = Math.floor(diferencia / 60000);

    if (minutos < 10) {
      return { estado: 'sincronizado', color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" /> };
    } else {
      return { estado: 'pendiente', color: 'text-yellow-600', icon: <AlertTriangle className="h-4 w-4" /> };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispositivos POS</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            Gestiona los terminales de punto de venta del sistema
            {isFetching && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Actualizando...
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => refetchDispositivos()}
            variant="outline"
            className="text-gray-600 hover:text-gray-900"
            disabled={isFetching}
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={handleCreate} variant="primary">
            <Plus className="h-5 w-5 mr-2" />
            Registrar Dispositivo
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Monitor className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{dispositivos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Power className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {dispositivos.filter(d => d.activo).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wifi className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Online</p>
              <p className="text-2xl font-bold text-gray-900">
                {dispositivos.filter(d => {
                  const estado = getEstadoConexion(d);
                  return estado.estado === 'online';
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Smartphone className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Móviles</p>
              <p className="text-2xl font-bold text-gray-900">
                {dispositivos.filter(d => d.tipo === 'MOVIL').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de dispositivos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {dispositivos.length === 0 ? (
          <div className="text-center py-12">
            <Monitor className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay dispositivos registrados</p>
            <p className="text-gray-400 mt-2">Crea el primer dispositivo POS</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {dispositivos.map((dispositivo) => {
              const estadoConexion = getEstadoConexion(dispositivo);
              const estadoSync = getEstadoSincronizacion(dispositivo);

              return (
                <div key={dispositivo.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Info principal */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icono del tipo */}
                      <div className={`p-3 rounded-lg ${
                        dispositivo.activo ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {getIconByTipo(dispositivo.tipo)}
                      </div>

                      {/* Detalles */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {dispositivo.nombre}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            dispositivo.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {dispositivo.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {dispositivo.tipo}
                          </span>
                          {dispositivo.empleadoAsignadoNombre && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              dispositivo.asignacionPermanente
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {dispositivo.asignacionPermanente ? '🔒 Fijo' : '⚡ Quick Start'}
                            </span>
                          )}
                        </div>

                        {dispositivo.descripcion && (
                          <p className="text-gray-600 text-sm mb-3">{dispositivo.descripcion}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Ubicación */}
                          {dispositivo.ubicacion && (
                            <div className="text-sm">
                              <p className="text-gray-500">Ubicación</p>
                              <p className="text-gray-900 font-medium">{dispositivo.ubicacion}</p>
                            </div>
                          )}

                          {/* Empleado asignado */}
                          {dispositivo.empleadoAsignadoNombre && (
                            <div className="text-sm">
                              <p className="text-gray-500 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Asignado a
                              </p>
                              <p className="text-gray-900 font-medium">
                                {dispositivo.empleadoAsignadoNombre}
                              </p>
                            </div>
                          )}

                          {/* Estado de conexión */}
                          <div className="text-sm">
                            <p className="text-gray-500">Conexión</p>
                            <p className={`font-medium flex items-center gap-1 ${estadoConexion.color}`}>
                              {estadoConexion.icon}
                              {estadoConexion.estado === 'online' && 'Online'}
                              {estadoConexion.estado === 'idle' && 'Inactivo'}
                              {estadoConexion.estado === 'offline' && 'Offline'}
                              {estadoConexion.estado === 'nunca' && 'Nunca conectado'}
                            </p>
                            {dispositivo.ultimaConexion && estadoConexion.estado !== 'nunca' && (
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(
                                  new Date(dispositivo.ultimaConexion.endsWith('Z') ? dispositivo.ultimaConexion : dispositivo.ultimaConexion + 'Z'),
                                  {
                                    addSuffix: true,
                                    locale: es,
                                  }
                                )}
                              </p>
                            )}
                          </div>

                          {/* Estado de sincronización */}
                          <div className="text-sm">
                            <p className="text-gray-500">Sincronización</p>
                            <p className={`font-medium flex items-center gap-1 ${estadoSync.color}`}>
                              {estadoSync.icon}
                              {estadoSync.estado === 'sincronizado' && 'Sincronizado'}
                              {estadoSync.estado === 'pendiente' && 'Pendiente'}
                              {estadoSync.estado === 'nunca' && 'Sin sync'}
                            </p>
                            {dispositivo.ultimaSincronizacion && estadoSync.estado !== 'nunca' && (
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(
                                  new Date(dispositivo.ultimaSincronizacion.endsWith('Z') ? dispositivo.ultimaSincronizacion : dispositivo.ultimaSincronizacion + 'Z'),
                                  {
                                    addSuffix: true,
                                    locale: es,
                                  }
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Info técnica */}
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                          <span>UUID: {dispositivo.uuid}</span>
                          {dispositivo.ipAddress && <span>IP: {dispositivo.ipAddress}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 ml-4">
                      {/* Botón Emparejamiento QR/Link */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePairing(dispositivo)}
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        title="Emparejamiento: QR, Link o Login con Empleado"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      {/* Botón Sincronización */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(dispositivo)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        title="Sincronización offline"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      {/* Botón Quick Start - solo para dispositivos con vinculación temporal */}
                      {!dispositivo.asignacionPermanente && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickStart(dispositivo)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Quick Start: Vincular/Desvincular empleado"
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(dispositivo)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(dispositivo.id, dispositivo.nombre)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Edición/Creación */}
      {isModalOpen && (
        <DispositivoPOSModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          dispositivo={selectedDispositivo}
        />
      )}

      {/* Modal de Quick Start */}
      {isQuickStartModalOpen && selectedDispositivo && (
        <QuickStartModal
          isOpen={isQuickStartModalOpen}
          onClose={() => setIsQuickStartModalOpen(false)}
          dispositivo={selectedDispositivo}
        />
      )}

      {/* Modal de Sincronización */}
      {isSyncModalOpen && selectedDispositivo && (
        <SyncModal
          isOpen={isSyncModalOpen}
          onClose={handleSyncModalClose}
          dispositivo={selectedDispositivo}
        />
      )}

      {/* Modal de Emparejamiento */}
      {isPairingModalOpen && selectedDispositivo && (
        <DevicePairingModal
          isOpen={isPairingModalOpen}
          onClose={() => setIsPairingModalOpen(false)}
          dispositivoId={selectedDispositivo.id}
          dispositivoNombre={selectedDispositivo.nombre}
        />
      )}
    </div>
  );
};
