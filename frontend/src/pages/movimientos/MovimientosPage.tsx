import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { movimientosStockApi, MovimientoStock } from '../../api/movimientos-stock.api';
import { productosApi } from '../../api/productos.api';
import { reportesApi } from '../../api/reportes.api';
import { ArrowDownCircle, ArrowUpCircle, Edit3, AlertCircle, RotateCcw, Plus, FileDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { notify, handleApiError } from '../../utils/notifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MovimientoModal } from '../../components/movimientos/MovimientoModal';

const TIPOS_MOVIMIENTO = [
  { value: '', label: 'Todos' },
  { value: 'ENTRADA', label: 'Entrada', icon: ArrowDownCircle, color: 'text-green-600' },
  { value: 'SALIDA', label: 'Salida', icon: ArrowUpCircle, color: 'text-red-600' },
  { value: 'AJUSTE', label: 'Ajuste', icon: Edit3, color: 'text-blue-600' },
  { value: 'MERMA', label: 'Merma', icon: AlertCircle, color: 'text-orange-600' },
  { value: 'DEVOLUCION', label: 'Devolución', icon: RotateCcw, color: 'text-purple-600' },
];

export const MovimientosPage: FC = () => {
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroProducto, setFiltroProducto] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: movimientos = [], isLoading } = useQuery<MovimientoStock[]>({
    queryKey: ['movimientos-stock'],
    queryFn: movimientosStockApi.getAll,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos-activos'],
    queryFn: productosApi.getActivos,
  });

  const movimientosFiltrados = movimientos.filter((mov) => {
    const matchTipo = !filtroTipo || mov.tipoMovimiento === filtroTipo;
    const matchProducto = !filtroProducto || mov.productoId.toString() === filtroProducto;
    return matchTipo && matchProducto;
  });

  const getTipoConfig = (tipo: string) => {
    return TIPOS_MOVIMIENTO.find((t) => t.value === tipo) || TIPOS_MOVIMIENTO[0];
  };

  const handleExportExcel = async () => {
    try {
      // Exportar últimos 3 meses por defecto
      const hoy = new Date();
      const hace3Meses = new Date();
      hace3Meses.setMonth(hace3Meses.getMonth() - 3);

      const fechaInicio = hace3Meses.toISOString().split('T')[0];
      const fechaFin = hoy.toISOString().split('T')[0];

      await reportesApi.exportMovimientosStockExcel(fechaInicio, fechaFin);
      notify.success('Movimientos exportados correctamente');
    } catch (error) {
      handleApiError(error, 'Error al exportar los movimientos');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimientos de Stock</h1>
          <p className="text-gray-600 mt-1">Historial de entradas, salidas y ajustes de inventario</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Movimiento
          </Button>
        </div>
      </div>

      {/* Resumen de movimientos */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {TIPOS_MOVIMIENTO.slice(1).map((tipo) => {
          const Icon = tipo.icon || ArrowDownCircle;
          const count = movimientos.filter((m) => m.tipoMovimiento === tipo.value).length;
          return (
            <div key={tipo.value} className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-300">
              <div className="flex items-center">
                <Icon className={`h-6 w-6 ${tipo.color} mr-3`} />
                <div>
                  <p className="text-sm text-gray-600">{tipo.label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento:</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {TIPOS_MOVIMIENTO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto:</label>
            <select
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos los productos</option>
              {productos.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.codigo} - {prod.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de movimientos */}
      {isLoading ? (
        <div className="text-center py-12">Cargando movimientos...</div>
      ) : movimientosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No hay movimientos registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Anterior</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Nuevo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movimientosFiltrados.map((movimiento) => {
                const tipoConfig = getTipoConfig(movimiento.tipoMovimiento);
                const TipoIcon = tipoConfig.icon || ArrowDownCircle;

                return (
                  <tr key={movimiento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div className="font-medium">
                          {format(new Date(movimiento.fechaMovimiento), 'dd MMM yyyy', { locale: es })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(movimiento.fechaMovimiento), 'HH:mm')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{movimiento.productoNombre}</div>
                      <div className="text-xs text-gray-500">{movimiento.productoCodigo}</div>
                      {movimiento.eventoNombre && (
                        <div className="text-xs text-blue-600">Evento: {movimiento.eventoNombre}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoConfig.color} bg-gray-100`}>
                        <TipoIcon className="h-3 w-3 mr-1" />
                        {tipoConfig.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="font-medium">{movimiento.cantidad.toFixed(2)} bot.</div>
                      {(() => {
                        const producto = productos.find(p => p.id === movimiento.productoId);
                        if (producto?.tipoVenta && producto.tipoVenta !== 'BOTELLA' && producto.unidadesReales) {
                          const servicios = Math.floor(movimiento.cantidad * producto.unidadesReales);
                          return (
                            <div className="text-xs text-purple-600">
                              ≈ {servicios} servicios
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="text-gray-600">{movimiento.stockAnterior.toFixed(2)} bot.</div>
                      {(() => {
                        const producto = productos.find(p => p.id === movimiento.productoId);
                        if (producto?.tipoVenta && producto.tipoVenta !== 'BOTELLA' && producto.unidadesReales) {
                          const servicios = Math.floor(movimiento.stockAnterior * producto.unidadesReales);
                          return (
                            <div className="text-xs text-gray-500">
                              ≈ {servicios} serv.
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div
                        className={`font-medium ${
                          movimiento.stockNuevo > movimiento.stockAnterior
                            ? 'text-green-600'
                            : movimiento.stockNuevo < movimiento.stockAnterior
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {movimiento.stockNuevo.toFixed(2)} bot.
                      </div>
                      {(() => {
                        const producto = productos.find(p => p.id === movimiento.productoId);
                        if (producto?.tipoVenta && producto.tipoVenta !== 'BOTELLA' && producto.unidadesReales) {
                          const servicios = Math.floor(movimiento.stockNuevo * producto.unidadesReales);
                          return (
                            <div className={`text-xs ${
                              movimiento.stockNuevo > movimiento.stockAnterior
                                ? 'text-green-500'
                                : movimiento.stockNuevo < movimiento.stockAnterior
                                ? 'text-red-500'
                                : 'text-gray-500'
                            }`}>
                              ≈ {servicios} serv.
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {movimiento.motivo || '-'}
                      {movimiento.referencia && (
                        <div className="text-xs text-gray-500">Ref: {movimiento.referencia}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {movimiento.usuarioNombre || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <MovimientoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
