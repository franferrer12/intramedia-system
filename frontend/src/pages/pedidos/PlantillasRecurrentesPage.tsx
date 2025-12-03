import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plantillasApi, recurrentesApi, type PlantillaPedido, type PedidoRecurrente } from '../../api/plantillas-pedido.api';
import { Plus, Calendar, Clock, CheckCircle, XCircle, Play, Trash2, FileText, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

type Tab = 'plantillas' | 'recurrentes';

export default function PlantillasRecurrentesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('plantillas');

  // Queries
  const { data: plantillas, isLoading: loadingPlantillas } = useQuery({
    queryKey: ['plantillas-pedido'],
    queryFn: () => plantillasApi.getAll(),
  });

  const { data: recurrentes, isLoading: loadingRecurrentes } = useQuery({
    queryKey: ['pedidos-recurrentes'],
    queryFn: () => recurrentesApi.getAll(),
  });

  const { data: proximasEjecuciones } = useQuery({
    queryKey: ['proximas-ejecuciones'],
    queryFn: () => recurrentesApi.getProximasEjecuciones(7),
  });

  // Mutations
  const togglePlantillaMutation = useMutation({
    mutationFn: (id: number) => plantillasApi.toggleActiva(id),
    onSuccess: () => {
      toast.success('Plantilla actualizada');
      queryClient.invalidateQueries({ queryKey: ['plantillas-pedido'] });
    },
  });

  const toggleRecurrenteMutation = useMutation({
    mutationFn: (id: number) => recurrentesApi.toggleActivo(id),
    onSuccess: () => {
      toast.success('Pedido recurrente actualizado');
      queryClient.invalidateQueries({ queryKey: ['pedidos-recurrentes'] });
    },
  });

  const ejecutarPendientesMutation = useMutation({
    mutationFn: () => recurrentesApi.ejecutarPendientes(),
    onSuccess: (data) => {
      toast.success(`${data.ejecutados} pedidos generados exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['pedidos-recurrentes'] });
    },
  });

  const eliminarPlantillaMutation = useMutation({
    mutationFn: (id: number) => plantillasApi.eliminar(id),
    onSuccess: () => {
      toast.success('Plantilla eliminada');
      queryClient.invalidateQueries({ queryKey: ['plantillas-pedido'] });
    },
  });

  const eliminarRecurrenteMutation = useMutation({
    mutationFn: (id: number) => recurrentesApi.eliminar(id),
    onSuccess: () => {
      toast.success('Pedido recurrente eliminado');
      queryClient.invalidateQueries({ queryKey: ['pedidos-recurrentes'] });
    },
  });

  const handleEliminarPlantilla = (id: number, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la plantilla "${nombre}"?`)) {
      eliminarPlantillaMutation.mutate(id);
    }
  };

  const handleEliminarRecurrente = (id: number, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el pedido recurrente "${nombre}"?`)) {
      eliminarRecurrenteMutation.mutate(id);
    }
  };

  const getFrecuenciaColor = (frecuencia: string) => {
    switch (frecuencia) {
      case 'SEMANAL':
        return 'bg-blue-100 text-blue-800';
      case 'QUINCENAL':
        return 'bg-green-100 text-green-800';
      case 'MENSUAL':
        return 'bg-purple-100 text-purple-800';
      case 'TRIMESTRAL':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Plantillas y Pedidos Recurrentes</h1>
        <p className="text-gray-600 mt-2">
          Gestiona plantillas de pedidos y automatiza pedidos recurrentes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Plantillas</p>
              <p className="text-2xl font-bold text-gray-900">{plantillas?.length || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pedidos Recurrentes</p>
              <p className="text-2xl font-bold text-gray-900">{recurrentes?.length || 0}</p>
            </div>
            <Repeat className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próximas (7 días)</p>
              <p className="text-2xl font-bold text-gray-900">{proximasEjecuciones?.length || 0}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <button
            onClick={() => ejecutarPendientesMutation.mutate()}
            disabled={ejecutarPendientesMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {ejecutarPendientesMutation.isPending ? 'Ejecutando...' : 'Ejecutar Pendientes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('plantillas')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium ${
              activeTab === 'plantillas'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-5 w-5" />
            Plantillas ({plantillas?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('recurrentes')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium ${
              activeTab === 'recurrentes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Repeat className="h-5 w-5" />
            Pedidos Recurrentes ({recurrentes?.length || 0})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'plantillas' ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Plantillas de Pedidos</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              Nueva Plantilla
            </button>
          </div>

          {loadingPlantillas ? (
            <div className="p-12 text-center text-gray-600">Cargando plantillas...</div>
          ) : plantillas && plantillas.length > 0 ? (
            <div className="divide-y">
              {plantillas.map((plantilla: PlantillaPedido) => (
                <div key={plantilla.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{plantilla.nombre}</h3>
                        {plantilla.activa ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Activa
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactiva
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{plantilla.descripcion}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Proveedor: {plantilla.proveedorNombre}</span>
                        <span>•</span>
                        <span>Creada: {format(new Date(plantilla.fechaCreacion), 'dd/MM/yyyy', { locale: es })}</span>
                        <span>•</span>
                        <span>Por: {plantilla.creadoPorNombre}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => togglePlantillaMutation.mutate(plantilla.id)}
                        className={`p-2 rounded-md ${plantilla.activa ? 'bg-gray-100 hover:bg-gray-200' : 'bg-green-100 hover:bg-green-200'}`}
                        title={plantilla.activa ? 'Desactivar' : 'Activar'}
                      >
                        {plantilla.activa ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleEliminarPlantilla(plantilla.id, plantilla.nombre)}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-md"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-600">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p>No hay plantillas creadas</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pedidos Recurrentes Programados</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              Nuevo Pedido Recurrente
            </button>
          </div>

          {loadingRecurrentes ? (
            <div className="p-12 text-center text-gray-600">Cargando pedidos recurrentes...</div>
          ) : recurrentes && recurrentes.length > 0 ? (
            <div className="divide-y">
              {recurrentes.map((recurrente: PedidoRecurrente) => (
                <div key={recurrente.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{recurrente.plantillaNombre}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFrecuenciaColor(recurrente.frecuencia)}`}>
                          {recurrente.frecuencia}
                        </span>
                        {recurrente.activo ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactivo
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 mb-2">{recurrente.descripcionFrecuencia}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Próxima: {format(new Date(recurrente.proximaEjecucion), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                        {recurrente.ultimaEjecucion && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Última: {format(new Date(recurrente.ultimaEjecucion), 'dd/MM/yyyy', { locale: es })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => toggleRecurrenteMutation.mutate(recurrente.id)}
                        className={`p-2 rounded-md ${recurrente.activo ? 'bg-gray-100 hover:bg-gray-200' : 'bg-green-100 hover:bg-green-200'}`}
                        title={recurrente.activo ? 'Desactivar' : 'Activar'}
                      >
                        {recurrente.activo ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleEliminarRecurrente(recurrente.id, recurrente.plantillaNombre)}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-md"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-600">
              <Repeat className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p>No hay pedidos recurrentes programados</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
