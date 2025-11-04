import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  PiggyBank,
  User,
  AlertCircle,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const FinancialBreakdown = ({ eventoId }) => {
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFinancialBreakdown();
  }, [eventoId]);

  const loadFinancialBreakdown = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/eventos/${eventoId}/financial-breakdown`);
      setBreakdown(response.data);
    } catch (err) {
      console.error('Error cargando breakdown financiero:', err);
      setError('No se pudo cargar el desglose financiero');
      toast.error('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Desglose Financiero
        </h3>
      </div>

      {/* Resumen Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ingresos */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Ingresos</h4>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(breakdown.ingreso_total)}
          </p>
        </div>

        {/* Costos Totales */}
        <div className="card bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Costos Totales</h4>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(breakdown.costos_totales)}
          </p>
        </div>

        {/* Beneficio Agencia */}
        <div className="card bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Beneficio Agencia</h4>
          </div>
          <p className={`text-2xl font-bold ${
            breakdown.beneficio_bruto >= 0
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(breakdown.beneficio_bruto)}
          </p>
        </div>
      </div>

      {/* Desglose de Costos */}
      <div className="card">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          Desglose de Costos
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-white/10">
            <span className="text-sm text-gray-600 dark:text-gray-400">Costo DJ</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(breakdown.costo_dj)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-white/10">
            <span className="text-sm text-gray-600 dark:text-gray-400">Costo Alquiler</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(breakdown.costo_alquiler)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Otros Costos</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(breakdown.otros_costos)}
            </span>
          </div>
        </div>
      </div>

      {/* Distribución de Beneficios */}
      <div className="card bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700/50">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Distribución de Beneficios
        </h4>

        <div className="space-y-3">
          {/* Gastos Fijos */}
          <div className="p-3 bg-white dark:bg-gray-800/50 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Gastos Fijos
                </span>
              </div>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(breakdown.monto_gastos_fijos)}
              </span>
            </div>
          </div>

          {/* Inversión */}
          <div className="p-3 bg-white dark:bg-gray-800/50 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Inversión
                </span>
              </div>
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(breakdown.monto_inversion)}
              </span>
            </div>
          </div>

          {/* Socios */}
          <div className="p-3 bg-white dark:bg-gray-800/50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Socios
                </span>
              </div>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(breakdown.monto_socios)}
              </span>
            </div>

            {/* Desglose por socio */}
            <div className="pl-6 space-y-2 border-l-2 border-purple-200 dark:border-purple-700/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Fran</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(breakdown.monto_fran)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Roberto</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(breakdown.monto_roberto)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Pablo</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(breakdown.monto_pablo)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialBreakdown;
