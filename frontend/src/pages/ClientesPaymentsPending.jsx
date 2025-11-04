import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, DollarSign, CheckCircle, Calendar, User, Music } from 'lucide-react';
import toast from 'react-hot-toast';

const ClientesPaymentsPending = () => {
  const navigate = useNavigate();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load pending payments
      const filterParam = filter !== 'all' ? `?prioridad=${filter}` : '';
      const paymentsResponse = await fetch(`http://localhost:3001/api/clientes-financial/cobros-pendientes${filterParam}`);
      const paymentsData = await paymentsResponse.json();

      // Load summary
      const resumenResponse = await fetch('http://localhost:3001/api/clientes-financial/cobros-pendientes/resumen');
      const resumenData = await resumenResponse.json();

      if (paymentsData.success) {
        setPendingPayments(paymentsData.data);
      }

      if (resumenData.success) {
        setResumen(resumenData.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar cobros pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedPayments.length === 0) {
      toast.error('Selecciona al menos un cobro');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/clientes-financial/eventos/marcar-cobrados', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventoIds: selectedPayments })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${selectedPayments.length} cobro(s) marcado(s) como realizado(s)`);
        setSelectedPayments([]);
        loadData();
      } else {
        toast.error('Error al marcar cobros como realizados');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar la solicitud');
    }
  };

  const togglePayment = (eventoId) => {
    setSelectedPayments(prev =>
      prev.includes(eventoId)
        ? prev.filter(id => id !== eventoId)
        : [...prev, eventoId]
    );
  };

  const toggleAll = () => {
    if (selectedPayments.length === pendingPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(pendingPayments.map(p => p.evento_id));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      'Crítica': 'bg-red-100 text-red-700 border-red-300',
      'Urgente': 'bg-orange-100 text-orange-700 border-orange-300',
      'Alta': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Normal': 'bg-green-100 text-green-700 border-green-300'
    };
    return colors[prioridad] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getPrioridadIcon = (prioridad) => {
    const icons = {
      'Crítica': '🔴',
      'Urgente': '🟠',
      'Alta': '🟡',
      'Normal': '🟢'
    };
    return icons[prioridad] || '⚪';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cobros Pendientes de Clientes</h1>
          <p className="text-gray-600 mt-1">Gestión y seguimiento de cobros pendientes por prioridad</p>
        </div>
        <button
          onClick={() => navigate('/clientes-financial')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {resumen.map((item) => (
          <div
            key={item.prioridad}
            className={`rounded-xl shadow p-5 border-l-4 ${
              item.prioridad === 'Crítica' ? 'border-red-500 bg-red-50' :
              item.prioridad === 'Urgente' ? 'border-orange-500 bg-orange-50' :
              item.prioridad === 'Alta' ? 'border-yellow-500 bg-yellow-50' :
              'border-green-500 bg-green-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{getPrioridadIcon(item.prioridad)}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(item.prioridad)}`}>
                {item.prioridad}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{formatCurrency(item.monto_total)}</h3>
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <p>{item.total_clientes} clientes • {item.total_eventos} eventos</p>
              <p className="text-xs">{item.dias_promedio} días promedio</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({pendingPayments.length})
            </button>
            <button
              onClick={() => setFilter('Crítica')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Crítica' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔴 Crítica
            </button>
            <button
              onClick={() => setFilter('Urgente')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Urgente' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🟠 Urgente
            </button>
            <button
              onClick={() => setFilter('Alta')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Alta' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🟡 Alta
            </button>
            <button
              onClick={() => setFilter('Normal')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Normal' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🟢 Normal
            </button>
          </div>

          <button
            onClick={handleMarkAsPaid}
            disabled={selectedPayments.length === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              selectedPayments.length > 0
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Marcar como Cobrado ({selectedPayments.length})
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPayments.length === pendingPayments.length && pendingPayments.length > 0}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DJ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Evento
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días Pendiente
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
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
              ) : pendingPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">¡No hay cobros pendientes!</p>
                    <p className="text-sm text-gray-500 mt-1">Todos los pagos están al día</p>
                  </td>
                </tr>
              ) : (
                pendingPayments.map((payment) => (
                  <tr
                    key={payment.evento_id}
                    className={`hover:bg-gray-50 transition-colors ${
                      payment.alto_riesgo ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.evento_id)}
                        onChange={() => togglePayment(payment.evento_id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-700" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.cliente_nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.cliente_email || payment.cliente_telefono || 'Sin contacto'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{payment.evento_nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700">
                        <Music className="w-4 h-4 mr-2 text-purple-500" />
                        {payment.dj_nombre || 'Sin asignar'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center text-sm text-gray-700">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        {new Date(payment.evento_fecha).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.dias_pendiente > 60 ? 'bg-red-100 text-red-700' :
                        payment.dias_pendiente > 30 ? 'bg-orange-100 text-orange-700' :
                        payment.dias_pendiente > 15 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {payment.dias_pendiente} días
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(payment.monto_pendiente)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Comisión: {formatCurrency(payment.comision_pendiente)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPrioridadColor(payment.prioridad_cobro)}`}>
                        {getPrioridadIcon(payment.prioridad_cobro)} {payment.prioridad_cobro}
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

export default ClientesPaymentsPending;
