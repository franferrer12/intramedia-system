import { FC, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productosApi } from '../../api/productos.api';
import { reportesApi } from '../../api/reportes.api';
import { Producto } from '../../types';
import { Package, Plus, Edit, Trash2, AlertTriangle, TrendingDown, FileDown, CheckCircle2, XCircle, Wine, Droplet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { notify, handleApiError } from '../../utils/notifications';
import { useConfirmation, confirmDelete } from '../../hooks/useConfirmation';
import { ProductoModal } from '../../components/productos/ProductoModal';

export const ProductosPage: FC = () => {
  const queryClient = useQueryClient();
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const { confirm, ConfirmationDialog } = useConfirmation();

  const { data: productos = [], isLoading } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: productosApi.getAll,
  });

  const { data: categorias = [] } = useQuery<string[]>({
    queryKey: ['productos-categorias'],
    queryFn: productosApi.getCategorias,
  });

  const deleteMutation = useMutation({
    mutationFn: productosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      notify.success('Producto eliminado correctamente');
    },
    onError: (error) => {
      handleApiError(error, 'Error al eliminar el producto');
    },
  });

  const productosFiltrados = filtroCategoria
    ? productos.filter(p => p.categoria === filtroCategoria)
    : productos;

  const handleDelete = async (id: number, nombre: string) => {
    const confirmed = await confirm(confirmDelete(nombre));
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportExcel = async () => {
    try {
      await reportesApi.exportInventarioExcel();
      notify.success('Inventario exportado correctamente');
    } catch (error) {
      handleApiError(error, 'Error al exportar el inventario');
    }
  };

  const handleCreate = () => {
    setSelectedProducto(null);
    setIsModalOpen(true);
  };

  const handleEdit = (producto: Producto) => {
    setSelectedProducto(producto);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProducto(null);
  };

  // Calcular porcentaje de stock
  const getStockPercentage = (producto: Producto) => {
    if (producto.stockMaximo && producto.stockMaximo > 0) {
      return (producto.stockActual / producto.stockMaximo) * 100;
    }
    // Si no hay stock máximo, usar stock mínimo * 2 como referencia
    const reference = producto.stockMinimo * 2;
    if (reference > 0) {
      return Math.min((producto.stockActual / reference) * 100, 100);
    }
    return 100;
  };

  // Renderizar indicador de stock
  const renderStockIndicator = (producto: Producto) => {
    if (producto.sinStock) {
      return (
        <div className="flex items-center justify-end space-x-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="font-medium text-red-600">Sin stock</span>
        </div>
      );
    }

    if (producto.bajoStock) {
      return (
        <div className="flex items-center justify-end space-x-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="font-medium text-yellow-600">
            {producto.stockActual} {producto.unidadMedida}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-end space-x-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span className="font-medium text-green-600">
          {producto.stockActual} {producto.unidadMedida}
        </span>
      </div>
    );
  };

  // Renderizar badge de tipo de venta
  const renderTipoVentaBadge = (producto: Producto) => {
    if (!producto.tipoVenta) return null;

    const badges = {
      COPA: { label: 'Copa', color: 'bg-purple-100 text-purple-800', icon: Wine },
      CHUPITO: { label: 'Chupito', color: 'bg-orange-100 text-orange-800', icon: Droplet },
      BOTELLA: { label: 'Botella', color: 'bg-blue-100 text-blue-800', icon: Wine },
    };

    const badge = badges[producto.tipoVenta];
    if (!badge) return null;

    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  // Renderizar margen con indicador visual
  const renderMargenIndicator = (producto: Producto) => {
    const margen = producto.margenPorcentaje || producto.margenBeneficio || 0;

    let color = 'text-gray-600';
    let bgColor = 'bg-gray-100';

    if (margen >= 400) {
      color = 'text-green-700';
      bgColor = 'bg-green-100';
    } else if (margen >= 200) {
      color = 'text-blue-700';
      bgColor = 'bg-blue-100';
    } else if (margen >= 100) {
      color = 'text-yellow-700';
      bgColor = 'bg-yellow-100';
    } else if (margen < 50) {
      color = 'text-red-700';
      bgColor = 'bg-red-100';
    }

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded ${bgColor}`}>
        <span className={`font-bold ${color}`}>{margen.toFixed(0)}%</span>
      </div>
    );
  };

  // Calcular servicios disponibles
  const calcularServiciosDisponibles = (producto: Producto): string => {
    if (!producto.tipoVenta || producto.tipoVenta === 'BOTELLA') {
      return `${producto.stockActual} bot.`;
    }

    if (producto.unidadesReales) {
      const servicios = Math.floor(producto.stockActual * producto.unidadesReales);
      return `${servicios} serv.`;
    }

    return `${producto.stockActual} bot.`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Productos</h1>
          <p className="text-gray-600 mt-1">Gestiona el catálogo de productos del club</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Resumen de alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold">
                {productos.filter(p => p.bajoStock).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Sin Stock</p>
              <p className="text-2xl font-bold">
                {productos.filter(p => p.sinStock).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold">{productos.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Categoría:</label>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Todas</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de productos */}
      {isLoading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo Venta</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Capacidad</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase" title="Unidades por botella">Unid./Bot</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Disponible</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P. Compra</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P. Venta</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Margen</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productosFiltrados.map(producto => (
                  <tr key={producto.id} className={producto.sinStock ? 'bg-red-50' : producto.bajoStock ? 'bg-yellow-50' : ''}>
                    {/* Código */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{producto.codigo}</td>

                    {/* Producto */}
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                        {producto.proveedorNombre && (
                          <div className="text-xs text-gray-500">{producto.proveedorNombre}</div>
                        )}
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{producto.categoria}</td>

                    {/* Tipo Venta */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {renderTipoVentaBadge(producto)}
                    </td>

                    {/* Capacidad */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {producto.capacidadMl ? (
                        <span className="text-gray-900">{producto.capacidadMl}ml</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Unidades/Botella */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {producto.unidadesReales ? (
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-gray-900">{producto.unidadesReales.toFixed(0)}</span>
                          {producto.tipoVenta && producto.tipoVenta !== 'BOTELLA' && (
                            <span className="text-xs text-gray-500">
                              ({producto.mlPorServicio}ml/serv)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {renderStockIndicator(producto)}
                        <div className="flex items-center justify-end space-x-2 text-xs text-gray-500">
                          <span>Mín: {producto.stockMinimo}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              producto.sinStock
                                ? 'bg-red-600'
                                : producto.bajoStock
                                ? 'bg-yellow-500'
                                : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(getStockPercentage(producto), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Disponible (Servicios) */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-gray-900">
                          {calcularServiciosDisponibles(producto)}
                        </span>
                        {producto.tipoVenta && producto.tipoVenta !== 'BOTELLA' && producto.unidadesReales && (
                          <span className="text-xs text-gray-500">
                            {Math.floor(producto.stockActual * producto.unidadesReales)} servicios
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Precio Compra */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      €{producto.precioCompra.toFixed(2)}
                    </td>

                    {/* Precio Venta */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">€{producto.precioVenta.toFixed(2)}</span>
                        {producto.tipoVenta && producto.tipoVenta !== 'BOTELLA' && (
                          <span className="text-xs text-gray-500">/servicio</span>
                        )}
                      </div>
                    </td>

                    {/* Margen */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {renderMargenIndicator(producto)}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${producto.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(producto)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(producto.id, producto.nombre)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationDialog />
      <ProductoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        producto={selectedProducto}
      />
    </div>
  );
};
