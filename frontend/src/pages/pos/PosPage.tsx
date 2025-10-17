import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Plus, X, TrendingUp, Users, ShoppingBag, DollarSign, Clock, Activity } from 'lucide-react';
import { AbrirSesionModal } from '../../components/pos/AbrirSesionModal';
import { CerrarSesionModal } from '../../components/pos/CerrarSesionModal';
import { sesionCajaApi } from '../../api/pos-sesiones-caja.api';
import { ventaApi } from '../../api/pos-ventas.api';
import { useAuthStore } from '../../store/authStore';

export default function PosPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCerrarAbierto, setModalCerrarAbierto] = useState(false);
  const queryClient = useQueryClient();

  // Obtener sesiones abiertas (solo si hay usuario autenticado)
  const { data: sesionesAbiertas, isLoading, error } = useQuery({
    queryKey: ['sesiones-caja-abiertas'],
    queryFn: sesionCajaApi.getAbiertas,
    enabled: !!user && isAuthenticated,
    refetchInterval: (user && isAuthenticated) ? 5000 : false, // Actualizar cada 5 segundos (tiempo real)
    retry: false,
  });

  // Obtener últimas ventas de la sesión activa
  const { data: ultimasVentas } = useQuery({
    queryKey: ['ventas-recientes', sesionesAbiertas?.[0]?.id],
    queryFn: () => ventaApi.getAll(),
    enabled: !!sesionesAbiertas?.[0]?.id,
    refetchInterval: 5000, // Auto-refresh cada 5 segundos
    select: (ventas) => {
      // Ordenar por fecha descendente (más recientes primero)
      const sortedVentas = [...ventas].sort((a, b) => {
        const dateA = new Date(a.fecha || a.createdAt).getTime();
        const dateB = new Date(b.fecha || b.createdAt).getTime();
        return dateB - dateA; // Descendente: más recientes primero
      });
      return sortedVentas.slice(0, 10); // Solo las 10 más recientes
    },
  });

  // DEBUG: Mostrar error si lo hay
  if (error) {
    console.error('❌ Error al cargar sesiones:', error);
  }

  // Mutación para cerrar sesión
  const cerrarSesionMutation = useMutation({
    mutationFn: ({ sesionId, empleadoCierreId, montoReal, observaciones }: { sesionId: number; empleadoCierreId: number; montoReal: number; observaciones?: string }) =>
      sesionCajaApi.cerrar(sesionId, { empleadoCierreId, montoReal, observaciones }),
    onSuccess: () => {
      toast.success('Sesión cerrada correctamente');
      queryClient.invalidateQueries({ queryKey: ['sesiones-caja-abiertas'] });
      setModalCerrarAbierto(false);
    },
    onError: (error: any) => {
      console.error('Error al cerrar sesión:', error);
      toast.error(error.response?.data?.message || 'Error al cerrar la sesión');
    },
  });

  const sesionActiva = sesionesAbiertas?.[0];

  // Calcular datos de sesión para el modal de cierre
  const datosSesionCierre = useMemo(() => {
    if (!sesionActiva) return null;

    return {
      id: sesionActiva.id,
      codigo: `CAJA-${sesionActiva.id}`,
      nombre: sesionActiva.nombreCaja,
      efectivoInicial: sesionActiva.montoInicial,
      totalVentas: sesionActiva.totalVentas,
      valorTotal: sesionActiva.totalIngresos,
      montoEsperadoEfectivo: sesionActiva.totalIngresos * 0.6, // Estimación temporal
      montoEsperadoTarjeta: sesionActiva.totalIngresos * 0.4, // Estimación temporal
      duracionMinutos: 0, // TODO: Calcular duración
      fechaApertura: sesionActiva.fechaApertura,
    };
  }, [sesionActiva]);

  // Cerrar sesión
  const handleCerrarSesion = async (notas?: string) => {
    if (!sesionActiva || !user) return;

    await cerrarSesionMutation.mutateAsync({
      sesionId: sesionActiva.id,
      empleadoCierreId: user.id,
      montoReal: sesionActiva.montoInicial + sesionActiva.totalIngresos,
      observaciones: notas,
    });
  };

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Formatear fecha/hora
  const formatDateTime = (dateString: string) => {
    // Si el string no tiene zona horaria, añadir 'Z' para indicar UTC
    const isoString = dateString.includes('Z') || dateString.includes('+')
      ? dateString
      : dateString + 'Z';

    return new Date(isoString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid' // Zona horaria española (UTC+1 o UTC+2)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Gestión POS</h1>
          <p className="text-gray-600 mt-1">
            Monitoreo y gestión de sesiones de caja en tiempo real
          </p>
        </div>

        <div className="flex gap-3">
          {sesionActiva && (
            <Button
              onClick={() => setModalCerrarAbierto(true)}
              variant="outline"
              className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              <X className="h-5 w-5" />
              Cerrar Sesión
            </Button>
          )}
          {!sesionActiva && (
            <Button onClick={() => setModalAbierto(true)} className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Abrir Nueva Sesión
            </Button>
          )}
        </div>
      </div>

      {/* Mensaje si no hay sesión activa */}
      {!sesionActiva && sesionesAbiertas && sesionesAbiertas.length === 0 && (
        <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-8">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Activity className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No hay ninguna sesión activa
            </h3>
            <p className="text-gray-600 mb-6">
              Abre una nueva sesión de caja para comenzar a operar
            </p>
            <Button onClick={() => setModalAbierto(true)} size="lg" className="flex items-center gap-2 mx-auto">
              <Plus className="h-5 w-5" />
              Abrir Nueva Sesión
            </Button>
          </div>
        </div>
      )}

      {/* Dashboard en Tiempo Real */}
      {sesionActiva && (
        <div className="space-y-6">
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Ingresos */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 opacity-80" />
                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                  EN VIVO
                </span>
              </div>
              <p className="text-sm font-medium opacity-90">Total Ingresos</p>
              <p className="text-4xl font-bold mt-2">{formatCurrency(sesionActiva.totalIngresos)}</p>
              <p className="text-xs opacity-75 mt-2">Monto Inicial: {formatCurrency(sesionActiva.montoInicial)}</p>
            </div>

            {/* Total Ventas */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag className="h-8 w-8 opacity-80" />
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
              <p className="text-sm font-medium opacity-90">Total Ventas</p>
              <p className="text-4xl font-bold mt-2">{sesionActiva.totalVentas}</p>
              <p className="text-xs opacity-75 mt-2">Tickets procesados</p>
            </div>

            {/* Ticket Promedio */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-8 w-8 opacity-80" />
              </div>
              <p className="text-sm font-medium opacity-90">Ticket Promedio</p>
              <p className="text-4xl font-bold mt-2">
                {sesionActiva.totalVentas > 0
                  ? formatCurrency(sesionActiva.totalIngresos / sesionActiva.totalVentas)
                  : formatCurrency(0)
                }
              </p>
              <p className="text-xs opacity-75 mt-2">Por transacción</p>
            </div>

            {/* Tiempo Activo */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-8 w-8 opacity-80" />
              </div>
              <p className="text-sm font-medium opacity-90">Sesión Activa</p>
              <p className="text-2xl font-bold mt-2">{sesionActiva.nombreCaja}</p>
              <p className="text-xs opacity-75 mt-2">
                Desde: {formatDateTime(sesionActiva.fechaApertura)}
              </p>
            </div>
          </div>

          {/* Información de Sesión y Últimas Ventas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Info de Sesión */}
            <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Información de Sesión</h3>
                  <p className="text-sm text-gray-600">Detalles operativos</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Nombre:</span>
                  <span className="font-semibold text-gray-900">{sesionActiva.nombreCaja}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Empleado:</span>
                  <span className="font-semibold text-gray-900">{sesionActiva.empleadoAperturaNombre}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    ACTIVA
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Apertura:</span>
                  <span className="font-semibold text-gray-900">{formatDateTime(sesionActiva.fechaApertura)}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Efectivo esperado en caja</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(sesionActiva.montoInicial + sesionActiva.totalIngresos)}
                  </p>
                </div>
              </div>
            </div>

            {/* Últimas Ventas */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border-2 border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Últimas Ventas</h3>
                    <p className="text-sm text-gray-600">Actualización en tiempo real</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-gray-600">En vivo</span>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {ultimasVentas && ultimasVentas.length > 0 ? (
                  ultimasVentas.map((venta: any) => (
                    <div
                      key={venta.id}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Ticket #{venta.numeroTicket}
                          </p>
                          <p className="text-sm text-gray-600">
                            {venta.empleadoNombre}
                            {venta.sesionCajaNombre && (
                              <span className="text-blue-600 font-medium"> • {venta.sesionCajaNombre}</span>
                            )}
                            {' • '}{formatDateTime(venta.fecha)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(venta.total)}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          venta.metodoPago === 'EFECTIVO' ? 'bg-green-100 text-green-800' :
                          venta.metodoPago === 'TARJETA' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {venta.metodoPago}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Aún no hay ventas registradas</p>
                    <p className="text-sm mt-1">Las ventas aparecerán aquí en tiempo real</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 mb-2">💡 Panel de Gestión</h4>
                <p className="text-blue-800 text-sm">
                  Este panel está diseñado para <strong>monitoreo y gestión</strong> de sesiones de caja.
                  Para realizar ventas, utiliza el <strong>Terminal POS Standalone</strong> en el dispositivo físico de caja.
                </p>
                <div className="mt-4 flex gap-3">
                  <a
                    href="/pos-terminal/standalone"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    🖥️ Abrir Terminal POS
                  </a>
                  <a
                    href="/dispositivos-pos"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-200 rounded-lg text-sm font-semibold transition-colors"
                  >
                    ⚙️ Gestionar Dispositivos
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para abrir sesión */}
      <AbrirSesionModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} />

      {/* Modal para cerrar sesión */}
      {datosSesionCierre && (
        <CerrarSesionModal
          isOpen={modalCerrarAbierto}
          onClose={() => setModalCerrarAbierto(false)}
          onConfirm={handleCerrarSesion}
          sesion={datosSesionCierre}
        />
      )}
    </div>
  );
}
