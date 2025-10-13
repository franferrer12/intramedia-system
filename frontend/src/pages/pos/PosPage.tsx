import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Plus, AlertCircle, X } from 'lucide-react';
import { AbrirSesionModal } from '../../components/pos/AbrirSesionModal';
// import { SesionActiva } from '../../components/pos/SesionActiva';
import { ProductoGrid } from '../../components/pos/ProductoGrid';
import { TicketActual, ItemCarrito } from '../../components/pos/TicketActual';
import { CerrarSesionModal } from '../../components/pos/CerrarSesionModal';
import { sesionCajaApi } from '../../api/pos-sesiones-caja.api';
import { ventaApi, VentaRequest, DetalleVentaRequest } from '../../api/pos-ventas.api';
import type { Producto } from '../../types';
import { useAuthStore } from '../../store/authStore';

export default function PosPage() {
  const { user } = useAuthStore();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCerrarAbierto, setModalCerrarAbierto] = useState(false);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const queryClient = useQueryClient();

  // Obtener sesiones abiertas
  const { data: sesionesAbiertas, isLoading } = useQuery({
    queryKey: ['sesiones-caja-abiertas'],
    queryFn: sesionCajaApi.getAbiertas,
    refetchInterval: 10000, // Actualizar cada 10 segundos
  });

  // Mutación para crear venta
  const crearVentaMutation = useMutation({
    mutationFn: (request: VentaRequest) => ventaApi.create(request),
    onSuccess: (data) => {
      toast.success(`Venta registrada: ${data.numeroTicket}`);
      queryClient.invalidateQueries({ queryKey: ['sesiones-caja-abiertas'] });
      queryClient.invalidateQueries({ queryKey: ['consumos-sesion'] });
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      setCarrito([]); // Limpiar carrito
    },
    onError: (error: any) => {
      console.error('Error al crear venta:', error);
      toast.error(error.response?.data?.message || 'Error al registrar la venta');
    },
  });

  // Mutación para cerrar sesión
  const cerrarSesionMutation = useMutation({
    mutationFn: ({ sesionId, empleadoCierreId, montoReal, observaciones }: { sesionId: number; empleadoCierreId: number; montoReal: number; observaciones?: string }) =>
      sesionCajaApi.cerrar(sesionId, { empleadoCierreId, montoReal, observaciones }),
    onSuccess: () => {
      toast.success('Sesión cerrada correctamente');
      queryClient.invalidateQueries({ queryKey: ['sesiones-caja-abiertas'] });
      setModalCerrarAbierto(false);
      setCarrito([]);
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

  // Agregar producto al carrito
  const handleProductoClick = (producto: Producto, cantidadRapida?: number) => {
    if (!sesionActiva) {
      toast.error('Debes abrir una sesión primero');
      return;
    }

    // Verificar stock
    if (producto.stockActual === 0) {
      toast.error('Producto sin stock');
      return;
    }

    const cantidad = cantidadRapida || 1;

    setCarrito((prevCarrito) => {
      const itemExistente = prevCarrito.find((item) => item.producto.id === producto.id);

      if (itemExistente) {
        // Actualizar cantidad si ya existe
        return prevCarrito.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + cantidad,
                subtotal: (item.cantidad + cantidad) * producto.precioVenta,
              }
            : item
        );
      } else {
        // Agregar nuevo item
        return [
          ...prevCarrito,
          {
            producto,
            cantidad,
            subtotal: cantidad * producto.precioVenta,
          },
        ];
      }
    });

    toast.success(`${producto.nombre} agregado al carrito`);
  };

  // Cambiar cantidad de un item
  const handleCantidadChange = (productoId: number, nuevaCantidad: number) => {
    setCarrito((prevCarrito) =>
      prevCarrito.map((item) =>
        item.producto.id === productoId
          ? {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * item.producto.precioVenta,
            }
          : item
      )
    );
  };

  // Eliminar item del carrito
  const handleEliminarItem = (productoId: number) => {
    setCarrito((prevCarrito) => prevCarrito.filter((item) => item.producto.id !== productoId));
    toast.info('Producto eliminado del carrito');
  };

  // Limpiar carrito
  const handleLimpiarCarrito = () => {
    setCarrito([]);
    toast.info('Carrito limpiado');
  };

  // Cobrar (crear venta)
  const handleCobrar = async (metodoPago: 'EFECTIVO' | 'TARJETA' | 'MIXTO') => {
    if (!sesionActiva || !user) {
      toast.error('Error: Sesión o usuario no disponible');
      return;
    }

    if (carrito.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Preparar detalles de la venta
    const detalles: DetalleVentaRequest[] = carrito.map((item) => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precioVenta,
      descuento: 0,
    }));

    // Calcular totales
    const subtotal = carrito.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal;

    // Preparar request
    const request: VentaRequest = {
      sesionCajaId: sesionActiva.id,
      empleadoId: user.id,
      metodoPago,
      montoEfectivo: metodoPago === 'EFECTIVO' ? total : undefined,
      montoTarjeta: metodoPago === 'TARJETA' ? total : undefined,
      detalles,
    };

    crearVentaMutation.mutate(request);
  };

  // Cerrar sesión
  const handleCerrarSesion = async (notas?: string) => {
    if (!sesionActiva || !user) return;

    if (carrito.length > 0) {
      toast.error('Debes cobrar o limpiar el carrito antes de cerrar la sesión');
      return;
    }

    // Por ahora usamos valores por defecto
    // TODO: Implementar formulario completo de cierre
    await cerrarSesionMutation.mutateAsync({
      sesionId: sesionActiva.id,
      empleadoCierreId: user.id,
      montoReal: sesionActiva.montoInicial + sesionActiva.totalIngresos,
      observaciones: notas,
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
          <h1 className="text-3xl font-bold text-gray-900">Punto de Venta (POS)</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las ventas en tiempo real
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
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              No hay ninguna sesión abierta. Abre una nueva sesión para comenzar a registrar
              ventas.
            </p>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {sesionActiva && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna izquierda: Ticket actual */}
          <div className="lg:col-span-4">
            <div className="sticky top-4 space-y-4">
              {/* <SesionActiva sesion={sesionActiva} /> */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2">
                  Sesión: {sesionActiva.nombreCaja}
                </h3>
                <p className="text-sm text-blue-700">
                  Empleado: {sesionActiva.empleadoAperturaNombre}
                </p>
                <p className="text-sm text-blue-700">
                  Monto Inicial: €{sesionActiva.montoInicial.toFixed(2)}
                </p>
                <p className="text-sm text-blue-700">
                  Total Ventas: {sesionActiva.totalVentas}
                </p>
                <p className="text-sm font-bold text-blue-900 mt-2">
                  Total Ingresos: €{sesionActiva.totalIngresos.toFixed(2)}
                </p>
              </div>
              <TicketActual
                items={carrito}
                onCantidadChange={handleCantidadChange}
                onEliminarItem={handleEliminarItem}
                onLimpiarCarrito={handleLimpiarCarrito}
                onCobrar={handleCobrar}
                isProcessing={crearVentaMutation.isPending}
              />
            </div>
          </div>

          {/* Columna derecha: Grid de productos */}
          <div className="lg:col-span-8">
            <ProductoGrid onProductoClick={handleProductoClick} />
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
