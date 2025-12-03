import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { pedidosApi } from '../../api/pedidos.api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoricoPreciosModalProps {
  isOpen: boolean;
  onClose: () => void;
  productoId: number;
  productoNombre: string;
}

export const HistoricoPreciosModal = ({
  isOpen,
  onClose,
  productoId,
  productoNombre
}: HistoricoPreciosModalProps) => {
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos'],
    queryFn: pedidosApi.getAll,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  // Filtrar detalles del producto específico en pedidos recibidos
  const historico = pedidos
    .filter(p => p.estado === 'RECIBIDO')
    .flatMap(p =>
      p.detalles
        .filter(d => d.productoId === productoId)
        .map(d => ({
          fecha: p.fechaRecepcion || p.fechaPedido,
          precio: d.precioUnitario,
          cantidad: d.cantidadRecibida,
          proveedor: p.proveedorNombre,
          numeroPedido: p.numeroPedido,
        }))
    )
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  if (historico.length === 0 && !isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Histórico de Precios</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">No hay histórico de precios para este producto</p>
            <p className="text-sm text-gray-400 mt-2">El producto no ha sido recepcionado aún</p>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={onClose} variant="outline">Cerrar</Button>
          </div>
        </div>
      </div>
    );
  }

  // Calcular estadísticas
  const precioActual = historico[historico.length - 1]?.precio || 0;
  const precioAnterior = historico[historico.length - 2]?.precio || precioActual;
  const precioMinimo = Math.min(...historico.map(h => h.precio));
  const precioMaximo = Math.max(...historico.map(h => h.precio));
  const precioPromedio = historico.reduce((sum, h) => sum + h.precio, 0) / historico.length;

  const tendencia = precioActual - precioAnterior;
  const tendenciaPorcentaje = precioAnterior > 0 ? (tendencia / precioAnterior) * 100 : 0;

  // Datos para gráfica
  const chartData = historico.map(h => ({
    fecha: format(new Date(h.fecha), 'dd/MM/yy'),
    precio: h.precio,
  }));

  // Agrupar por proveedor
  const proveedoresStats = historico.reduce((acc, h) => {
    if (!acc[h.proveedor]) {
      acc[h.proveedor] = {
        nombre: h.proveedor,
        compras: 0,
        precioPromedio: 0,
        precioTotal: 0,
      };
    }
    acc[h.proveedor].compras += 1;
    acc[h.proveedor].precioTotal += h.precio;
    acc[h.proveedor].precioPromedio = acc[h.proveedor].precioTotal / acc[h.proveedor].compras;
    return acc;
  }, {} as Record<string, any>);

  const proveedoresOrdenados = Object.values(proveedoresStats).sort((a: any, b: any) => a.precioPromedio - b.precioPromedio);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Histórico de Precios</h2>
            <p className="text-gray-600 mt-1">{productoNombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Precio Actual</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {precioActual.toFixed(2)}€
                </p>
                <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                  tendencia > 0 ? 'text-red-600' : tendencia < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {tendencia > 0 ? <TrendingUp className="h-4 w-4" /> : tendencia < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  {tendencia !== 0 && `${Math.abs(tendenciaPorcentaje).toFixed(1)}%`}
                  {tendencia === 0 && 'Sin cambios'}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Precio Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {precioPromedio.toFixed(2)}€
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Precio Mínimo</p>
                <p className="text-2xl font-bold text-green-600">
                  {precioMinimo.toFixed(2)}€
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-gray-600 mb-1">Precio Máximo</p>
                <p className="text-2xl font-bold text-red-600">
                  {precioMaximo.toFixed(2)}€
                </p>
              </div>
            </div>

            {/* Gráfica de evolución */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución de Precios</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [`${value.toFixed(2)}€`, 'Precio']}
                  />
                  <Line type="monotone" dataKey="precio" stroke="#4F46E5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Comparación por proveedor */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparación por Proveedor</h3>
              <div className="space-y-3">
                {proveedoresOrdenados.map((prov: any, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        index === 0 ? 'bg-green-500' : index === proveedoresOrdenados.length - 1 ? 'bg-red-500' : 'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{prov.nombre}</p>
                        <p className="text-xs text-gray-500">{prov.compras} compra{prov.compras !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {prov.precioPromedio.toFixed(2)}€
                      </p>
                      <p className="text-xs text-gray-500">promedio</p>
                    </div>
                  </div>
                ))}
              </div>
              {proveedoresOrdenados.length > 1 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{proveedoresOrdenados[0].nombre}</strong> ofrece el mejor precio promedio (
                    {((proveedoresOrdenados[proveedoresOrdenados.length - 1].precioPromedio - proveedoresOrdenados[0].precioPromedio) / proveedoresOrdenados[proveedoresOrdenados.length - 1].precioPromedio * 100).toFixed(1)}%
                    más barato que {proveedoresOrdenados[proveedoresOrdenados.length - 1].nombre})
                  </p>
                </div>
              )}
            </div>

            {/* Historial detallado */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Historial Detallado</h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variación</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...historico].reverse().map((h, index, arr) => {
                      const precioAnteriorItem = arr[index + 1]?.precio || h.precio;
                      const variacion = h.precio - precioAnteriorItem;
                      const variacionPorcentaje = precioAnteriorItem > 0 ? (variacion / precioAnteriorItem) * 100 : 0;

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {format(new Date(h.fecha), 'dd/MM/yyyy', { locale: es })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{h.numeroPedido}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{h.proveedor}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{h.cantidad}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            {h.precio.toFixed(2)}€
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {index < arr.length - 1 && (
                              <span className={`flex items-center justify-end gap-1 ${
                                variacion > 0 ? 'text-red-600' : variacion < 0 ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {variacion > 0 ? <TrendingUp className="h-3 w-3" /> : variacion < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                {variacion !== 0 && `${variacionPorcentaje > 0 ? '+' : ''}${variacionPorcentaje.toFixed(1)}%`}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <Button onClick={onClose} variant="outline">Cerrar</Button>
        </div>
      </div>
    </div>
  );
};
