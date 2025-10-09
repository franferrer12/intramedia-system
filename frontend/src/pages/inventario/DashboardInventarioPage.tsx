import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryStatsApi, InventoryStats } from '../../api/inventory-stats.api';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowRightLeft,
  Bell,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const DashboardInventarioPage: FC = () => {
  const { data: stats, isLoading } = useQuery<InventoryStats>({
    queryKey: ['inventory-stats'],
    queryFn: inventoryStatsApi.getStats,
    refetchInterval: 60000, // Refrescar cada minuto
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-ES').format(value);
  };

  // Calcular porcentaje de stock bajo
  const porcentajeBajoStock =
    stats.productosActivos > 0
      ? ((stats.productosBajoStock / stats.productosActivos) * 100).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Inventario</h1>
        <p className="text-gray-600 mt-1">Resumen completo del estado del inventario</p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Productos Totales */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Productos Activos</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(stats.productosActivos)}
                </p>
                <p className="ml-2 text-sm text-gray-500">/ {formatNumber(stats.totalProductos)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Valor Total */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.valorTotalInventario)}
              </p>
            </div>
          </div>
        </div>

        {/* Productos Bajo Stock */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bajo Stock</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-orange-600">
                  {formatNumber(stats.productosBajoStock)}
                </p>
                <p className="ml-2 text-sm text-gray-500">({porcentajeBajoStock}%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas Activas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <Bell className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alertas</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-red-600">
                  {formatNumber(stats.alertasActivas)}
                </p>
                {stats.alertasCriticas > 0 && (
                  <p className="ml-2 text-sm text-red-700 font-medium">
                    ({stats.alertasCriticas} críticas)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movimientos y Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimientos Recientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <ArrowRightLeft className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Movimientos de Stock</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Hoy</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatNumber(stats.movimientosHoy)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Última semana</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatNumber(stats.movimientosSemana)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Último mes</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatNumber(stats.movimientosMes)}
              </span>
            </div>
          </div>
        </div>

        {/* Estado del Stock */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Estado del Stock</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">Con stock suficiente</span>
              </div>
              <span className="text-lg font-semibold text-green-600">
                {formatNumber(stats.productosActivos - stats.productosBajoStock)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                <span className="text-sm text-gray-600">Bajo stock mínimo</span>
              </div>
              <span className="text-lg font-semibold text-orange-600">
                {formatNumber(stats.productosBajoStock)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm text-gray-600">Sin stock</span>
              </div>
              <span className="text-lg font-semibold text-red-600">
                {formatNumber(stats.productosSinStock)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Productos Más Movidos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Productos Más Movidos (Últimos 30 días)
          </h3>
        </div>
        {stats.productosMasMovidos.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay movimientos registrados en los últimos 30 días
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Movimientos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Cantidad Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.productosMasMovidos.map((producto) => (
                  <tr key={producto.productoId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {producto.productoNombre}
                      </div>
                      <div className="text-xs text-gray-500">{producto.productoCodigo}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatNumber(producto.totalMovimientos)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {formatNumber(producto.cantidadTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Distribución por Categoría */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Distribución por Categoría</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoría
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Productos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Stock Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Valor Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.values(stats.distribucionPorCategoria)
                .sort((a, b) => b.valorTotal - a.valorTotal)
                .map((cat) => (
                  <tr key={cat.categoria} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {cat.categoria}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {formatNumber(cat.cantidadProductos)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {formatNumber(cat.stockTotal)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(cat.valorTotal)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
