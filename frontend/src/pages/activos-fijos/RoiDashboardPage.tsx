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
        <h1 className="text-3xl font-bold text-gray-900">💰 ¿Cuánto Estoy Ganando?</h1>
        <p className="text-gray-600">Resumen simple de tu inversión y ganancias del club</p>
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
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-blue-900">💵 Lo que Invertí</p>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(metricasActuales?.inversionTotal || 0)}
          </p>
          <p className="text-xs text-blue-700 mt-2">Dinero que puse para abrir</p>
        </div>

        {/* Ganancia por cada € */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-green-900">📈 Ganancia por cada €</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className={`text-2xl font-bold ${
            (metricasActuales?.roi || 0) >= 0 ? 'text-green-700' : 'text-red-600'
          }`}>
            {(metricasActuales?.roi || 0) >= 0 ? '+' : ''}{formatPercentage(metricasActuales?.roi || 0)}
          </p>
          <p className="text-xs text-green-700 mt-2">
            {(metricasActuales?.roi || 0) >= 0
              ? `Por cada €1 invertido, gané €${(1 + (metricasActuales?.roi || 0) / 100).toFixed(2)}`
              : 'Todavía no he recuperado la inversión'}
          </p>
        </div>

        {/* Ganancia al año */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-purple-900">📅 Si sigo así al año</p>
            <Percent className="w-5 h-5 text-purple-600" />
          </div>
          <p className={`text-2xl font-bold ${
            (metricasActuales?.roiAnualizado || 0) >= 0 ? 'text-purple-700' : 'text-red-600'
          }`}>
            {(metricasActuales?.roiAnualizado || 0) >= 0 ? '+' : ''}{formatPercentage(metricasActuales?.roiAnualizado || 0)}
          </p>
          <p className="text-xs text-purple-700 mt-2">Ganancia estimada en 12 meses</p>
        </div>

        {/* Ganancia mensual */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-orange-900">📊 Gano cada mes</p>
            <BarChart3 className="w-5 h-5 text-orange-600" />
          </div>
          <p className={`text-2xl font-bold ${
            (metricasActuales?.tasaRetornoMensual || 0) >= 0 ? 'text-orange-700' : 'text-red-600'
          }`}>
            {(metricasActuales?.tasaRetornoMensual || 0) >= 0 ? '+' : ''}{formatPercentage(metricasActuales?.tasaRetornoMensual || 0)}
          </p>
          <p className="text-xs text-orange-700 mt-2">Promedio mensual de ganancia</p>
        </div>
      </div>

      {/* Progreso de recuperación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Barra de progreso */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">🎯 ¿He recuperado mi dinero?</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${estadoRecuperacion.bgColor} ${estadoRecuperacion.color}`}>
              {estadoRecuperacion.label}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-semibold text-gray-700">Ya recuperé:</span>
                <span className="text-3xl font-bold text-blue-600">
                  {progreso.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 shadow-inner">
                <div
                  className={`h-8 rounded-full transition-all duration-500 flex items-center justify-center ${
                    progreso >= 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    progreso >= 50 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    'bg-gradient-to-r from-orange-400 to-orange-500'
                  }`}
                  style={{ width: `${Math.min(progreso, 100)}%` }}
                >
                  {progreso >= 10 && (
                    <span className="text-sm font-bold text-white drop-shadow">
                      {progreso.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              {progreso >= 100 && (
                <p className="text-sm text-green-600 font-semibold mt-2 text-center">
                  🎉 ¡Ya recuperaste toda tu inversión! Todo lo que ganes ahora es ganancia pura.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800 font-medium">✅ Ya recuperé</p>
                <p className="text-xl font-bold text-green-700 mt-1">
                  {formatCurrency(metricasActuales?.inversionRecuperada || 0)}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-800 font-medium">⏳ Me falta recuperar</p>
                <p className="text-xl font-bold text-orange-700 mt-1">
                  {formatCurrency((metricasActuales?.inversionTotal || 0) - (metricasActuales?.inversionRecuperada || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estimación de recuperación */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">⏰ ¿Cuándo recuperaré todo?</h3>
            <Target className="w-6 h-6 text-purple-500" />
          </div>

          <div className="space-y-4">
            {metricasActuales?.inversionRecuperadaCompletamente ? (
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h4 className="text-2xl font-bold text-green-900 mb-2">
                  🎉 ¡Ya lo conseguiste!
                </h4>
                <p className="text-green-800 font-medium">
                  Ya recuperaste todo el dinero que invertiste. Todo lo que ganes de ahora en adelante es ganancia limpia.
                </p>
              </div>
            ) : diasRestantes !== null ? (
              <>
                <div className="text-center py-6 bg-blue-50 rounded-lg">
                  <p className="text-base text-blue-800 mb-3 font-medium">Si sigo trabajando así, recuperaré todo en:</p>
                  <div className="flex justify-center items-baseline gap-2 mb-3">
                    <p className="text-6xl font-bold text-blue-600">
                      {Math.floor(diasRestantes / 30)}
                    </p>
                    <span className="text-2xl text-blue-600 font-semibold">meses</span>
                  </div>
                  <p className="text-sm text-blue-600 font-medium">
                    (Aproximadamente {diasRestantes} días más)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-600 font-medium">📅 Días desde que abrí</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {metricasActuales?.diasDesdeApertura || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ({Math.floor((metricasActuales?.diasDesdeApertura || 0) / 30)} meses)
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-purple-800 font-medium">🎯 Fecha estimada</p>
                    <p className="text-lg font-bold text-purple-900 mt-1">
                      {diasRestantes > 0 ? new Date(Date.now() + diasRestantes * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-orange-900 mb-2">Aún no hay suficientes datos</h4>
                <p className="text-orange-800">
                  Sigue trabajando y registrando tus ventas y gastos. En poco tiempo podré calcular cuándo recuperarás tu inversión.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desglose financiero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingresos */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-green-900">💵 Total que Ingresé</h3>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-4xl font-bold text-green-700 mb-2">
            {formatCurrency(metricasActuales?.ingresosTotales || 0)}
          </p>
          <p className="text-sm text-green-800 font-medium">
            Todo el dinero que entró desde que abrí
          </p>
        </div>

        {/* Gastos */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-lg p-6 border-2 border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-red-900">💸 Total que Gasté</h3>
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-4xl font-bold text-red-700 mb-2">
            {formatCurrency(metricasActuales?.gastosTotales || 0)}
          </p>
          <p className="text-sm text-red-800 font-medium">
            Todo lo que pagué en compras, sueldos, etc.
          </p>
        </div>

        {/* Beneficio Neto */}
        <div className={`rounded-lg shadow-lg p-6 border-2 ${
          (metricasActuales?.beneficioNetoAcumulado || 0) >= 0
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
            : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${
              (metricasActuales?.beneficioNetoAcumulado || 0) >= 0 ? 'text-blue-900' : 'text-orange-900'
            }`}>
              {(metricasActuales?.beneficioNetoAcumulado || 0) >= 0 ? '✅ ' : '⚠️ '}
              Lo que me Queda
            </h3>
            <DollarSign className={`w-6 h-6 ${
              (metricasActuales?.beneficioNetoAcumulado || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`} />
          </div>
          <p className={`text-4xl font-bold mb-2 ${
            (metricasActuales?.beneficioNetoAcumulado || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
          }`}>
            {formatCurrency(metricasActuales?.beneficioNetoAcumulado || 0)}
          </p>
          <p className={`text-sm font-medium ${
            (metricasActuales?.beneficioNetoAcumulado || 0) >= 0 ? 'text-blue-800' : 'text-orange-800'
          }`}>
            {(metricasActuales?.beneficioNetoAcumulado || 0) >= 0
              ? 'Ganancia neta después de pagar todo'
              : 'Necesito aumentar las ventas o reducir gastos'}
          </p>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 shadow-md">
        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
          💡 ¿Cómo entender estos números?
        </h3>
        <div className="space-y-3 text-sm text-blue-900">
          <div className="bg-white/60 p-3 rounded-lg">
            <p className="font-bold mb-1">📊 "Ganancia por cada €"</p>
            <p>
              Esto te dice cuánto ganaste por cada euro que invertiste. Por ejemplo:
              <br/>• <strong>+50%</strong> = Por cada €1 invertido, ahora tengo €1.50 (gané €0.50)
              <br/>• <strong>-20%</strong> = Por cada €1 invertido, ahora tengo €0.80 (perdí €0.20)
            </p>
          </div>

          <div className="bg-white/60 p-3 rounded-lg">
            <p className="font-bold mb-1">📅 "Si sigo así al año"</p>
            <p>
              Si sigues trabajando como hasta ahora, esto es lo que ganarás en 12 meses.
              Te ayuda a saber si el negocio va bien o necesitas mejorar.
            </p>
          </div>

          <div className="bg-white/60 p-3 rounded-lg">
            <p className="font-bold mb-1">📈 "Gano cada mes"</p>
            <p>
              El promedio mensual de ganancia sobre tu inversión. Si es positivo, vas por buen camino.
            </p>
          </div>

          <div className="bg-blue-100 p-3 rounded-lg border border-blue-200 mt-4">
            <p className="font-bold text-blue-900">
              🔄 Los números se actualizan automáticamente cada minuto con los últimos datos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
