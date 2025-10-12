import { FC, useState, useMemo } from 'react';
import { LogOut, User, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { DispositivoPOS, ConfiguracionPOS } from '../../../api/dispositivos-pos.api';
import { ProductoDTO } from '../../../types';

interface POSStandaloneTerminalProps {
  dispositivo: DispositivoPOS;
  configuracion: ConfiguracionPOS;
  token: string;
  onLogout: () => void;
}

interface CarritoItem {
  producto: ProductoDTO;
  cantidad: number;
  precioUnitario: number;
}

export const POSStandaloneTerminal: FC<POSStandaloneTerminalProps> = ({
  dispositivo,
  configuracion,
  token,
  onLogout,
}) => {
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

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
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

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
        precioUnitario: producto.precio,
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

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    // TODO: Implementar lógica de venta real con API
    // Por ahora solo limpia el carrito
    if (confirm(`¿Procesar venta por ${total.toFixed(2)}€?`)) {
      limpiarCarrito();
      alert('Venta procesada (demo)');
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
      <div className="flex-1 flex overflow-hidden">
        {/* Panel de Productos */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {productosFiltrados.map((producto: ProductoDTO) => (
                <button
                  key={producto.id}
                  onClick={() => agregarAlCarrito(producto)}
                  disabled={!producto.activo || (producto.stock && producto.stock <= 0)}
                  className={`bg-white p-4 rounded-lg shadow hover:shadow-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                    !producto.activo || (producto.stock && producto.stock <= 0)
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
                      {producto.precio.toFixed(2)}€
                    </span>
                    {producto.stock !== undefined && producto.stock !== null && (
                      <span className={`text-xs ${
                        producto.stock > 10 ? 'text-green-600' :
                        producto.stock > 0 ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        Stock: {producto.stock}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de Carrito */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
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
                onClick={procesarVenta}
                disabled={carrito.length === 0}
                variant="primary"
                className="w-full h-12 text-lg font-semibold"
              >
                Cobrar
              </Button>
              <Button
                onClick={limpiarCarrito}
                disabled={carrito.length === 0}
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
              Modo Offline - Las ventas se sincronizarán automáticamente
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
    </div>
  );
};
