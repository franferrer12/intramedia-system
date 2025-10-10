import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, DollarSign, TrendingUp, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';
import inversionInicialApi, { InversionInicial } from '../../api/inversion-inicial.api';
import { CATEGORIAS_ACTIVO } from '../../constants/categorias-activo';
import InversionModal from './InversionModal';

export default function InversionesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInversion, setSelectedInversion] = useState<InversionInicial | null>(null);

  const queryClient = useQueryClient();

  // Query para obtener inversiones
  const { data: inversiones = [], isLoading } = useQuery({
    queryKey: ['inversiones-iniciales'],
    queryFn: inversionInicialApi.getAll
  });

  // Query para inversión total
  const { data: inversionTotal = 0 } = useQuery({
    queryKey: ['inversion-total'],
    queryFn: inversionInicialApi.getInversionTotal
  });

  // Mutation para eliminar
  const deleteMutation = useMutation({
    mutationFn: inversionInicialApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inversiones-iniciales'] });
      queryClient.invalidateQueries({ queryKey: ['inversion-total'] });
      toast.success('Inversión eliminada correctamente');
    },
    onError: () => {
      toast.error('Error al eliminar la inversión');
    }
  });

  // Filtrar inversiones
  const inversionesFiltradas = useMemo(() => {
    return inversiones.filter(inversion => {
      const matchesSearch = inversion.concepto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategoria = !selectedCategoria || inversion.categoria === selectedCategoria;

      let matchesFecha = true;
      if (fechaInicio && fechaFin) {
        const fecha = new Date(inversion.fecha);
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        matchesFecha = fecha >= inicio && fecha <= fin;
      }

      return matchesSearch && matchesCategoria && matchesFecha;
    });
  }, [inversiones, searchTerm, selectedCategoria, fechaInicio, fechaFin]);

  // Calcular resumen por categorías
  const resumenPorCategoria = useMemo(() => {
    const resumen = new Map<string, number>();

    inversionesFiltradas.forEach(inversion => {
      const actual = resumen.get(inversion.categoria) || 0;
      resumen.set(inversion.categoria, actual + inversion.monto);
    });

    return Array.from(resumen.entries())
      .map(([categoria, monto]) => ({
        categoria,
        monto,
        label: CATEGORIAS_ACTIVO.find(c => c.value === categoria)?.label || categoria
      }))
      .sort((a, b) => b.monto - a.monto);
  }, [inversionesFiltradas]);

  const totalFiltrado = useMemo(() => {
    return inversionesFiltradas.reduce((sum, inv) => sum + inv.monto, 0);
  }, [inversionesFiltradas]);

  const handleEdit = (inversion: InversionInicial) => {
    setSelectedInversion(inversion);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta inversión?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInversion(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inversión Inicial</h1>
        <p className="text-gray-600">Gestión de inversiones iniciales del negocio</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inversión Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(inversionTotal)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Filtrado</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalFiltrado)}</p>
            </div>
            <Filter className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inversiones Registradas</p>
              <p className="text-2xl font-bold text-purple-600">{inversionesFiltradas.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Resumen por categorías */}
      {resumenPorCategoria.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inversión por Categoría</h2>
          <div className="space-y-3">
            {resumenPorCategoria.map(({ categoria, label, monto }) => {
              const porcentaje = (monto / totalFiltrado) * 100;
              return (
                <div key={categoria}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(monto)} ({porcentaje.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barra de acciones */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por concepto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIAS_ACTIVO.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Nueva Inversión
            </button>
          </div>

          {/* Filtro de fechas */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex-1 flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700">Desde:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <label className="text-sm font-medium text-gray-700">Hasta:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {(fechaInicio || fechaFin) && (
                <button
                  onClick={() => {
                    setFechaInicio('');
                    setFechaFin('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de inversiones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando inversiones...</div>
        ) : inversionesFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron inversiones iniciales
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forma de Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inversionesFiltradas.map(inversion => (
                  <tr key={inversion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(inversion.fecha)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{inversion.concepto}</div>
                      {inversion.descripcion && (
                        <div className="text-sm text-gray-500">{inversion.descripcion}</div>
                      )}
                      {inversion.numeroFactura && (
                        <div className="text-xs text-gray-400 mt-1">
                          Factura: {inversion.numeroFactura}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {CATEGORIAS_ACTIVO.find(c => c.value === inversion.categoria)?.label}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                      {formatCurrency(inversion.monto)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {inversion.formaPago || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {inversion.proveedorNombre || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(inversion)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(inversion.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <InversionModal
          inversion={selectedInversion}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
