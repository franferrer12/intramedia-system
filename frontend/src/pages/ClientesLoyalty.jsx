import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, TrendingUp, AlertTriangle, DollarSign, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const ClientesLoyalty = () => {
  const navigate = useNavigate();
  const [fidelidad, setFidelidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterNivel, setFilterNivel] = useState('all');
  const [filterRiesgo, setFilterRiesgo] = useState('all');

  useEffect(() => {
    loadData();
  }, [filterNivel, filterRiesgo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterNivel !== 'all') params.append('nivel_fidelidad', filterNivel);
      if (filterRiesgo !== 'all') params.append('riesgo_perdida', filterRiesgo);

      const response = await fetch(`http://localhost:3001/api/clientes-financial/fidelidad?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setFidelidad(data.data);
      }
    } catch (error) {
      console.error('Error al cargar fidelidad:', error);
      toast.error('Error al cargar análisis de fidelidad');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getNivelFidelidadColor = (nivel) => {
    const colors = {
      'Cliente Platino': 'bg-purple-100 text-purple-700 border-purple-300',
      'Cliente Oro': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Cliente Plata': 'bg-gray-100 text-gray-700 border-gray-300',
      'Cliente Bronce': 'bg-orange-100 text-orange-700 border-orange-300',
      'Cliente Nuevo': 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return colors[nivel] || 'bg-gray-100 text-gray-700';
  };

  const getNivelFidelidadIcon = (nivel) => {
    const icons = {
      'Cliente Platino': '💎',
      'Cliente Oro': '🥇',
      'Cliente Plata': '🥈',
      'Cliente Bronce': '🥉',
      'Cliente Nuevo': '🌟'
    };
    return icons[nivel] || '⭐';
  };

  const getRiesgoPerdidaColor = (riesgo) => {
    const colors = {
      'Alto': 'bg-red-100 text-red-700',
      'Medio': 'bg-orange-100 text-orange-700',
      'Bajo': 'bg-green-100 text-green-700'
    };
    return colors[riesgo] || 'bg-gray-100 text-gray-700';
  };

  const getStats = () => {
    const stats = {
      total: fidelidad.length,
      platino: fidelidad.filter(c => c.nivel_fidelidad === 'Cliente Platino').length,
      oro: fidelidad.filter(c => c.nivel_fidelidad === 'Cliente Oro').length,
      plata: fidelidad.filter(c => c.nivel_fidelidad === 'Cliente Plata').length,
      riesgoAlto: fidelidad.filter(c => c.riesgo_perdida === 'Alto').length,
      valorTotal: fidelidad.reduce((sum, c) => sum + parseFloat(c.valor_total_cliente || 0), 0),
      rentabilidadTotal: fidelidad.reduce((sum, c) => sum + parseFloat(c.rentabilidad_total || 0), 0)
    };
    return stats;
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análisis de Fidelidad de Clientes</h1>
          <p className="text-gray-600 mt-1">Segmentación y riesgo de pérdida de clientes</p>
        </div>
        <button
          onClick={() => navigate('/clientes-financial')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Clientes Platino</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{stats.platino}</p>
            </div>
            <div className="text-4xl">💎</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Clientes Oro</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.oro}</p>
            </div>
            <div className="text-4xl">🥇</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Clientes Plata</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.plata}</p>
            </div>
            <div className="text-4xl">🥈</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Riesgo Alto</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.riesgoAlto}</p>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Value KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.valorTotal)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rentabilidad Total Agencia</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(stats.rentabilidadTotal)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex gap-2">
            <span className="text-sm text-gray-700 font-medium my-auto">Nivel:</span>
            <button
              onClick={() => setFilterNivel('all')}
              className={`px-3 py-1 rounded-lg text-sm ${filterNivel === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterNivel('Cliente Platino')}
              className={`px-3 py-1 rounded-lg text-sm ${filterNivel === 'Cliente Platino' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              💎 Platino
            </button>
            <button
              onClick={() => setFilterNivel('Cliente Oro')}
              className={`px-3 py-1 rounded-lg text-sm ${filterNivel === 'Cliente Oro' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              🥇 Oro
            </button>
            <button
              onClick={() => setFilterNivel('Cliente Plata')}
              className={`px-3 py-1 rounded-lg text-sm ${filterNivel === 'Cliente Plata' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              🥈 Plata
            </button>
          </div>

          <div className="border-l border-gray-300 h-8"></div>

          <div className="flex gap-2">
            <span className="text-sm text-gray-700 font-medium my-auto">Riesgo:</span>
            <button
              onClick={() => setFilterRiesgo('all')}
              className={`px-3 py-1 rounded-lg text-sm ${filterRiesgo === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterRiesgo('Alto')}
              className={`px-3 py-1 rounded-lg text-sm ${filterRiesgo === 'Alto' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              🔴 Alto
            </button>
            <button
              onClick={() => setFilterRiesgo('Medio')}
              className={`px-3 py-1 rounded-lg text-sm ${filterRiesgo === 'Medio' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              🟠 Medio
            </button>
            <button
              onClick={() => setFilterRiesgo('Bajo')}
              className={`px-3 py-1 rounded-lg text-sm ${filterRiesgo === 'Bajo' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              🟢 Bajo
            </button>
          </div>
        </div>
      </div>

      {/* Loyalty Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nivel Fidelidad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eventos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meses como Cliente
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eventos/Mes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rentabilidad
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Riesgo Pérdida
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : fidelidad.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                fidelidad.map((cliente) => (
                  <tr
                    key={cliente.cliente_id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/cliente-metrics?id=${cliente.cliente_id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-indigo-700" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {cliente.cliente_nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            {cliente.cliente_ciudad}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getNivelFidelidadColor(cliente.nivel_fidelidad)}`}>
                        {getNivelFidelidadIcon(cliente.nivel_fidelidad)} {cliente.nivel_fidelidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {cliente.total_eventos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                      {cliente.meses_como_cliente} meses
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                      {cliente.eventos_por_mes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                      {formatCurrency(cliente.valor_total_cliente)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                      {formatCurrency(cliente.rentabilidad_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiesgoPerdidaColor(cliente.riesgo_perdida)}`}>
                        {cliente.riesgo_perdida}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientesLoyalty;
