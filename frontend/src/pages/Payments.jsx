/**
 * Payments Page
 * Sprint 5.1 - Sistema de Pagos Online con Stripe
 */

import { useState, useEffect, useCallback } from 'react';
import { paymentsAPI } from '../services/api';
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ReceiptRefundIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const Payments = () => {
  // State
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment_type: '',
    date_from: '',
    date_to: '',
  });

  // Refund form
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: 'requested_by_customer',
    reason_description: '',
  });
  const [refundLoading, setRefundLoading] = useState(false);

  // Load payments
  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryFilters = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await paymentsAPI.getAll(queryFilters);
      setPayments(response.data.data.payments);
      setPagination((prev) => ({
        ...prev,
        total: response.data.data.total,
      }));
    } catch (err) {
      console.error('Error loading payments:', err);
      setError(err.response?.data?.error || 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const response = await paymentsAPI.getStats({
        date_from: filters.date_from,
        date_to: filters.date_to,
      });
      setStats(response.data.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [filters.date_from, filters.date_to]);

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [loadPayments, loadStats]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      payment_type: '',
      date_from: '',
      date_to: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle view payment
  const handleViewPayment = async (payment) => {
    try {
      const response = await paymentsAPI.getById(payment.id);
      setSelectedPayment(response.data.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading payment details:', err);
      alert('Error al cargar detalles del pago');
    }
  };

  // Handle refund
  const handleOpenRefund = (payment) => {
    setSelectedPayment(payment);
    setRefundForm({
      amount: payment.amount_received,
      reason: 'requested_by_customer',
      reason_description: '',
    });
    setShowRefundModal(true);
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;

    try {
      setRefundLoading(true);
      await paymentsAPI.createRefund(selectedPayment.id, refundForm);
      alert('Reembolso creado exitosamente');
      setShowRefundModal(false);
      loadPayments();
      loadStats();
    } catch (err) {
      console.error('Error creating refund:', err);
      alert(err.response?.data?.error || 'Error al crear reembolso');
    } finally {
      setRefundLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        color: 'bg-gray-100 text-gray-800',
        icon: ClockIcon,
        label: 'Pendiente',
      },
      processing: {
        color: 'bg-blue-100 text-blue-800',
        icon: ArrowPathIcon,
        label: 'Procesando',
      },
      requires_action: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: ExclamationTriangleIcon,
        label: 'Requiere Acción',
      },
      succeeded: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircleIcon,
        label: 'Exitoso',
      },
      failed: {
        color: 'bg-red-100 text-red-800',
        icon: XCircleIcon,
        label: 'Fallido',
      },
      cancelled: {
        color: 'bg-gray-100 text-gray-800',
        icon: XCircleIcon,
        label: 'Cancelado',
      },
      refunded: {
        color: 'bg-purple-100 text-purple-800',
        icon: ReceiptRefundIcon,
        label: 'Reembolsado',
      },
      partially_refunded: {
        color: 'bg-purple-100 text-purple-800',
        icon: ReceiptRefundIcon,
        label: 'Reemb. Parcial',
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  // Get payment type label
  const getPaymentTypeLabel = (type) => {
    const types = {
      event_deposit: 'Depósito Evento',
      event_balance: 'Balance Evento',
      event_full: 'Pago Completo',
      subscription: 'Suscripción',
      service: 'Servicio',
      late_fee: 'Cargo por Demora',
      other: 'Otro',
    };
    return types[type] || type;
  };

  // Format currency
  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCardIcon className="w-8 h-8 text-indigo-600" />
            Pagos
          </h1>
          <p className="text-slate-600 mt-1">Gestión de pagos y transacciones</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Pagos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.total_count || 0}
                </p>
              </div>
              <BanknotesIcon className="w-10 h-10 text-slate-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Exitosos</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.succeeded_count || 0}
                </p>
              </div>
              <CheckCircleIcon className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Fallidos</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.failed_count || 0}
                </p>
              </div>
              <XCircleIcon className="w-10 h-10 text-red-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Ingresos Netos</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {formatCurrency(stats.total_net)}
                </p>
              </div>
              <CurrencyDollarIcon className="w-10 h-10 text-indigo-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
          >
            <FunnelIcon className="w-5 h-5" />
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {showFilters && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Número de pago, email..."
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="processing">Procesando</option>
                  <option value="requires_action">Requiere Acción</option>
                  <option value="succeeded">Exitoso</option>
                  <option value="failed">Fallido</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="refunded">Reembolsado</option>
                  <option value="partially_refunded">Reemb. Parcial</option>
                </select>
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo
                </label>
                <select
                  value={filters.payment_type}
                  onChange={(e) => handleFilterChange('payment_type', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Todos</option>
                  <option value="event_deposit">Depósito Evento</option>
                  <option value="event_balance">Balance Evento</option>
                  <option value="event_full">Pago Completo</option>
                  <option value="subscription">Suscripción</option>
                  <option value="service">Servicio</option>
                  <option value="late_fee">Cargo por Demora</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <ArrowPathIcon className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <XCircleIcon className="w-12 h-12 text-red-500 mb-2" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <CreditCardIcon className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-slate-500">No se encontraron pagos</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Cliente/Evento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-mono font-medium text-slate-900">
                          {payment.payment_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {formatDate(payment.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </span>
                          {payment.amount_refunded > 0 && (
                            <span className="text-xs text-purple-600">
                              -{formatCurrency(payment.amount_refunded, payment.currency)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {getPaymentTypeLabel(payment.payment_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          {payment.cliente_nombre && (
                            <span className="text-sm text-slate-900">
                              {payment.cliente_nombre}
                            </span>
                          )}
                          {payment.evento_nombre && (
                            <span className="text-xs text-slate-500">
                              {payment.evento_nombre}
                            </span>
                          )}
                          {!payment.cliente_nombre && !payment.evento_nombre && (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {payment.card_brand && payment.card_last4 ? (
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-900 capitalize">
                              {payment.card_brand}
                            </span>
                            <span className="text-xs text-slate-500">
                              •••• {payment.card_last4}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="text-indigo-600 hover:text-indigo-700"
                            title="Ver detalles"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          {payment.status === 'succeeded' &&
                            payment.amount_refunded < payment.amount_received && (
                              <button
                                onClick={() => handleOpenRefund(payment)}
                                className="text-purple-600 hover:text-purple-700"
                                title="Crear reembolso"
                              >
                                <ReceiptRefundIcon className="w-5 h-5" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} pagos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                Detalles del Pago
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* General Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">
                    Número de Pago
                  </label>
                  <p className="text-base font-mono font-semibold text-slate-900 mt-1">
                    {selectedPayment.payment_number}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Estado</label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Monto</label>
                  <p className="text-base font-semibold text-slate-900 mt-1">
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">
                    Monto Recibido
                  </label>
                  <p className="text-base font-semibold text-green-600 mt-1">
                    {formatCurrency(
                      selectedPayment.amount_received,
                      selectedPayment.currency
                    )}
                  </p>
                </div>
                {selectedPayment.amount_refunded > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">
                      Monto Reembolsado
                    </label>
                    <p className="text-base font-semibold text-purple-600 mt-1">
                      {formatCurrency(
                        selectedPayment.amount_refunded,
                        selectedPayment.currency
                      )}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-slate-500">
                    Monto Neto
                  </label>
                  <p className="text-base font-semibold text-indigo-600 mt-1">
                    {formatCurrency(
                      selectedPayment.net_amount,
                      selectedPayment.currency
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Tipo</label>
                  <p className="text-base text-slate-900 mt-1">
                    {getPaymentTypeLabel(selectedPayment.payment_type)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">
                    Fecha de Creación
                  </label>
                  <p className="text-base text-slate-900 mt-1">
                    {formatDate(selectedPayment.created_at)}
                  </p>
                </div>
                {selectedPayment.paid_at && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">
                      Fecha de Pago
                    </label>
                    <p className="text-base text-slate-900 mt-1">
                      {formatDate(selectedPayment.paid_at)}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              {selectedPayment.card_brand && (
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    Método de Pago
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-500">Marca</label>
                      <p className="text-base text-slate-900 mt-1 capitalize">
                        {selectedPayment.card_brand}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500">
                        Últimos 4 dígitos
                      </label>
                      <p className="text-base text-slate-900 mt-1 font-mono">
                        •••• {selectedPayment.card_last4}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Info */}
              {selectedPayment.billing_email && (
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    Información de Facturación
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPayment.billing_name && (
                      <div>
                        <label className="text-sm font-medium text-slate-500">
                          Nombre
                        </label>
                        <p className="text-base text-slate-900 mt-1">
                          {selectedPayment.billing_name}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-slate-500">Email</label>
                      <p className="text-base text-slate-900 mt-1">
                        {selectedPayment.billing_email}
                      </p>
                    </div>
                    {selectedPayment.billing_phone && (
                      <div>
                        <label className="text-sm font-medium text-slate-500">
                          Teléfono
                        </label>
                        <p className="text-base text-slate-900 mt-1">
                          {selectedPayment.billing_phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Related Info */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">
                  Información Relacionada
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedPayment.cliente_nombre && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">
                        Cliente
                      </label>
                      <p className="text-base text-slate-900 mt-1">
                        {selectedPayment.cliente_nombre}
                      </p>
                    </div>
                  )}
                  {selectedPayment.evento_nombre && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">Evento</label>
                      <p className="text-base text-slate-900 mt-1">
                        {selectedPayment.evento_nombre}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedPayment.description && (
                <div className="border-t border-slate-200 pt-4">
                  <label className="text-sm font-medium text-slate-500">Descripción</label>
                  <p className="text-base text-slate-900 mt-1">
                    {selectedPayment.description}
                  </p>
                </div>
              )}

              {/* Stripe IDs */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">
                  IDs de Stripe
                </h4>
                <div className="space-y-2">
                  {selectedPayment.stripe_payment_intent_id && (
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Payment Intent
                      </label>
                      <p className="text-sm text-slate-900 mt-1 font-mono">
                        {selectedPayment.stripe_payment_intent_id}
                      </p>
                    </div>
                  )}
                  {selectedPayment.stripe_charge_id && (
                    <div>
                      <label className="text-xs font-medium text-slate-500">Charge</label>
                      <p className="text-sm text-slate-900 mt-1 font-mono">
                        {selectedPayment.stripe_charge_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              {selectedPayment.receipt_url && (
                <a
                  href={selectedPayment.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded-lg transition-colors"
                >
                  Ver Recibo
                </a>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Crear Reembolso</h3>
              <p className="text-sm text-slate-600 mt-1">
                Pago: {selectedPayment.payment_number}
              </p>
            </div>

            <form onSubmit={handleSubmitRefund} className="p-6 space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Monto a Reembolsar
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={
                    selectedPayment.amount_received - selectedPayment.amount_refunded
                  }
                  value={refundForm.amount}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, amount: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Máximo:{' '}
                  {formatCurrency(
                    selectedPayment.amount_received - selectedPayment.amount_refunded,
                    selectedPayment.currency
                  )}
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Motivo
                </label>
                <select
                  value={refundForm.reason}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="requested_by_customer">Solicitado por cliente</option>
                  <option value="duplicate">Duplicado</option>
                  <option value="fraudulent">Fraudulento</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={refundForm.reason_description}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, reason_description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Motivo detallado del reembolso..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  disabled={refundLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                  disabled={refundLoading}
                >
                  {refundLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    'Crear Reembolso'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
