import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  DollarSign,
  ShoppingCart,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { pedidosApi } from '../../api/pedidos.api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertasPedidos } from '../../components/pedidos/AlertasPedidos';

export default function PedidosDashboardPage() {
  const [periodoMeses, setPeriodoMeses] = useState(6);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos'],
    queryFn: pedidosApi.getAll,
  });

  // Calcular estadísticas generales
  const stats = {
    totalPedidos: pedidos.length,
    totalRecibidos: pedidos.filter(p => p.estado === 'RECIBIDO').length,
    totalPendientes: pedidos.filter(p => ['ENVIADO', 'CONFIRMADO', 'EN_TRANSITO', 'PARCIAL'].includes(p.estado)).length,
    totalCancelados: pedidos.filter(p => p.estado === 'CANCELADO').length,
    totalInvertido: pedidos.filter(p => p.estado === 'RECIBIDO').reduce((sum, p) => sum + p.total, 0),
    promedioTicket: pedidos.filter(p => p.estado === 'RECIBIDO').length > 0
      ? pedidos.filter(p => p.estado === 'RECIBIDO').reduce((sum, p) => sum + p.total, 0) / pedidos.filter(p => p.estado === 'RECIBIDO').length
      : 0,
  };

  // Calcular tendencias (comparar mes actual vs anterior)
  const mesActualInicio = startOfMonth(new Date());
  const mesActualFin = endOfMonth(new Date());
  const mesAnteriorInicio = startOfMonth(subMonths(new Date(), 1));
  const mesAnteriorFin = endOfMonth(subMonths(new Date(), 1));

  const pedidosMesActual = pedidos.filter(p =>
    isWithinInterval(new Date(p.fechaPedido), { start: mesActualInicio, end: mesActualFin })
  );
  const pedidosMesAnterior = pedidos.filter(p =>
    isWithinInterval(new Date(p.fechaPedido), { start: mesAnteriorInicio, end: mesAnteriorFin })
  );

  const inversionMesActual = pedidosMesActual.filter(p => p.estado === 'RECIBIDO').reduce((sum, p) => sum + p.total, 0);
  const inversionMesAnterior = pedidosMesAnterior.filter(p => p.estado === 'RECIBIDO').reduce((sum, p) => sum + p.total, 0);

  const tendenciaInversion = inversionMesAnterior > 0
    ? ((inversionMesActual - inversionMesAnterior) / inversionMesAnterior) * 100
    : 0;

  const tendenciaCantidad = pedidosMesAnterior.length > 0
    ? ((pedidosMesActual.length - pedidosMesAnterior.length) / pedidosMesAnterior.length) * 100
    : 0;

  // Top 5 Proveedores por inversión
  const proveedoresStats = pedidos
    .filter(p => p.estado === 'RECIBIDO')
    .reduce((acc, pedido) => {
      const key = pedido.proveedorNombre;
      if (!acc[key]) {
        acc[key] = { nombre: key, total: 0, cantidad: 0 };
      }
      acc[key].total += pedido.total;
      acc[key].cantidad += 1;
      return acc;
    }, {} as Record<string, { nombre: string; total: number; cantidad: number }>);

  const topProveedores = Object.values(proveedoresStats)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Top 10 Productos más comprados
  const productosStats = pedidos
    .filter(p => p.estado === 'RECIBIDO')
    .flatMap(p => p.detalles)
    .reduce((acc, detalle) => {
      const key = detalle.productoNombre;
      if (!acc[key]) {
        acc[key] = {
          nombre: key,
          categoria: detalle.productoCategoria,
          cantidadTotal: 0,
          inversionTotal: 0,
          veces: 0
        };
      }
      acc[key].cantidadTotal += detalle.cantidadRecibida;
      acc[key].inversionTotal += detalle.subtotal;
      acc[key].veces += 1;
      return acc;
    }, {} as Record<string, any>);

  const topProductos = Object.values(productosStats)
    .sort((a: any, b: any) => b.inversionTotal - a.inversionTotal)
    .slice(0, 10);

  // Evolución mensual (últimos N meses)
  const mesesData = [];
  for (let i = periodoMeses - 1; i >= 0; i--) {
    const fecha = subMonths(new Date(), i);
    const inicio = startOfMonth(fecha);
    const fin = endOfMonth(fecha);

    const pedidosMes = pedidos.filter(p =>
      isWithinInterval(new Date(p.fechaPedido), { start: inicio, end: fin })
    );

    const recibidosMes = pedidosMes.filter(p => p.estado === 'RECIBIDO');

    mesesData.push({
      mes: format(fecha, 'MMM yy', { locale: es }),
      pedidos: pedidosMes.length,
      recibidos: recibidosMes.length,
      inversion: recibidosMes.reduce((sum, p) => sum + p.total, 0),
    });
  }

  // Distribución por estado
  const estadosData = [
    { name: 'Recibidos', value: stats.totalRecibidos, color: '#10B981' },
    { name: 'Pendientes', value: stats.totalPendientes, color: '#F59E0B' },
    { name: 'Borradores', value: pedidos.filter(p => p.estado === 'BORRADOR').length, color: '#6B7280' },
    { name: 'Cancelados', value: stats.totalCancelados, color: '#EF4444' },
  ].filter(item => item.value > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Compras</h1>
        <p className="text-gray-600 mt-1">
          Análisis y métricas de pedidos a proveedores
        </p>
      </div>

      {/* Alertas de Pedidos */}
      <AlertasPedidos />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Invertido */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 opacity-80" />
            <div className={`flex items-center gap-1 text-sm font-medium ${
              tendenciaInversion >= 0 ? 'text-green-200' : 'text-red-200'
            }`}>
              {tendenciaInversion >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(tendenciaInversion).toFixed(1)}%
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">
            {stats.totalInvertido.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
          <p className="text-sm opacity-80">Total Invertido</p>
        </div>

        {/* Total Pedidos */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <ShoppingCart className="h-8 w-8 opacity-80" />
            <div className={`flex items-center gap-1 text-sm font-medium ${
              tendenciaCantidad >= 0 ? 'text-green-200' : 'text-red-200'
            }`}>
              {tendenciaCantidad >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(tendenciaCantidad).toFixed(1)}%
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalPedidos}</p>
          <p className="text-sm opacity-80">Total Pedidos</p>
        </div>

        {/* Promedio Ticket */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Package className="h-8 w-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-1">
            {stats.promedioTicket.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
          <p className="text-sm opacity-80">Promedio por Pedido</p>
        </div>

        {/* Pendientes */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="h-8 w-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalPendientes}</p>
          <p className="text-sm opacity-80">Pedidos Pendientes</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución Mensual */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Evolución de Compras</h3>
            <select
              value={periodoMeses}
              onChange={(e) => setPeriodoMeses(Number(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md"
            >
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mesesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'inversion') return [value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }), 'Inversión'];
                  return [value, name === 'pedidos' ? 'Pedidos' : 'Recibidos'];
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="pedidos" stroke="#4F46E5" strokeWidth={2} name="Pedidos" />
              <Line yAxisId="left" type="monotone" dataKey="recibidos" stroke="#10B981" strokeWidth={2} name="Recibidos" />
              <Line yAxisId="right" type="monotone" dataKey="inversion" stroke="#F59E0B" strokeWidth={2} name="Inversión" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por Estado */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={estadosData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {estadosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Proveedores */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top 5 Proveedores</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProveedores} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nombre" type="category" width={120} />
              <Tooltip
                formatter={(value: any) => value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              />
              <Bar dataKey="total" fill="#4F46E5" name="Total Invertido" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Productos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top 10 Productos</h3>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {topProductos.map((producto: any, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{producto.nombre}</p>
                  <p className="text-xs text-gray-500">{producto.categoria} • {producto.cantidadTotal.toFixed(0)} unidades • {producto.veces} pedidos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">
                    {producto.inversionTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas y Recomendaciones */}
      {stats.totalPendientes > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Pedidos Pendientes de Recepción</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Tienes {stats.totalPendientes} pedido{stats.totalPendientes !== 1 ? 's' : ''} pendiente{stats.totalPendientes !== 1 ? 's' : ''} de recepcionar.
                Revisa el módulo de pedidos para gestionar las entregas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
