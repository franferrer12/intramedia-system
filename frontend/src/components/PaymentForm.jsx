/**
 * Payment Form Component
 * Sprint 5.1 - Integración con Stripe Elements
 */

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { paymentsAPI } from '../services/api';
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * Payment Form Component (Inner - with Stripe context)
 */
const PaymentFormInner = ({ paymentData, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        return;
      }

      // Confirm payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message);
        if (onError) onError(confirmError);
      } else {
        // Payment succeeded
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Error al procesar el pago');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="p-4 bg-slate-50 rounded-lg">
        <PaymentElement />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <XCircleIcon className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              Procesando...
            </span>
          ) : (
            `Pagar ${formatCurrency(paymentData.amount, paymentData.currency)}`
          )}
        </button>
      </div>
    </form>
  );
};

/**
 * Main Payment Form Component (Wrapper)
 */
const PaymentForm = ({ paymentData, onSuccess, onError, onCancel }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await paymentsAPI.createIntent(paymentData);
      setClientSecret(response.data.data.clientSecret);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(err.response?.data?.error || 'Error al inicializar el pago');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ArrowPathIcon className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600">Inicializando formulario de pago...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircleIcon className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 font-medium mb-4">{error}</p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Volver
          </button>
        )}
      </div>
    );
  }

  if (!clientSecret) {
    return null;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#4f46e5',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Payment Summary */}
      <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Monto a pagar:</span>
          <span className="text-2xl font-bold text-indigo-600">
            {formatCurrency(paymentData.amount, paymentData.currency || 'EUR')}
          </span>
        </div>
        {paymentData.description && (
          <p className="text-sm text-slate-600 mt-2">{paymentData.description}</p>
        )}
      </div>

      {/* Stripe Elements */}
      <Elements stripe={stripePromise} options={options}>
        <PaymentFormInner
          paymentData={paymentData}
          onSuccess={onSuccess}
          onError={onError}
          onCancel={onCancel}
        />
      </Elements>

      {/* Security Badge */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
        <CreditCardIcon className="w-4 h-4" />
        <span>Pago seguro procesado por Stripe</span>
      </div>
    </div>
  );
};

/**
 * Payment Success Component
 */
export const PaymentSuccess = ({ paymentNumber, amount, currency, onClose }) => {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircleIcon className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Pago Exitoso!</h2>
      <p className="text-slate-600 mb-6">
        Tu pago ha sido procesado correctamente
      </p>
      <div className="bg-slate-50 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-slate-600">Número de pago:</span>
          <span className="text-sm font-mono font-semibold text-slate-900">
            {paymentNumber}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Monto:</span>
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(amount, currency)}
          </span>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium"
        >
          Continuar
        </button>
      )}
    </div>
  );
};

/**
 * Payment Error Component
 */
export const PaymentError = ({ error, onRetry, onClose }) => {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircleIcon className="w-12 h-12 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Error en el Pago</h2>
      <p className="text-slate-600 mb-6">
        No pudimos procesar tu pago. Por favor, intenta nuevamente.
      </p>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <div className="flex gap-3 justify-center">
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
          >
            Cancelar
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium"
          >
            Intentar Nuevamente
          </button>
        )}
      </div>
    </div>
  );
};

// Helper function
const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount || 0);
};

export default PaymentForm;
