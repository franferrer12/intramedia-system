import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import activosFijosApi, { ActivoFijo } from '../../api/activos-fijos.api';
import { CATEGORIAS_ACTIVO_FIJO } from '../../constants/categorias-activo';
import ActivoFijoModal from './ActivoFijoModal';

export default function ActivosFijosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivo, setSelectedActivo] = useState<ActivoFijo | null>(null);

  const queryClient = useQueryClient();

  // Query para obtener activos
  const { data: activos = [], isLoading } = useQuery({
    queryKey: ['activos-fijos'],
    queryFn: activosFijosApi.getAll
  });

  // Query para estadísticas
  const { data: valorTotal = 0 } = useQuery({
    queryKey: ['activos-valor-total'],
    queryFn: activosFijosApi.getValorTotal
  });

  const { data: valorNeto = 0 } = useQuery({
    queryKey: ['activos-valor-neto'],
    queryFn: activosFijosApi.getValorNetoTotal
  });

  const { data: amortizacionAcumulada = 0 } = useQuery({
    queryKey: ['activos-amortizacion'],
    queryFn: activosFijosApi.getAmortizacionAcumulada
  });

  // Mutation para eliminar
  const deleteMutation = useMutation({
    mutationFn: activosFijosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos-fijos'] });
      queryClient.invalidateQueries({ queryKey: ['activos-valor-total'] });
      queryClient.invalidateQueries({ queryKey: ['activos-valor-neto'] });
      queryClient.invalidateQueries({ queryKey: ['activos-amortizacion'] });
      toast.success('Activo fijo eliminado correctamente');
    },
    onError: () => {
      toast.error('Error al eliminar el activo fijo');
    }
  });

  // Filtrar activos
  const activosFiltrados = activos.filter(activo => {
    const matchesSearch = activo.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = !selectedCategoria || activo.categoria === selectedCategoria;
    return matchesSearch && matchesCategoria;
  });

  const handleEdit = (activo: ActivoFijo) => {
    setSelectedActivo(activo);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este activo fijo?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActivo(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const porcentajeAmortizacionTotal = valorTotal > 0 ? (amortizacionAcumulada / valorTotal) * 100 : 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Activos Fijos</h1>
        <p className="text-gray-600">Gestión de activos fijos y amortizaciones</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(valorTotal)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Neto Actual</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(valorNeto)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Amortización Acumulada</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(amortizacionAcumulada)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">% Amortizado</p>
              <p className="text-2xl font-bold text-purple-600">
                {porcentajeAmortizacionTotal.toFixed(2)}%
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-bold">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar activos..."
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
            {CATEGORIAS_ACTIVO_FIJO.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Nuevo Activo
          </button>
        </div>
      </div>

      {/* Tabla de activos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando activos...</div>
        ) : activosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron activos fijos
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Inicial</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Neto</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Amortizado</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Años Rest.</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activosFiltrados.map(activo => (
                  <tr key={activo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{activo.nombre}</div>
                      {activo.ubicacion && (
                        <div className="text-sm text-gray-500">{activo.ubicacion}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {CATEGORIAS_ACTIVO_FIJO.find(c => c.value === activo.categoria)?.label}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {formatCurrency(activo.valorInicial)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                      {formatCurrency(activo.valorNeto)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-gray-900">
                          {activo.porcentajeAmortizacion.toFixed(2)}%
                        </span>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(activo.porcentajeAmortizacion, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {activo.aniosRestantes} años
                    </td>
                    <td className="px-6 py-4 text-center">
                      {activo.completamenteAmortizado ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Amortizado
                        </span>
                      ) : activo.activo ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(activo)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(activo.id)}
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
        <ActivoFijoModal
          activo={selectedActivo}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
