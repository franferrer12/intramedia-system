import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Percent,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import roiApi, { RoiMetrics } from '../../api/roi.api';
import { ESTADOS_RECUPERACION } from '../../constants/categorias-activo';

export default function RoiDashboardPage() {
  const [mostrarPeriodo, setMostrarPeriodo] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Query para métricas generales
  const { data: metricas, isLoading, error } = useQuery({
    queryKey: ['roi-metrics'],
    queryFn: roiApi.getMetricas,
    refetchInterval: 60000 // Refetch cada minuto
  });

  // Query para métricas de período específico
  const { data: metricasPeriodo } = useQuery({
    queryKey: ['roi-metrics-periodo', fechaInicio, fechaFin],
    queryFn: () => roiApi.getMetricasPeriodo(fechaInicio, fechaFin),
    enabled: mostrarPeriodo && !!fechaInicio && !!fechaFin
  });

  const metricasActuales = mostrarPeriodo && metricasPeriodo ? metricasPeriodo : metricas;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getEstadoRecuperacion = (estado: string) => {
    const estadoConfig = ESTADOS_RECUPERACION[estado as keyof typeof ESTADOS_RECUPERACION];
    return estadoConfig || ESTADOS_RECUPERACION.NO_INICIADA;
  };

  const calcularDiasRestantes = (metricas: RoiMetrics | undefined) => {
    if (!metricas || metricas.inversionRecuperadaCompletamente) return 0;
    if (!metricas.diasEstimadosRecuperacion) return null;
    return Math.max(0, metricas.diasEstimadosRecuperacion);
  };

  const calcularProgreso = (metricas: RoiMetrics | undefined) => {
    if (!metricas) return 0;
    return Math.min(100, Math.max(0, metricas.porcentajeRecuperado));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error al cargar métricas</h3>
              <p className="text-red-700 mt-1">
                No se pudieron cargar las métricas de ROI. Por favor, intenta nuevamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progreso = calcularProgreso(metricasActuales);
  const diasRestantes = calcularDiasRestantes(metricasActuales);
  const estadoRecuperacion = getEstadoRecuperacion(metricasActuales?.estadoRecuperacion || 'NO_INICIADA');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard ROI</h1>
        <p className="text-gray-600">Return on Investment - Retorno de la Inversión</p>
      </div>

      {/* Filtro de período */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarPeriodo}
              onChange={(e) => {
                setMostrarPeriodo(e.target.checked);
                if (!e.target.checked) {
                  setFechaInicio('');
                  setFechaFin('');
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Ver métricas de un período específico
            </span>
          </label>

          {mostrarPeriodo && (
            <div className="flex items-center gap-2 ml-4">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Fecha inicio"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Fecha fin"
              />
            </div>
          )}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Inversión Total */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Inversión Total</p>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(metricasActuales?.inversionTotal || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Capital invertido inicial</p>
        </div>

        {/* ROI Actual */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">ROI Actual</p>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className={`text-2xl font-bold ${
            (metricasActuales?.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercentage(metricasActuales?.roi || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Return on Investment</p>
        </div>

        {/* ROI Anualizado */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">ROI Anualizado</p>
            <Percent className="w-5 h-5 text-purple-500" />
          </div>
          <p className={`text-2xl font-bold ${
            (metricasActuales?.roiAnualizado || 0) >= 0 ? 'text-purple-600' : 'text-red-600'
          }`}>
            {formatPercentage(metricasActuales?.roiAnualizado || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Tasa anual de retorno</p>
        </div>

        {/* Tasa Mensual */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Retorno Mensual</p>
            <BarChart3 className="w-5 h-5 text-orange-500" />
          </div>
          <p className={`text-2xl font-bold ${
            (metricasActuales?.tasaRetornoMensual || 0) >= 0 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {formatPercentage(metricasActuales?.tasaRetornoMensual || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Tasa de retorno mensual</p>
        </div>
      </div>

      {/* Progreso de recuperación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Barra de progreso */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recuperación de Inversión</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${estadoRecuperacion.bgColor} ${estadoRecuperacion.color}`}>
              {estadoRecuperacion.label}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progreso</span>
                <span className="text-2xl font-bold text-blue-600">
                  {progreso.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className={`h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                    progreso >= 100 ? 'bg-green-500' : progreso >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(progreso, 100)}%` }}
                >
                  {progreso >= 10 && (
                    <span className="text-xs font-semibold text-white">
                      {progreso.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Inversión Recuperada</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(metricasActuales?.inversionRecuperada || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendiente de Recuperar</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency((metricasActuales?.inversionTotal || 0) - (metricasActuales?.inversionRecuperada || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estimación de recuperación */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Estimación de Recuperación</h3>
            <Target className="w-6 h-6 text-blue-500" />
          </div>

          <div className="space-y-4">
            {metricasActuales?.inversionRecuperadaCompletamente ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h4 className="text-xl font-bold text-green-900 mb-2">
                  ¡Inversión Recuperada!
                </h4>
                <p className="text-green-700">
                  Has recuperado completamente la inversión inicial y estás generando beneficios netos.
                </p>
              </div>
            ) : diasRestantes !== null ? (
              <>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-2">Días estimados para recuperación completa</p>
                  <p className="text-5xl font-bold text-blue-600 mb-2">
                    {diasRestantes}
                  </p>
                  <p className="text-sm text-gray-500">
                    ({Math.floor(diasRestantes / 30)} meses, {diasRestantes % 30} días)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Días desde apertura</p>
                    <p className="text-lg font-bold text-gray-900">
                      {metricasActuales?.diasDesdeApertura || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha estimada</p>
                    <p className="text-lg font-bold text-gray-900">
                      {diasRestantes > 0 ? new Date(Date.now() + diasRestantes * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES') : '-'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                <p className="text-orange-800">
                  No hay suficientes datos para estimar la recuperación de la inversión.
                  Continúa operando para generar datos históricos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desglose financiero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingresos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ingresos Totales</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(metricasActuales?.ingresosTotales || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Ingresos acumulados desde el inicio
          </p>
        </div>

        {/* Gastos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gastos Totales</h3>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            {formatCurrency(metricasActuales?.gastosTotales || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Gastos acumulados desde el inicio
          </p>
        </div>

        {/* Beneficio Neto */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Beneficio Neto</h3>
            <DollarSign className={`w-5 h-5 ${
              (metricasActuales?.beneficioNetoAcumulado || 0) >= 0 ? 'text-green-500' : 'text-red-500'
            }`} />
          </div>
          <p className={`text-3xl font-bold ${
            (metricasActuales?.beneficioNetoAcumulado || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(metricasActuales?.beneficioNetoAcumulado || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Ingresos - Gastos
          </p>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          ¿Cómo se calcula el ROI?
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>ROI = (Beneficio Neto / Inversión Total) × 100</strong>
          </p>
          <p>
            El ROI mide la rentabilidad de tu inversión. Un ROI del 50% significa que has recuperado
            tu inversión inicial más un 50% adicional en beneficios.
          </p>
          <p>
            <strong>ROI Anualizado:</strong> Ajusta el ROI según el tiempo transcurrido, permitiendo
            comparar rentabilidades en diferentes períodos.
          </p>
          <p>
            <strong>Nota:</strong> Las métricas se actualizan automáticamente cada minuto para reflejar
            los datos más recientes.
          </p>
        </div>
      </div>
    </div>
  );
}
