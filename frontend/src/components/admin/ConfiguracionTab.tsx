import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminConfigApi, type ConfiguracionSistema } from '../../api/admin.api';
import { Search, Edit, Save, X, Plus, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfiguracionTab() {
  const queryClient = useQueryClient();
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  const [editandoConfig, setEditandoConfig] = useState<ConfiguracionSistema | null>(null);
  const [valorTemporal, setValorTemporal] = useState('');
  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);
  const [nuevaConfig, setNuevaConfig] = useState<Partial<ConfiguracionSistema>>({
    tipo: 'STRING',
    categoria: 'GENERAL',
  });

  const { data: configuraciones, isLoading } = useQuery({
    queryKey: ['admin-config-all'],
    queryFn: () => adminConfigApi.getAll(),
  });

  const { data: categorias } = useQuery({
    queryKey: ['admin-config-categorias'],
    queryFn: () => adminConfigApi.getCategorias(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ clave, valor }: { clave: string; valor: string }) =>
      adminConfigApi.update(clave, valor),
    onSuccess: () => {
      toast.success('Configuración actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['admin-config-all'] });
      setEditandoConfig(null);
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar: ${error.response?.data?.message || error.message}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (config: Partial<ConfiguracionSistema>) => adminConfigApi.create(config),
    onSuccess: () => {
      toast.success('Configuración creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['admin-config-all'] });
      setMostrarFormularioNuevo(false);
      setNuevaConfig({ tipo: 'STRING', categoria: 'GENERAL' });
    },
    onError: (error: any) => {
      toast.error(`Error al crear: ${error.response?.data?.message || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (clave: string) => adminConfigApi.delete(clave),
    onSuccess: () => {
      toast.success('Configuración eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['admin-config-all'] });
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleEditar = (config: ConfiguracionSistema) => {
    setEditandoConfig(config);
    setValorTemporal(config.valor);
  };

  const handleGuardar = () => {
    if (editandoConfig) {
      updateMutation.mutate({
        clave: editandoConfig.clave,
        valor: valorTemporal,
      });
    }
  };

  const handleCrear = () => {
    if (!nuevaConfig.clave || !nuevaConfig.valor) {
      toast.error('Clave y valor son obligatorios');
      return;
    }
    createMutation.mutate(nuevaConfig);
  };

  const handleEliminar = (clave: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la configuración "${clave}"?`)) {
      deleteMutation.mutate(clave);
    }
  };

  const configuracionesFiltradas = configuraciones?.filter((config) => {
    const matchCategoria = !categoriaSeleccionada || config.categoria === categoriaSeleccionada;
    const matchBusqueda =
      !busqueda ||
      config.clave.toLowerCase().includes(busqueda.toLowerCase()) ||
      config.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  const configuracionesPorCategoria = configuracionesFiltradas?.reduce((acc, config) => {
    if (!acc[config.categoria]) {
      acc[config.categoria] = [];
    }
    acc[config.categoria].push(config);
    return acc;
  }, {} as Record<string, ConfiguracionSistema[]>);

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'STRING':
        return 'bg-blue-100 text-blue-800';
      case 'NUMBER':
        return 'bg-green-100 text-green-800';
      case 'BOOLEAN':
        return 'bg-purple-100 text-purple-800';
      case 'JSON':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Configuración del Sistema</h2>
          <p className="text-sm text-gray-600 mt-1">
            {configuraciones?.length || 0} configuraciones totales
          </p>
        </div>
        <button
          onClick={() => setMostrarFormularioNuevo(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Configuración
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Todas las categorías</option>
              {categorias?.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por clave o descripción..."
                className="w-full pl-10 rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* New Config Form */}
      {mostrarFormularioNuevo && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4">Nueva Configuración</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Clave *</label>
              <input
                type="text"
                value={nuevaConfig.clave || ''}
                onChange={(e) => setNuevaConfig({ ...nuevaConfig, clave: e.target.value })}
                placeholder="ej: max_file_size_mb"
                className="w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor *</label>
              <input
                type="text"
                value={nuevaConfig.valor || ''}
                onChange={(e) => setNuevaConfig({ ...nuevaConfig, valor: e.target.value })}
                placeholder="ej: 10"
                className="w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <select
                value={nuevaConfig.tipo || 'STRING'}
                onChange={(e) => setNuevaConfig({ ...nuevaConfig, tipo: e.target.value as any })}
                className="w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="STRING">STRING</option>
                <option value="NUMBER">NUMBER</option>
                <option value="BOOLEAN">BOOLEAN</option>
                <option value="JSON">JSON</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
              <select
                value={nuevaConfig.categoria || 'GENERAL'}
                onChange={(e) => setNuevaConfig({ ...nuevaConfig, categoria: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm"
              >
                {categorias?.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="NUEVA">+ Nueva Categoría</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                value={nuevaConfig.descripcion || ''}
                onChange={(e) => setNuevaConfig({ ...nuevaConfig, descripcion: e.target.value })}
                placeholder="Descripción de la configuración..."
                rows={2}
                className="w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCrear}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {createMutation.isPending ? 'Creando...' : 'Crear'}
            </button>
            <button
              onClick={() => {
                setMostrarFormularioNuevo(false);
                setNuevaConfig({ tipo: 'STRING', categoria: 'GENERAL' });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Configurations List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando configuraciones...</p>
        </div>
      ) : configuracionesPorCategoria && Object.keys(configuracionesPorCategoria).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(configuracionesPorCategoria).map(([categoria, configs]) => (
            <div key={categoria} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-600" />
                  {categoria}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({configs.length} configuraciones)
                  </span>
                </h3>
              </div>

              <div className="divide-y">
                {configs.map((config) => (
                  <div key={config.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {config.clave}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoBadgeColor(config.tipo)}`}>
                            {config.tipo}
                          </span>
                        </div>

                        {config.descripcion && (
                          <p className="text-sm text-gray-600 mb-2">{config.descripcion}</p>
                        )}

                        {editandoConfig?.id === config.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={valorTemporal}
                              onChange={(e) => setValorTemporal(e.target.value)}
                              className="flex-1 rounded-md border-gray-300 shadow-sm text-sm"
                              autoFocus
                            />
                            <button
                              onClick={handleGuardar}
                              disabled={updateMutation.isPending}
                              className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditandoConfig(null)}
                              className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                              {config.valor}
                            </code>
                          </div>
                        )}

                        {config.modificadoPorNombre && (
                          <p className="text-xs text-gray-500 mt-2">
                            Modificado por: {config.modificadoPorNombre} el{' '}
                            {new Date(config.fechaModificacion).toLocaleString('es-ES')}
                          </p>
                        )}
                      </div>

                      {editandoConfig?.id !== config.id && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditar(config)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEliminar(config.clave)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600">
          <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p>No se encontraron configuraciones</p>
        </div>
      )}
    </div>
  );
}
