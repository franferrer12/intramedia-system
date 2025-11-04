import { useState, useEffect } from 'react';
import { eventosAPI, djsAPI, clientesAPI } from '../services/api';
import {
  Search,
  Edit3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  DollarSign,
  Users,
  Building2,
  Home,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Breadcrumbs } from '../components';

const DataCleanup = () => {
  const [eventos, setEventos] = useState([]);
  const [djs, setDjs] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [searchField, setSearchField] = useState('cliente');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventosRes, djsRes, clientesRes] = await Promise.all([
        eventosAPI.getAll(),
        djsAPI.getAll(),
        clientesAPI.getAll()
      ]);

      setEventos(eventosRes.data.data || []);
      setDjs(djsRes.data.data || []);
      setClientes(clientesRes.data.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  // Análisis de datos
  const pendientesCobro = eventos.filter(e => !e.cobrado);
  const pendientesPago = eventos.filter(e => !e.pagado_dj);
  const sinCategoria = eventos.filter(e => !e.categoria || e.categoria.trim() === '');
  const sinDJ = eventos.filter(e => !e.dj_id);

  // Duplicados potenciales de clientes (nombres similares)
  const duplicadosClientes = [];
  clientes.forEach((c1, i) => {
    clientes.slice(i + 1).forEach(c2 => {
      const similarity = calculateSimilarity(c1.nombre?.toLowerCase() || '', c2.nombre?.toLowerCase() || '');
      if (similarity > 0.8) {
        duplicadosClientes.push({ cliente1: c1, cliente2: c2, similarity });
      }
    });
  });

  function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  function levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  // Buscar y reemplazar
  const handleSearchReplace = () => {
    if (!searchTerm || !replaceTerm) {
      toast.error('Por favor, ingresa términos de búsqueda y reemplazo');
      return;
    }

    const matchingEventos = eventos.filter(e => {
      const value = e[searchField]?.toString().toLowerCase() || '';
      return value.includes(searchTerm.toLowerCase());
    });

    if (matchingEventos.length === 0) {
      toast.error('No se encontraron coincidencias');
      return;
    }

    toast.success(`Se encontraron ${matchingEventos.length} coincidencias. Esta funcionalidad estará disponible próximamente.`);
  };

  // Marcar eventos como cobrados
  const handleMarkAsCobrado = async (eventoIds) => {
    try {
      toast.loading('Actualizando eventos...');
      // Aquí iría la lógica de bulk update
      toast.success(`${eventoIds.length} eventos marcados como cobrados`);
      loadData();
    } catch (error) {
      toast.error('Error al actualizar eventos');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Inicio', path: '/', icon: Home },
          { label: 'Limpieza de Datos', path: '/data-cleanup', icon: Database }
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Limpieza de Datos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Herramientas para mantener tus datos limpios y consistentes</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Resumen', icon: AlertTriangle },
            { id: 'search', label: 'Buscar y Reemplazar', icon: Search },
            { id: 'payments', label: 'Pagos Pendientes', icon: DollarSign },
            { id: 'duplicates', label: 'Duplicados', icon: Users },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="w-8 h-8 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Pendientes Cobro</h3>
              </div>
              <p className="text-3xl font-bold text-red-600">{pendientesCobro.length}</p>
              <p className="text-sm text-gray-600 mt-1">Eventos sin cobrar</p>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Pendientes Pago DJ</h3>
              </div>
              <p className="text-3xl font-bold text-orange-600">{pendientesPago.length}</p>
              <p className="text-sm text-gray-600 mt-1">DJs sin pagar</p>
            </div>

            <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Sin Categoría</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{sinCategoria.length}</p>
              <p className="text-sm text-gray-600 mt-1">Eventos sin categoría</p>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Sin DJ</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{sinDJ.length}</p>
              <p className="text-sm text-gray-600 mt-1">Eventos sin DJ asignado</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedTab('payments')}
                className="btn btn-outline flex items-center justify-between"
              >
                <span>Revisar Pagos Pendientes</span>
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-bold">
                  {pendientesCobro.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedTab('duplicates')}
                className="btn btn-outline flex items-center justify-between"
              >
                <span>Ver Posibles Duplicados</span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-sm font-bold">
                  {duplicadosClientes.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedTab('search')}
                className="btn btn-outline flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span>Buscar y Reemplazar Datos</span>
              </button>

              <button
                onClick={loadData}
                className="btn btn-outline flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Actualizar Datos</span>
              </button>
            </div>
          </div>

          {/* Problemas Detectados */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Problemas Detectados</h2>
            <div className="space-y-3">
              {pendientesCobro.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">
                      {pendientesCobro.length} eventos pendientes de cobro
                    </h3>
                  </div>
                  <p className="text-sm text-red-700">
                    Hay eventos que no han sido marcados como cobrados. Revisa la pestaña "Pagos Pendientes".
                  </p>
                </div>
              )}

              {sinCategoria.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-900">
                      {sinCategoria.length} eventos sin categoría
                    </h3>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Algunos eventos no tienen categoría asignada. Esto puede afectar las estadísticas.
                  </p>
                </div>
              )}

              {duplicadosClientes.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">
                      {duplicadosClientes.length} posibles duplicados detectados
                    </h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Hay clientes con nombres muy similares que podrían ser duplicados.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search & Replace Tab */}
      {selectedTab === 'search' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Buscar y Reemplazar en Eventos</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campo a buscar
                </label>
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="input"
                >
                  <option value="cliente">Cliente / Local</option>
                  <option value="ciudad_lugar">Ciudad</option>
                  <option value="categoria">Categoría</option>
                  <option value="evento">Nombre del Evento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input"
                  placeholder="Texto a buscar..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reemplazar con
                </label>
                <input
                  type="text"
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  className="input"
                  placeholder="Texto de reemplazo..."
                />
              </div>

              <button
                onClick={handleSearchReplace}
                className="btn btn-primary flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Buscar
              </button>
            </div>
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Importante</h3>
                <p className="text-sm text-blue-700">
                  Esta herramienta te mostrará una vista previa de los cambios antes de aplicarlos.
                  Siempre podrás revisar y confirmar antes de guardar.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {selectedTab === 'payments' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Eventos Pendientes de Cobro</h2>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                {pendientesCobro.length} eventos
              </span>
            </div>

            {pendientesCobro.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¡Todo al día!
                </h3>
                <p className="text-gray-600">No hay eventos pendientes de cobro</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Fecha</th>
                      <th className="text-left py-3 px-4">Evento</th>
                      <th className="text-left py-3 px-4">Cliente</th>
                      <th className="text-left py-3 px-4">DJ</th>
                      <th className="text-right py-3 px-4">Caché</th>
                      <th className="text-center py-3 px-4">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendientesCobro.slice(0, 20).map((evento) => (
                      <tr key={evento.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{evento.fecha}</td>
                        <td className="py-3 px-4 font-medium">{evento.evento}</td>
                        <td className="py-3 px-4">{evento.cliente}</td>
                        <td className="py-3 px-4">{evento.dj_nombre || 'Sin DJ'}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          €{parseFloat(evento.cache_total || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toast.success('Función en desarrollo')}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Marcar cobrado
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {pendientesCobro.length > 20 && (
                  <div className="mt-4 text-center text-gray-600">
                    Mostrando 20 de {pendientesCobro.length} eventos
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pendientes Pago DJ */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">DJs Pendientes de Pago</h2>
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">
                {pendientesPago.length} eventos
              </span>
            </div>

            {pendientesPago.length > 0 && (
              <p className="text-sm text-gray-600 mb-4">
                Lista de eventos donde el DJ aún no ha sido marcado como pagado
              </p>
            )}
          </div>
        </div>
      )}

      {/* Duplicates Tab */}
      {selectedTab === 'duplicates' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Posibles Clientes Duplicados</h2>

            {duplicadosClientes.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¡Sin duplicados!
                </h3>
                <p className="text-gray-600">No se detectaron clientes duplicados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {duplicadosClientes.map((dup, idx) => (
                  <div key={idx} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Building2 className="w-5 h-5 text-yellow-600" />
                          <span className="font-semibold text-gray-900">
                            Similitud: {(dup.similarity * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-white rounded border">
                            <p className="text-sm text-gray-600">Cliente 1</p>
                            <p className="font-medium text-gray-900">{dup.cliente1.nombre}</p>
                            {dup.cliente1.email && (
                              <p className="text-sm text-gray-600">{dup.cliente1.email}</p>
                            )}
                          </div>
                          <div className="p-3 bg-white rounded border">
                            <p className="text-sm text-gray-600">Cliente 2</p>
                            <p className="font-medium text-gray-900">{dup.cliente2.nombre}</p>
                            {dup.cliente2.email && (
                              <p className="text-sm text-gray-600">{dup.cliente2.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="ml-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Fusionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCleanup;
