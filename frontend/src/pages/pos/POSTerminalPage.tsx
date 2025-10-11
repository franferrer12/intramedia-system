import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, ShoppingCart, Check, Search, ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { sesionesVentaApi } from '../../api/sesiones-venta.api';
import { ventaApi, VentaRequest, DetalleVentaRequest } from '../../api/pos-ventas.api';
import { productosApi } from '../../api/productos.api';
import type { Producto } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useFunctionKeyShortcuts } from '../../hooks/useKeyboardShortcuts';

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

export default function POSTerminalPage() {
  const { user } = useAuthStore();
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  const queryClient = useQueryClient();

  // Obtener sesiones abiertas
  const { data: sesionesAbiertas } = useQuery({
    queryKey: ['sesiones-abiertas'],
    queryFn: sesionesVentaApi.listarSesionesAbiertas,
    refetchInterval: 10000,
  });

  // Obtener productos
  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: productosApi.getAll,
    refetchInterval: 30000,
  });

  // Mutación para crear venta
  const crearVentaMutation = useMutation({
    mutationFn: (request: VentaRequest) => ventaApi.create(request),
    onSuccess: (data) => {
      toast.success(`✅ VENTA ${data.numeroTicket}`, {
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ['sesiones-abiertas'] });
      setCarrito([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar venta');
    },
  });

  const sesionActiva = sesionesAbiertas?.[0];

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    if (!productos) return [];

    let filtrados = productos.filter(p => p.stockActual > 0);

    if (categoriaSeleccionada !== 'TODAS') {
      filtrados = filtrados.filter(p => p.categoria === categoriaSeleccionada);
    }

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase();
      filtrados = filtrados.filter(p => p.nombre.toLowerCase().includes(term));
    }

    return filtrados;
  }, [productos, categoriaSeleccionada, busqueda]);

  // Categorías únicas
  const categorias = useMemo(() => {
    if (!productos) return [];
    const cats = Array.from(new Set(productos.map(p => p.categoria || 'Sin Categoría')));
    return ['TODAS', ...cats.sort()];
  }, [productos]);

  // Calcular total
  const total = useMemo(() => {
    return carrito.reduce((sum, item) => sum + item.subtotal, 0);
  }, [carrito]);

  const cantidadItems = useMemo(() => {
    return carrito.reduce((sum, item) => sum + item.cantidad, 0);
  }, [carrito]);

  // Agregar producto
  const handleAgregarProducto = (producto: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.producto.id === producto.id);
      if (existe) {
        return prev.map(item =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * producto.precioVenta }
            : item
        );
      }
      return [...prev, { producto, cantidad: 1, subtotal: producto.precioVenta }];
    });
    toast.success(`➕ ${producto.nombre}`, { duration: 1000 });
  };

  // Incrementar cantidad
  const handleIncrementarCantidad = (productoId: number) => {
    setCarrito(prev =>
      prev.map(item =>
        item.producto.id === productoId
          ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.producto.precioVenta }
          : item
      )
    );
  };

  // Decrementar cantidad
  const handleDecrementarCantidad = (productoId: number) => {
    setCarrito(prev =>
      prev.map(item =>
        item.producto.id === productoId && item.cantidad > 1
          ? { ...item, cantidad: item.cantidad - 1, subtotal: (item.cantidad - 1) * item.producto.precioVenta }
          : item
      )
    );
  };

  // Eliminar item del carrito
  const handleEliminarItem = (productoId: number) => {
    setCarrito(prev => prev.filter(item => item.producto.id !== productoId));
    toast.info('Producto eliminado del carrito', { duration: 1000 });
  };

  // Limpiar carrito
  const handleLimpiar = () => {
    setCarrito([]);
    toast.info('🗑️ Carrito limpiado');
  };

  // Cobrar
  const handleCobrar = async (metodoPago: 'EFECTIVO' | 'TARJETA' | 'MIXTO') => {
    if (!sesionActiva || !user || carrito.length === 0) {
      toast.error('Error: Verifica sesión y carrito');
      return;
    }

    const detalles: DetalleVentaRequest[] = carrito.map(item => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precioVenta,
      descuento: 0,
    }));

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Atajos de teclado para POS
  useFunctionKeyShortcuts({
    'F5': () => {
      if (carrito.length > 0 && !crearVentaMutation.isPending) {
        handleCobrar('EFECTIVO');
      }
    },
    'F6': () => {
      if (carrito.length > 0 && !crearVentaMutation.isPending) {
        handleCobrar('TARJETA');
      }
    },
    'F7': () => {
      if (carrito.length > 0 && !crearVentaMutation.isPending) {
        handleCobrar('MIXTO');
      }
    },
    'F9': () => {
      if (carrito.length > 0) {
        handleLimpiar();
      }
    },
  });

  if (!sesionActiva) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="text-center text-white">
          <X className="h-24 w-24 mx-auto mb-6 text-red-500" />
          <h1 className="text-4xl font-bold mb-4">No hay sesión activa</h1>
          <p className="text-xl text-gray-400">Abre una sesión desde el panel principal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Header minimalista */}
      <div className="bg-gray-800 border-b-4 border-blue-500 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white font-bold text-2xl">{sesionActiva.nombre}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-gray-400 text-sm">Items</p>
            <p className="text-white font-bold text-2xl">{cantidadItems}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-green-400 font-bold text-3xl">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grid de productos */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Barra de categorías */}
          <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
            {mostrarBusqueda ? (
              <div className="flex gap-2 flex-1">
                <button
                  onClick={() => {
                    setMostrarBusqueda(false);
                    setBusqueda('');
                  }}
                  className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar producto..."
                  className="flex-1 px-6 py-3 bg-gray-800 text-white text-xl rounded-xl border-2 border-gray-700 focus:border-blue-500"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <button
                  onClick={() => setMostrarBusqueda(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
                >
                  <Search className="h-6 w-6" />
                  <span className="font-semibold">Buscar</span>
                </button>
                {categorias.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSeleccionada(cat)}
                    className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                      categoriaSeleccionada === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Grid de productos - BOTONES ENORMES */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {productosFiltrados.map(producto => (
              <button
                key={producto.id}
                onClick={() => handleAgregarProducto(producto)}
                disabled={crearVentaMutation.isPending}
                className="h-48 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <h3 className="text-2xl font-bold text-center mb-2 line-clamp-2">
                  {producto.nombre}
                </h3>
                <p className="text-4xl font-bold">{formatCurrency(producto.precioVenta)}</p>
                <p className="text-sm opacity-75 mt-2">Stock: {producto.stockActual.toFixed(0)}</p>
              </button>
            ))}
          </div>

          {productosFiltrados.length === 0 && (
            <div className="text-center text-gray-500 mt-12">
              <p className="text-2xl">No hay productos disponibles</p>
            </div>
          )}
        </div>

        {/* Panel lateral: Carrito y botones de pago */}
        <div className="w-96 bg-gray-800 flex flex-col border-l-4 border-blue-500">
          {/* Carrito */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                TICKET
              </h2>
              {carrito.length > 0 && (
                <button
                  onClick={handleLimpiar}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                >
                  LIMPIAR
                </button>
              )}
            </div>

            {carrito.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Selecciona productos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrito.map(item => (
                  <div
                    key={item.producto.id}
                    className="bg-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg">{item.producto.nombre}</h4>
                        <p className="text-gray-400 text-sm">
                          {formatCurrency(item.producto.precioVenta)} /ud
                        </p>
                      </div>
                      <button
                        onClick={() => handleEliminarItem(item.producto.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                        <button
                          onClick={() => handleDecrementarCantidad(item.producto.id)}
                          disabled={item.cantidad <= 1}
                          className="w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white font-bold transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-white font-bold text-xl min-w-[3rem] text-center">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => handleIncrementarCantidad(item.producto.id)}
                          className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-green-400 font-bold text-xl">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones de pago */}
          {carrito.length > 0 && (
            <div className="p-4 bg-gray-900 border-t-2 border-gray-700">
              <div className="mb-4 text-center">
                <p className="text-gray-400 text-sm mb-1">TOTAL A PAGAR</p>
                <p className="text-white font-bold text-5xl">{formatCurrency(total)}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleCobrar('EFECTIVO')}
                  disabled={crearVentaMutation.isPending}
                  className="w-full h-20 bg-green-600 hover:bg-green-700 text-white font-bold text-2xl rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50 relative"
                >
                  <Check className="h-8 w-8" />
                  EFECTIVO
                  <kbd className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold bg-green-700 rounded">F5</kbd>
                </button>

                <button
                  onClick={() => handleCobrar('TARJETA')}
                  disabled={crearVentaMutation.isPending}
                  className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white font-bold text-2xl rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50 relative"
                >
                  <Check className="h-8 w-8" />
                  TARJETA
                  <kbd className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold bg-blue-700 rounded">F6</kbd>
                </button>

                <button
                  onClick={() => handleCobrar('MIXTO')}
                  disabled={crearVentaMutation.isPending}
                  className="w-full h-16 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-xl transition-colors disabled:opacity-50 relative"
                >
                  PAGO MIXTO
                  <kbd className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold bg-gray-800 rounded">F7</kbd>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
