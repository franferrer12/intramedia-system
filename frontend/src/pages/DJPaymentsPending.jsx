import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, DollarSign, Filter, Calendar, User, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const DJPaymentsPending = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dj_id: '',
    prioridad: ''
  });
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.dj_id) params.append('dj_id', filters.dj_id);
      if (filters.prioridad) params.append('prioridad', filters.prioridad);

      const response = await fetch(`http://localhost:3001/api/djs-financial/pagos-pendientes?${params}`);
      const data = await response.json();

      if (data.success) {
        setPayments(data.data);
      }
    } catch (error) {
      console.error('Error al cargar pagos pendientes:', error);
      toast.error('Error al cargar pagos pendientes');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPriorityColor = (prioridad) => {
    switch (prioridad) {
      case 'Urgente':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Alta':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getPriorityIcon = (prioridad) => {
    switch (prioridad) {
      case 'Urgente':
        return <AlertCircle className="w-4 h-4" />;
      case 'Alta':
        return <Clock className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const handleSelectPayment = (eventoId) => {
    setSelectedPayments(prev =>
      prev.includes(eventoId)
        ? prev.filter(id => id !== eventoId)
        : [...prev, eventoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === payments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map(p => p.evento_id));
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedPayments.length === 0) {
      toast.error('Selecciona al menos un pago');
      return;
    }

    if (!confirm(`¿Confirmar ${selectedPayments.length} pago(s) como realizados?`)) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch('http://localhost:3001/api/djs-financial/eventos/marcar-pagados', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventoIds: selectedPayments })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${selectedPayments.length} pago(s) marcado(s) como realizado(s)`);
        setSelectedPayments([]);
        loadPayments();
      } else {
        toast.error(data.message || 'Error al marcar pagos');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar pagos');
    } finally {
      setProcessing(false);
    }
  };

  const getTotalPending = () => {
    return payments.reduce((sum, p) => sum + parseFloat(p.monto_pendiente || 0), 0);
  };

  const getTotalSelected = () => {
    return payments
      .filter(p => selectedPayments.includes(p.evento_id))
      .reduce((sum, p) => sum + parseFloat(p.monto_pendiente || 0), 0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos Pendientes a DJs</h1>
          <p className="text-gray-600 mt-1">Gestiona los pagos pendientes de eventos</p>
        </div>
        {selectedPayments.length > 0 && (
          <button
            onClick={handleMarkAsPaid}
            disabled={processing}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors shadow-lg"
          >
            <CheckCircle className="w-5 h-5" />
            Marcar {selectedPayments.length} como Pagado{selectedPayments.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pendiente</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(getTotalPending())}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Eventos Pendientes</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {payments.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Seleccionados</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(getTotalSelected())}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <select
            value={filters.prioridad}
            onChange={(e) => setFilters({ ...filters, prioridad: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Todas las prioridades</option>
            <option value="Urgente">Urgente (&gt;30 días)</option>
            <option value="Alta">Alta (&gt;15 días)</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPayments.length === payments.length && payments.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DJ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Evento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días Pendiente
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-900 font-semibold text-lg">¡No hay pagos pendientes!</p>
                    <p className="text-gray-500 text-sm mt-1">Todos los DJs están al día</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment.evento_id}
                    className={`hover:bg-gray-50 ${
                      selectedPayments.includes(payment.evento_id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.evento_id)}
                        onChange={() => handleSelectPayment(payment.evento_id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-700" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.dj_nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.dj_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{payment.evento_nombre}</div>
                      <div className="text-sm text-gray-500">{payment.cliente_nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.evento_fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrency(payment.monto_pendiente)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-lg font-semibold ${
                        payment.dias_pendiente > 30 ? 'text-red-600' :
                        payment.dias_pendiente > 15 ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {payment.dias_pendiente}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">días</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(payment.prioridad_pago)}`}>
                        {getPriorityIcon(payment.prioridad_pago)}
                        {payment.prioridad_pago}
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

export default DJPaymentsPending;
