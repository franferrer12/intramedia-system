import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Package, RefreshCw, Eye, CheckCircle, XCircle, Trash2, Search, Download, Filter } from 'lucide-react';
import { pedidosApi } from '../../api/pedidos.api';
import { proveedoresApi } from '../../api/proveedores.api';
import type { Pedido, EstadoPedido, CrearPedidoRequest, RecepcionarPedidoRequest } from '../../types/pedido';
import { ESTADO_COLORS } from '../../types/pedido';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PedidoFormModal } from '../../components/pedidos/PedidoFormModal';
import { RecepcionModal } from '../../components/pedidos/RecepcionModal';
import { PedidoDetalleModal } from '../../components/pedidos/PedidoDetalleModal';

export default function PedidosPage() {
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | 'TODOS'>('TODOS');
  const [filtroProveedor, setFiltroProveedor] = useState<number | 'TODOS'>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecepcionModal, setShowRecepcionModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const queryClient = useQueryClient();

  // Query para obtener todos los pedidos
  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ['pedidos'],
    queryFn: pedidosApi.getAll,
  });

  // Query para obtener proveedores
  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores-activos'],
    queryFn: proveedoresApi.getActivos,
  });

  // Mutation para crear pedido
  const createMutation = useMutation({
    mutationFn: (data: CrearPedidoRequest) => pedidosApi.create(data),
    onSuccess: () => {
      toast.success('Pedido creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
    onError: () => {
      toast.error('Error al crear el pedido');
    },
  });

  // Mutation para recepcionar pedido
  const recepcionarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RecepcionarPedidoRequest }) =>
      pedidosApi.recepcionar(id, data),
    onSuccess: () => {
      toast.success('Pedido recepcionado correctamente');
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
    },
    onError: () => {
      toast.error('Error al recepcionar el pedido');
    },
  });

  // Mutation para cancelar pedido
  const cancelarMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) =>
      pedidosApi.cancelar(id, motivo),
    onSuccess: () => {
      toast.success('Pedido cancelado');
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
    onError: () => {
      toast.error('Error al cancelar el pedido');
    },
  });

  // Mutation para eliminar pedido
  const deleteMutation = useMutation({
    mutationFn: (id: number) => pedidosApi.delete(id),
    onSuccess: () => {
      toast.success('Pedido eliminado');
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
    onError: () => {
      toast.error('Error al eliminar el pedido');
    },
  });

  // Filtrar y buscar pedidos
  const pedidosFiltrados = useMemo(() => {
    let resultado = pedidos;

    // Filtro por estado
    if (filtroEstado !== 'TODOS') {
      resultado = resultado.filter(p => p.estado === filtroEstado);
    }

    // Filtro por proveedor
    if (filtroProveedor !== 'TODOS') {
      resultado = resultado.filter(p => p.proveedorId === filtroProveedor);
    }

    // Búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      resultado = resultado.filter(p =>
        p.numeroPedido.toLowerCase().includes(busquedaLower) ||
        p.proveedorNombre.toLowerCase().includes(busquedaLower) ||
        p.estadoDisplay.toLowerCase().includes(busquedaLower) ||
        p.notas?.toLowerCase().includes(busquedaLower) ||
        p.detalles.some(d => d.productoNombre.toLowerCase().includes(busquedaLower))
      );
    }

    return resultado;
  }, [pedidos, filtroEstado, filtroProveedor, busqueda]);

  const handleRecepcionar = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setShowRecepcionModal(true);
  };

  const handleSubmitRecepcion = async (data: RecepcionarPedidoRequest) => {
    if (!pedidoSeleccionado) return;
    await recepcionarMutation.mutateAsync({ id: pedidoSeleccionado.id, data });
  };

  const handleSubmitCrear = async (data: CrearPedidoRequest) => {
    await createMutation.mutateAsync(data);
  };

  const handleVerDetalle = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setShowDetalleModal(true);
  };

  const exportarAExcel = () => {
    // Crear CSV manualmente
    const headers = [
      'Número',
      'Proveedor',
      'Estado',
      'Fecha Pedido',
      'Fecha Esperada',
      'Fecha Recepción',
      'Subtotal',
      'Impuestos',
      'Total',
      'Usuario',
      'Productos',
      'Notas'
    ];

    const rows = pedidosFiltrados.map(p => [
      p.numeroPedido,
      p.proveedorNombre,
      p.estadoDisplay,
      format(new Date(p.fechaPedido), 'dd/MM/yyyy HH:mm'),
      p.fechaEsperada ? format(new Date(p.fechaEsperada), 'dd/MM/yyyy') : '',
      p.fechaRecepcion ? format(new Date(p.fechaRecepcion), 'dd/MM/yyyy HH:mm') : '',
      p.subtotal.toFixed(2),
      p.impuestos.toFixed(2),
      p.total.toFixed(2),
      p.usuarioNombre,
      p.detalles.length,
      p.notas || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exportados ${pedidosFiltrados.length} pedidos a CSV`);
  };

  const handleCancelar = (pedido: Pedido) => {
    const motivo = window.prompt('Motivo de cancelación (opcional):');
    if (motivo !== null) { // null si cancela el prompt
      cancelarMutation.mutate({ id: pedido.id, motivo });
    }
  };

  const handleEliminar = (pedido: Pedido) => {
    if (window.confirm(`¿Eliminar el pedido ${pedido.numeroPedido}?`)) {
      deleteMutation.mutate(pedido.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedidos a Proveedores</h1>
            <p className="text-gray-600 mt-1">
              Gestión de pedidos y recepción de mercancía
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                mostrarFiltros || filtroProveedor !== 'TODOS' || busqueda
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {(filtroProveedor !== 'TODOS' || busqueda) && (
                <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  ✓
                </span>
              )}
            </button>
            <button
              onClick={exportarAExcel}
              disabled={pedidosFiltrados.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo Pedido
            </button>
          </div>
        </div>
      </div>

      {/* Búsqueda y Filtros Avanzados */}
      {mostrarFiltros && (
        <div className="mb-6 bg-white rounded-lg border border-gray-300 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar pedidos
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Número, proveedor, producto..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Filtro por Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por proveedor
              </label>
              <select
                value={filtroProveedor}
                onChange={(e) => setFiltroProveedor(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TODOS">Todos los proveedores</option>
                {proveedores.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón limpiar filtros */}
          {(filtroProveedor !== 'TODOS' || busqueda) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFiltroProveedor('TODOS');
                  setBusqueda('');
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filtros de Estado */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['TODOS', 'BORRADOR', 'ENVIADO', 'CONFIRMADO', 'EN_TRANSITO', 'RECIBIDO', 'PARCIAL', 'CANCELADO'].map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado as EstadoPedido | 'TODOS')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroEstado === estado
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {estado === 'TODOS' ? 'Todos' : estado.replace('_', ' ')}
            <span className="ml-2 text-xs">
              ({estado === 'TODOS' ? pedidos.length : pedidos.filter(p => p.estado === estado).length})
            </span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes Recepción</p>
              <p className="text-2xl font-bold text-orange-600">
                {pedidos.filter(p => ['ENVIADO', 'CONFIRMADO', 'EN_TRANSITO', 'PARCIAL'].includes(p.estado)).length}
              </p>
            </div>
            <Package className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recibidos Este Mes</p>
              <p className="text-2xl font-bold text-green-600">
                {pedidos.filter(p => p.estado === 'RECIBIDO').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Borradores</p>
              <p className="text-2xl font-bold text-gray-600">
                {pedidos.filter(p => p.estado === 'BORRADOR').length}
              </p>
            </div>
            <Package className="h-8 w-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invertido</p>
              <p className="text-2xl font-bold text-indigo-600">
                {pedidos
                  .filter(p => p.estado === 'RECIBIDO')
                  .reduce((sum, p) => sum + p.total, 0)
                  .toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <Package className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Esperada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>No hay pedidos que mostrar</p>
                    <p className="text-sm mt-1">Crea tu primer pedido haciendo clic en "Nuevo Pedido"</p>
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{pedido.numeroPedido}</div>
                      <div className="text-xs text-gray-500">{pedido.usuarioNombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pedido.proveedorNombre}</div>
                      {pedido.proveedorContacto && (
                        <div className="text-xs text-gray-500">{pedido.proveedorContacto}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(pedido.fechaPedido), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pedido.fechaEsperada
                        ? format(new Date(pedido.fechaEsperada), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ESTADO_COLORS[pedido.estado]}`}>
                        {pedido.estadoDisplay}
                      </span>
                      {pedido.parcialmenteRecibido && (
                        <div className="text-xs text-yellow-600 mt-1">
                          {pedido.cantidadRecibida.toFixed(0)}/{pedido.cantidadTotal.toFixed(0)} unidades
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pedido.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pedido.detalles.length} producto{pedido.detalles.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerDetalle(pedido)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {pedido.puedeRecepcionar && (
                          <button
                            onClick={() => handleRecepcionar(pedido)}
                            className="text-green-600 hover:text-green-900"
                            title="Recepcionar"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}

                        {pedido.puedeCancelar && (
                          <button
                            onClick={() => handleCancelar(pedido)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Cancelar"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        {(pedido.estado === 'BORRADOR' || pedido.estado === 'CANCELADO') && (
                          <button
                            onClick={() => handleEliminar(pedido)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <PedidoFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitCrear}
      />

      {pedidoSeleccionado && (
        <>
          <RecepcionModal
            isOpen={showRecepcionModal}
            onClose={() => {
              setShowRecepcionModal(false);
              setPedidoSeleccionado(null);
            }}
            onSubmit={handleSubmitRecepcion}
            pedido={pedidoSeleccionado}
          />

          <PedidoDetalleModal
            isOpen={showDetalleModal}
            onClose={() => {
              setShowDetalleModal(false);
              setPedidoSeleccionado(null);
            }}
            pedido={pedidoSeleccionado}
          />
        </>
      )}
    </div>
  );
}
