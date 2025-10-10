import { FC, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../ui/Card';
import { Search, Loader2, Package, AlertTriangle, LayoutGrid, List } from 'lucide-react';
import { productosApi } from '../../api/productos.api';
import type { Producto } from '../../types/producto.types';

interface ProductoGridProps {
  onProductoClick: (producto: Producto, cantidadRapida?: number) => void;
}

export const ProductoGrid: FC<ProductoGridProps> = ({ onProductoClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('TODAS');
  const [vistaCompacta, setVistaCompacta] = useState(false);

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos'],
    queryFn: productosApi.getAll,
    refetchInterval: 15000, // Actualizar cada 15 segundos
  });

  // Obtener lista única de categorías
  const categorias = useMemo(() => {
    if (!productos) return [];
    const cats = Array.from(new Set(productos.map(p => p.categoriaNombre || 'Sin Categoría')));
    return ['TODAS', ...cats.sort()];
  }, [productos]);

  // Filtrar productos por búsqueda y categoría
  const productosFiltrados = useMemo(() => {
    if (!productos) return [];

    let filtrados = productos;

    // Filtrar por categoría
    if (categoriaSeleccionada !== 'TODAS') {
      filtrados = filtrados.filter(
        p => (p.categoriaNombre || 'Sin Categoría') === categoriaSeleccionada
      );
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          p.categoriaNombre?.toLowerCase().includes(term)
      );
    }

    return filtrados;
  }, [productos, searchTerm, categoriaSeleccionada]);

  // Agrupar productos por categoría
  const productosAgrupados = useMemo(() => {
    const grupos: Record<string, Producto[]> = {};

    productosFiltrados.forEach((producto) => {
      const categoria = producto.categoriaNombre || 'Sin Categoría';
      if (!grupos[categoria]) {
        grupos[categoria] = [];
      }
      grupos[categoria].push(producto);
    });

    return grupos;
  }, [productosFiltrados]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y controles */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Toggle vista compacta/detallada */}
        <button
          onClick={() => setVistaCompacta(!vistaCompacta)}
          className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center"
          title={vistaCompacta ? 'Vista detallada' : 'Vista compacta'}
        >
          {vistaCompacta ? (
            <>
              <List className="h-5 w-5" />
              <span className="hidden sm:inline">Detallada</span>
            </>
          ) : (
            <>
              <LayoutGrid className="h-5 w-5" />
              <span className="hidden sm:inline">Compacta</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs de categorías */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categorias.map((categoria) => {
          const count = categoria === 'TODAS'
            ? productos?.length || 0
            : productos?.filter(p => (p.categoriaNombre || 'Sin Categoría') === categoria).length || 0;

          return (
            <button
              key={categoria}
              onClick={() => setCategoriaSeleccionada(categoria)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                categoriaSeleccionada === categoria
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {categoria}
              <span className={`ml-2 text-xs ${
                categoriaSeleccionada === categoria ? 'text-blue-100' : 'text-gray-500'
              }`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid de productos agrupados por categoría */}
      {Object.keys(productosAgrupados).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No se encontraron productos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(productosAgrupados).map(([categoria, prods]) => (
            <div key={categoria}>
              {/* Nombre de categoría */}
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="h-1 w-8 bg-blue-500 rounded"></div>
                {categoria}
                <span className="text-sm font-normal text-gray-500">
                  ({prods.length})
                </span>
              </h3>

              {/* Grid de productos */}
              <div className={`grid gap-3 ${
                vistaCompacta
                  ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {prods.map((producto) => {
                  const stockBajo = producto.stockActual <= (producto.stockMinimo || 0);
                  const sinStock = producto.stockActual === 0;

                  return (
                    <Card
                      key={producto.id}
                      className={`transition-all hover:shadow-lg ${
                        sinStock ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <CardContent className={vistaCompacta ? 'p-3' : 'p-4'}>
                        {/* Nombre */}
                        <h4 className={`font-semibold text-gray-900 mb-2 ${
                          vistaCompacta ? 'text-sm line-clamp-1' : 'line-clamp-2'
                        }`}>
                          {producto.nombre}
                        </h4>

                        {/* Precio */}
                        <p className={`font-bold text-blue-600 mb-2 ${
                          vistaCompacta ? 'text-lg' : 'text-2xl'
                        }`}>
                          €{producto.precio.toFixed(2)}
                        </p>

                        {/* Stock (solo vista detallada) */}
                        {!vistaCompacta && (
                          <div className="flex items-center justify-between text-xs mb-3">
                            <span className="text-gray-600">
                              Stock: {producto.stockActual.toFixed(1)}
                            </span>
                            {sinStock && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Sin stock
                              </span>
                            )}
                            {!sinStock && stockBajo && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded font-medium">
                                Bajo
                              </span>
                            )}
                            {!sinStock && !stockBajo && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                                Disponible
                              </span>
                            )}
                          </div>
                        )}

                        {/* Badge de stock (solo vista compacta) */}
                        {vistaCompacta && (
                          <div className="mb-2">
                            {sinStock && (
                              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded flex items-center gap-1 w-fit">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Sin stock
                              </span>
                            )}
                            {!sinStock && stockBajo && (
                              <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded w-fit">
                                Bajo
                              </span>
                            )}
                            {!sinStock && !stockBajo && (
                              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded w-fit">
                                OK
                              </span>
                            )}
                          </div>
                        )}

                        {/* Botones de cantidad rápida */}
                        {!sinStock && (
                          <div className={`grid gap-1 ${
                            vistaCompacta ? 'grid-cols-2' : 'grid-cols-4'
                          }`}>
                            {[1, 2, 5, 10].map((cantidad) => (
                              <button
                                key={cantidad}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onProductoClick(producto, cantidad);
                                }}
                                className={`bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors ${
                                  vistaCompacta ? 'text-xs py-1.5' : 'text-sm py-2'
                                } font-medium`}
                                disabled={sinStock}
                              >
                                {cantidad}x
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Tipo de venta (solo vista detallada) */}
                        {!vistaCompacta && producto.tipoVenta && (
                          <div className="mt-2">
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                              {producto.tipoVenta}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
