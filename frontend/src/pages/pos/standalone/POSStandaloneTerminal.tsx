import { FC, useState, useMemo, useEffect } from 'react';
import { LogOut, User, Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/Button';
import { DispositivoPOS, ConfiguracionPOS } from '../../../api/dispositivos-pos.api';
import { useOfflineSync } from '../../../hooks/useOfflineSync';
import { addVentaPendiente, VentaOfflineDB } from '../../../utils/offlineDB';
import { EmpleadoQuickSelect } from './EmpleadoQuickSelect';
import { PaymentMethodModal } from './PaymentMethodModal';
import '../../../utils/debugIndexedDB'; // Habilitar funciones de debug

interface POSStandaloneTerminalProps {
  dispositivo: DispositivoPOS;
  configuracion: ConfiguracionPOS;
  token: string;
  onLogout: () => void;
}

interface ProductoDTO {
  id: number;
  nombre: string;
  categoria: string;
  precioVenta?: number;  // Backend usa precioVenta, no precio
  stockActual?: number;  // Backend usa stockActual, no stock
  activo: boolean;
}

interface CarritoItem {
  producto: ProductoDTO;
  cantidad: number;
  precioUnitario: number;
}

export const POSStandaloneTerminal: FC<POSStandaloneTerminalProps> = ({
  dispositivo,
  configuracion,
  onLogout,
}) => {
  console.log('🔴 RENDER POSStandaloneTerminal - Componente cargado con debug logs v2');

  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmpleadoSelector, setShowEmpleadoSelector] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingEmpleadoData, setPendingEmpleadoData] = useState<{empleadoId?: number, empleadoNombre?: string} | null>(null);

  console.log('🔴 Estado actual pendingEmpleadoData:', pendingEmpleadoData);

  // Hook de sincronización offline
  const { isSyncing, pendingCount, triggerSync, updatePendingCount } = useOfflineSync(
    dispositivo.id,
    isOnline
  );

  // Productos desde la configuración precargada
  const productos = useMemo(() => {
    return configuracion.productosPrecargados || [];
  }, [configuracion]);

  // Filtrar productos por categoría
  const productosFiltrados = useMemo(() => {
    if (!categoriaSeleccionada) return productos;
    return productos.filter((p: ProductoDTO) => p.categoria === categoriaSeleccionada);
  }, [productos, categoriaSeleccionada]);

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    const cats = new Set<string>();
    productos.forEach((p: ProductoDTO) => {
      if (p.categoria) cats.add(p.categoria);
    });
    return Array.from(cats);
  }, [productos]);

  // Calcular total del carrito
  const total = useMemo(() => {
    return carrito.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
  }, [carrito]);

  // Monitor de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restaurada', {
        description: 'Las ventas pendientes se sincronizarán automáticamente',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Modo offline activado', {
        description: 'Las ventas se guardarán localmente',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const agregarAlCarrito = (producto: ProductoDTO) => {
    setCarrito(prev => {
      const itemExistente = prev.find(item => item.producto.id === producto.id);
      if (itemExistente) {
        return prev.map(item =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, {
        producto,
        cantidad: 1,
        precioUnitario: producto.precioVenta ?? 0,
      }];
    });
  };

  const modificarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }
    setCarrito(prev =>
      prev.map(item =>
        item.producto.id === productoId ? { ...item, cantidad } : item
      )
    );
  };

  const eliminarDelCarrito = (productoId: number) => {
    setCarrito(prev => prev.filter(item => item.producto.id !== productoId));
  };

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  const handleEmpleadoSelect = (empleadoId: number, empleadoNombre: string) => {
    console.log('🔵 Empleado seleccionado:', { empleadoId, empleadoNombre });

    // ⭐ VALIDACIÓN: Verificar que empleadoId sea válido
    if (!empleadoId || empleadoId <= 0) {
      console.error('❌ ERROR: empleadoId inválido recibido:', empleadoId);
      toast.error('Error al seleccionar empleado', {
        description: 'ID de empleado inválido'
      });
      return;
    }

    if (!empleadoNombre || empleadoNombre.trim() === '') {
      console.error('❌ ERROR: empleadoNombre vacío');
      toast.error('Error al seleccionar empleado', {
        description: 'Nombre de empleado inválido'
      });
      return;
    }

    setShowEmpleadoSelector(false);
    // Guardar datos del empleado y mostrar modal de pago
    setPendingEmpleadoData({ empleadoId, empleadoNombre });
    console.log('🔵 pendingEmpleadoData guardado:', { empleadoId, empleadoNombre });
    console.log('🔵 Mostrando modal de pago...');
    setShowPaymentModal(true);
  };

  const handleEmpleadoCancel = () => {
    setShowEmpleadoSelector(false);
    setPendingEmpleadoData(null);
  };

  const handlePaymentConfirm = (
    metodoPago: 'EFECTIVO' | 'TARJETA' | 'MIXTO',
    montoEfectivo?: number,
    montoTarjeta?: number
  ) => {
    console.log('🟢 handlePaymentConfirm - pendingEmpleadoData:', pendingEmpleadoData);
    console.log('🟢 Pasando a procesarVenta:', {
      empleadoId: pendingEmpleadoData?.empleadoId,
      empleadoNombre: pendingEmpleadoData?.empleadoNombre
    });
    setShowPaymentModal(false);
    // Procesar venta con método de pago seleccionado
    procesarVenta(
      metodoPago,
      montoEfectivo,
      montoTarjeta,
      pendingEmpleadoData?.empleadoId,
      pendingEmpleadoData?.empleadoNombre
    );
    setPendingEmpleadoData(null);
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setPendingEmpleadoData(null);
  };

  const iniciarCobro = () => {
    if (carrito.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Mostrar selector si: NO hay empleado asignado O está en modo tablet compartida
    if (!dispositivo.empleadoAsignadoId || configuracion.modoTabletCompartida) {
      // Verificar que hay empleados disponibles para seleccionar
      if (!configuracion.empleadosActivos || configuracion.empleadosActivos.length === 0) {
        toast.error('No hay empleados disponibles', {
          description: 'Debe asignar empleados al dispositivo o activar empleados en el sistema',
        });
        return;
      }
      setShowEmpleadoSelector(true);
    } else {
      // Solo usar empleado asignado si existe y no es modo compartida
      setPendingEmpleadoData({
        empleadoId: dispositivo.empleadoAsignadoId,
        empleadoNombre: dispositivo.empleadoAsignadoNombre,
      });
      setShowPaymentModal(true);
    }
  };

  const procesarVenta = async (
    metodoPago: 'EFECTIVO' | 'TARJETA' | 'MIXTO',
    montoEfectivo?: number,
    montoTarjeta?: number,
    empleadoId?: number,
    empleadoNombre?: string
  ) => {
    console.log('🟡 procesarVenta recibió:', { metodoPago, montoEfectivo, montoTarjeta, empleadoId, empleadoNombre });

    if (carrito.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // ⭐ VALIDACIÓN CRÍTICA: En modo tablet compartida, empleadoId es OBLIGATORIO
    if (configuracion.modoTabletCompartida && !empleadoId) {
      console.error('❌ ERROR: Intento de crear venta sin empleadoId en modo tablet compartida');
      console.error('❌ Estado actual:', {
        empleadoId,
        empleadoNombre,
        pendingEmpleadoData,
        dispositivo: dispositivo.empleadoAsignadoId
      });
      toast.error('Error: No se pudo determinar el empleado', {
        description: 'Por favor, selecciona un empleado nuevamente'
      });
      // Reintentar mostrando selector de empleado
      setShowEmpleadoSelector(true);
      return;
    }

    // Si NO es modo compartida y no hay empleadoId, usar el del dispositivo
    if (!empleadoId && dispositivo.empleadoAsignadoId) {
      console.log('ℹ️ Usando empleado asignado al dispositivo:', dispositivo.empleadoAsignadoId);
      empleadoId = dispositivo.empleadoAsignadoId;
      empleadoNombre = dispositivo.empleadoAsignadoNombre;
    }

    // Última validación: NO crear venta sin empleadoId
    if (!empleadoId) {
      console.error('❌ ERROR CRÍTICO: No hay empleadoId disponible');
      toast.error('Error: No se puede procesar la venta sin empleado', {
        description: 'Contacta con el administrador'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Generar UUID para la venta
      const uuid = `${dispositivo.uuid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Preparar datos de la venta
      const ventaOffline: VentaOfflineDB = {
        uuid,
        dispositivoId: dispositivo.id,
        timestamp: Date.now(),
        fechaVenta: new Date().toISOString(), // ⭐ ISO timestamp for real sale creation time
        items: carrito.map(item => ({
          productoId: item.producto.id,
          productoNombre: item.producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.cantidad * item.precioUnitario,
        })),
        total,
        metodoPago,
        montoEfectivo,
        montoTarjeta,
        empleadoId: empleadoId,
        empleadoNombre: empleadoNombre,
        sincronizada: false,
        intentosSincronizacion: 0,
      };

      console.log('🟡 Guardando venta en IndexedDB:', ventaOffline);

      // Guardar en IndexedDB
      await addVentaPendiente(ventaOffline);

      // Actualizar contador de ventas pendientes
      await updatePendingCount();

      // Limpiar carrito
      limpiarCarrito();

      // Mostrar notificación
      if (isOnline) {
        toast.success('Venta registrada', {
          description: `Total: ${total.toFixed(2)}€ - Sincronizando...`,
        });
        // Trigger sync inmediatamente si estamos online
        triggerSync();
      } else {
        toast.success('Venta guardada offline', {
          description: `Total: ${total.toFixed(2)}€ - Se sincronizará automáticamente`,
          icon: <AlertCircle className="h-5 w-5" />,
        });
      }
    } catch (error: any) {
      console.error('Error al procesar venta:', error);
      toast.error('Error al procesar venta', {
        description: error.message || 'Intenta nuevamente',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold">{dispositivo.nombre}</h1>
              <p className="text-sm text-blue-100">
                {dispositivo.ubicacion || dispositivo.tipo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Estado de conexión */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Ventas pendientes de sincronización */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 bg-yellow-500 px-3 py-1 rounded-full text-sm text-white">
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Usuario asignado */}
            {dispositivo.empleadoAsignadoNombre && (
              <div className="flex items-center gap-2 bg-blue-700 px-3 py-1 rounded-full text-sm">
                <User className="h-4 w-4" />
                <span>{dispositivo.empleadoAsignadoNombre}</span>
              </div>
            )}

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-white hover:bg-blue-700"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Panel de Productos */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden order-2 md:order-1">
          {/* Filtros de Categorías */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setCategoriaSeleccionada(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                categoriaSeleccionada === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  categoriaSeleccionada === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de Productos */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {productosFiltrados.map((producto: ProductoDTO) => (
                <button
                  key={producto.id}
                  onClick={() => agregarAlCarrito(producto)}
                  disabled={!producto.activo || (producto.stockActual !== undefined && producto.stockActual <= 0)}
                  className={`bg-white p-4 rounded-lg shadow hover:shadow-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                    !producto.activo || (producto.stockActual && producto.stockActual <= 0)
                      ? 'bg-gray-100'
                      : 'hover:scale-105'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {producto.nombre}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{producto.categoria}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      {(producto.precioVenta ?? 0).toFixed(2)}€
                    </span>
                    {producto.stockActual !== undefined && producto.stockActual !== null && (
                      <span className={`text-xs ${
                        producto.stockActual > 10 ? 'text-green-600' :
                        producto.stockActual > 0 ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        Stock: {producto.stockActual}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de Carrito */}
        <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col order-1 md:order-2 max-h-80 md:max-h-none">
          {/* Header del Carrito */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Carrito</h2>
            <p className="text-sm text-gray-500">{carrito.length} productos</p>
          </div>

          {/* Items del Carrito */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {carrito.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Carrito vacío</p>
                <p className="text-sm text-gray-300 mt-1">Selecciona productos para comenzar</p>
              </div>
            ) : (
              carrito.map(item => (
                <div key={item.producto.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex-1">
                      {item.producto.nombre}
                    </h4>
                    <button
                      onClick={() => eliminarDelCarrito(item.producto.id)}
                      className="text-red-600 hover:text-red-800 text-sm ml-2"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => modificarCantidad(item.producto.id, item.cantidad - 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg text-lg font-bold"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-medium">{item.cantidad}</span>
                      <button
                        onClick={() => modificarCantidad(item.producto.id, item.cantidad + 1)}
                        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-bold text-gray-900">
                      {(item.precioUnitario * item.cantidad).toFixed(2)}€
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer del Carrito */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            {/* Total */}
            <div className="flex items-center justify-between text-xl font-bold">
              <span>TOTAL:</span>
              <span className="text-blue-600">{total.toFixed(2)}€</span>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-2">
              <Button
                onClick={iniciarCobro}
                disabled={carrito.length === 0 || isProcessing}
                variant="primary"
                className="w-full h-12 text-lg font-semibold"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  'Cobrar'
                )}
              </Button>
              <Button
                onClick={limpiarCarrito}
                disabled={carrito.length === 0 || isProcessing}
                variant="outline"
                className="w-full"
              >
                Limpiar Carrito
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer con info del modo offline */}
      {!isOnline && (
        <div className="bg-yellow-100 border-t border-yellow-300 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-800">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">
              Modo Offline - {pendingCount > 0 ? `${pendingCount} venta${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''} de sincronización` : 'Las ventas se sincronizarán automáticamente'}
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 text-sm text-yellow-800 hover:text-yellow-900"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Banner de sincronización exitosa */}
      {isOnline && pendingCount === 0 && isSyncing && (
        <div className="bg-green-100 border-t border-green-300 px-4 py-2 flex items-center gap-2 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Todas las ventas están sincronizadas
          </span>
        </div>
      )}

      {/* Modal de selección de empleado */}
      {showEmpleadoSelector && configuracion.empleadosActivos && (
        <EmpleadoQuickSelect
          isOpen={showEmpleadoSelector}
          empleados={configuracion.empleadosActivos}
          onSelect={handleEmpleadoSelect}
          onCancel={handleEmpleadoCancel}
        />
      )}

      {/* Modal de método de pago */}
      {showPaymentModal && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          total={total}
          onConfirm={handlePaymentConfirm}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
};
