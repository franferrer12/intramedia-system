import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Plus, AlertCircle } from 'lucide-react';
import { AbrirSesionModal } from '../../components/pos/AbrirSesionModal';
import { SesionActiva } from '../../components/pos/SesionActiva';
import { ConsumosList } from '../../components/pos/ConsumosList';
import { ProductoGrid } from '../../components/pos/ProductoGrid';
import { sesionesVentaApi } from '../../api/sesiones-venta.api';
import type { Producto } from '../../types';
import type { RegistrarConsumoRequest } from '../../types/sesion-venta.types';

export default function PosPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState('1');
  const [notasConsumo, setNotasConsumo] = useState('');
  const queryClient = useQueryClient();

  // Obtener sesiones abiertas
  const { data: sesionesAbiertas, isLoading } = useQuery({
    queryKey: ['sesiones-abiertas'],
    queryFn: sesionesVentaApi.listarSesionesAbiertas,
    refetchInterval: 10000, // Actualizar cada 10 segundos
  });

  // Mutación para registrar consumo
  const registrarConsumoMutation = useMutation({
    mutationFn: (request: RegistrarConsumoRequest) =>
      sesionesVentaApi.registrarConsumo(request),
    onSuccess: () => {
      toast.success('Consumo registrado correctamente');
      queryClient.invalidateQueries({ queryKey: ['sesiones-abiertas'] });
      queryClient.invalidateQueries({ queryKey: ['consumos-sesion'] });
      setProductoSeleccionado(null);
      setCantidad('1');
      setNotasConsumo('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar consumo');
    },
  });

  const sesionActiva = sesionesAbiertas?.[0];

  const handleProductoClick = (producto: Producto, cantidadRapida?: number) => {
    // Si se proporciona cantidad rápida, registrar directamente sin modal
    if (cantidadRapida !== undefined && sesionActiva) {
      registrarConsumoMutation.mutate({
        sesionId: sesionActiva.id,
        productoId: producto.id,
        cantidad: cantidadRapida,
        notas: undefined,
      });
      return;
    }

    // Si no hay cantidad rápida, abrir modal para configurar
    setProductoSeleccionado(producto);
    setCantidad('1');
    setNotasConsumo('');
  };

  const handleRegistrarConsumo = () => {
    if (!sesionActiva || !productoSeleccionado) return;

    const cantidadNum = parseFloat(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    registrarConsumoMutation.mutate({
      sesionId: sesionActiva.id,
      productoId: productoSeleccionado.id,
      cantidad: cantidadNum,
      notas: notasConsumo || undefined,
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
            Gestiona las ventas y consumos en tiempo real
          </p>
        </div>

        {!sesionActiva && (
          <Button onClick={() => setModalAbierto(true)} className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Abrir Nueva Sesión
          </Button>
        )}
      </div>

      {/* Mensaje si no hay sesión activa */}
      {!sesionActiva && sesionesAbiertas && sesionesAbiertas.length === 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              No hay ninguna sesión abierta. Abre una nueva sesión para comenzar a registrar
              consumos.
            </p>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {sesionActiva && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Sesión activa y consumos */}
          <div className="lg:col-span-1 space-y-6">
            <SesionActiva sesion={sesionActiva} />
            <ConsumosList sesionId={sesionActiva.id} />
          </div>

          {/* Columna derecha: Grid de productos */}
          <div className="lg:col-span-2">
            <ProductoGrid onProductoClick={handleProductoClick} />
          </div>
        </div>
      )}

      {/* Modal para abrir sesión */}
      <AbrirSesionModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} />

      {/* Dialog para registrar consumo */}
      {productoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Registrar Consumo
              </h3>

              <div className="space-y-4">
                {/* Producto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Producto
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {productoSeleccionado.nombre}
                  </p>
                  <p className="text-sm text-gray-600">
                    Precio: €{productoSeleccionado.precioVenta.toFixed(2)}
                  </p>
                </div>

                {/* Cantidad */}
                <div>
                  <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    id="cantidad"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                {/* Subtotal */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 mb-1">Subtotal</p>
                  <p className="text-2xl font-bold text-blue-900">
                    €
                    {(
                      productoSeleccionado.precioVenta * (parseFloat(cantidad) || 0)
                    ).toFixed(2)}
                  </p>
                </div>

                {/* Notas */}
                <div>
                  <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    id="notas"
                    value={notasConsumo}
                    onChange={(e) => setNotasConsumo(e.target.value)}
                    rows={2}
                    placeholder="Ej: Sin hielo, extra limón..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setProductoSeleccionado(null)}
                  className="flex-1"
                  disabled={registrarConsumoMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRegistrarConsumo}
                  className="flex-1"
                  disabled={registrarConsumoMutation.isPending}
                >
                  {registrarConsumoMutation.isPending ? 'Registrando...' : 'Registrar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
