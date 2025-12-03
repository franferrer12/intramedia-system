import { FC, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertasStockApi, AlertaStock } from '../../api/alertas-stock.api';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { notify, handleApiError } from '../../utils/notifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const NIVELES_ALERTA = [
  { value: '', label: 'Todos' },
  { value: 'CRITICO', label: 'Crítico', icon: AlertTriangle, color: 'red' },
  { value: 'ALTO', label: 'Alto', icon: AlertCircle, color: 'orange' },
  { value: 'MEDIO', label: 'Medio', icon: Info, color: 'yellow' },
  { value: 'BAJO', label: 'Bajo', icon: CheckCircle, color: 'blue' },
];

export const AlertasPage: FC = () => {
  const queryClient = useQueryClient();
  const [filtroNivel, setFiltroNivel] = useState<string>('');
  const [mostrarLeidas, setMostrarLeidas] = useState<boolean>(false);

  const { data: alertas = [], isLoading } = useQuery<AlertaStock[]>({
    queryKey: ['alertas-stock'],
    queryFn: alertasStockApi.getAlertasActivas,
    staleTime: 3 * 60 * 1000, // Los datos se consideran frescos por 3 minutos
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
    refetchOnWindowFocus: false, // No refrescar al cambiar de ventana
  });

  const marcarLeidaMutation = useMutation({
    mutationFn: alertasStockApi.marcarComoLeida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-stock'] });
      notify.success('Alerta marcada como leída');
    },
    onError: (error) => {
      handleApiError(error, 'Error al marcar alerta como leída');
    },
  });

  const marcarTodasLeidasMutation = useMutation({
    mutationFn: alertasStockApi.marcarTodasComoLeidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-stock'] });
      notify.success('Todas las alertas marcadas como leídas');
    },
    onError: (error) => {
      handleApiError(error, 'Error al marcar alertas');
    },
  });

  const desactivarMutation = useMutation({
    mutationFn: alertasStockApi.desactivarAlerta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-stock'] });
      notify.success('Alerta desactivada correctamente');
    },
    onError: (error) => {
      handleApiError(error, 'Error al desactivar alerta');
    },
  });

  const forzarVerificacionMutation = useMutation({
    mutationFn: alertasStockApi.forzarVerificacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-stock'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      notify.success('Verificación de stock completada');
    },
    onError: (error) => {
      handleApiError(error, 'Error al verificar stock');
    },
  });

  const alertasFiltradas = alertas.filter((alerta) => {
    const matchNivel = !filtroNivel || alerta.nivel === filtroNivel;
    const matchLeida = mostrarLeidas || !alerta.leida;
    return matchNivel && matchLeida;
  });

  const getNivelConfig = (nivel: string) => {
    return NIVELES_ALERTA.find((n) => n.value === nivel) || NIVELES_ALERTA[0];
  };

  const getNivelStyles = (nivel: string) => {
    switch (nivel) {
      case 'CRITICO':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'ALTO':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'MEDIO':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'BAJO':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const alertasNoLeidas = alertas.filter((a) => !a.leida).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas de Stock</h1>
          <p className="text-gray-600 mt-1">
            {alertasNoLeidas > 0 ? (
              <span className="text-red-600 font-medium">
                {alertasNoLeidas} alerta{alertasNoLeidas !== 1 ? 's' : ''} sin leer
              </span>
            ) : (
              'No hay alertas pendientes'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {alertasNoLeidas > 0 && (
            <Button
              variant="outline"
              onClick={() => marcarTodasLeidasMutation.mutate()}
              disabled={marcarTodasLeidasMutation.isPending}
            >
              <Eye className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => forzarVerificacionMutation.mutate()}
            disabled={forzarVerificacionMutation.isPending}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                forzarVerificacionMutation.isPending ? 'animate-spin' : ''
              }`}
            />
            Verificar Stock Ahora
          </Button>
        </div>
      </div>

      {/* Resumen por nivel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {NIVELES_ALERTA.slice(1).map((nivel) => {
          const Icon = nivel.icon || AlertCircle;
          const count = alertas.filter((a) => a.nivel === nivel.value && !a.leida).length;
          const bgColor =
            nivel.value === 'CRITICO'
              ? 'bg-red-500'
              : nivel.value === 'ALTO'
              ? 'bg-orange-500'
              : nivel.value === 'MEDIO'
              ? 'bg-yellow-500'
              : 'bg-blue-500';

          return (
            <div key={nivel.value} className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-300">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${bgColor}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">{nivel.label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Alerta:</label>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {NIVELES_ALERTA.map((nivel) => (
                <option key={nivel.value} value={nivel.value}>
                  {nivel.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarLeidas}
                onChange={(e) => setMostrarLeidas(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Mostrar alertas leídas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Lista de alertas */}
      {isLoading ? (
        <div className="text-center py-12">Cargando alertas...</div>
      ) : alertasFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-900">¡Todo en orden!</p>
          <p className="text-gray-600 mt-2">No hay alertas de stock en este momento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alertasFiltradas.map((alerta) => {
            const nivelConfig = getNivelConfig(alerta.nivel);
            const NivelIcon = nivelConfig.icon || Info;

            return (
              <div
                key={alerta.id}
                className={`rounded-lg border-2 p-4 ${getNivelStyles(alerta.nivel)} ${
                  alerta.leida ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <NivelIcon className="h-6 w-6 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            alerta.nivel === 'CRITICO'
                              ? 'bg-red-200 text-red-900'
                              : alerta.nivel === 'ALTO'
                              ? 'bg-orange-200 text-orange-900'
                              : alerta.nivel === 'MEDIO'
                              ? 'bg-yellow-200 text-yellow-900'
                              : 'bg-blue-200 text-blue-900'
                          }`}
                        >
                          {alerta.nivel}
                        </span>
                        <span className="text-xs text-gray-600">
                          {format(new Date(alerta.fechaAlerta), "dd MMM yyyy 'a las' HH:mm", {
                            locale: es,
                          })}
                        </span>
                        {alerta.leida && (
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <Eye className="h-3 w-3 mr-1" />
                            Leída
                          </span>
                        )}
                      </div>
                      <p className="font-medium mt-2">{alerta.mensaje}</p>
                      <div className="mt-2 text-sm">
                        <p className="font-medium">Producto: {alerta.producto.nombre}</p>
                        <p>Código: {alerta.producto.codigo}</p>
                        <p>
                          Stock actual: {alerta.producto.stockActual} {alerta.producto.unidadMedida} /
                          Mínimo: {alerta.producto.stockMinimo} {alerta.producto.unidadMedida}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {!alerta.leida && (
                      <button
                        onClick={() => marcarLeidaMutation.mutate(alerta.id)}
                        className="p-2 hover:bg-white/50 rounded transition-colors"
                        title="Marcar como leída"
                      >
                        <EyeOff className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => desactivarMutation.mutate(alerta.id)}
                      className="p-2 hover:bg-white/50 rounded transition-colors"
                      title="Desactivar alerta"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
