import { FC, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { botellasAbiertasApi, BotellaAbierta, EstadoBotella } from '../../api/botellas-abiertas.api';
import { Wine, Plus, XCircle, AlertTriangle, Clock, MapPin, TrendingUp, DollarSign, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { notify, handleApiError } from '../../utils/notifications';
import { AbrirBotellaModal } from '../../components/botellas/AbrirBotellaModal';
import { CerrarBotellaModal } from '../../components/botellas/CerrarBotellaModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const BotellasAbiertasPage: FC = () => {
  const queryClient = useQueryClient();
  const [isAbrirModalOpen, setIsAbrirModalOpen] = useState(false);
  const [isCerrarModalOpen, setIsCerrarModalOpen] = useState(false);
  const [selectedBotella, setSelectedBotella] = useState<BotellaAbierta | null>(null);
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('');
  const [mostrarAlertas, setMostrarAlertas] = useState(false);

  // Queries
  const { data: botellas = [], isLoading } = useQuery<BotellaAbierta[]>({
    queryKey: ['botellas-abiertas'],
    queryFn: botellasAbiertasApi.getAbiertas,
    refetchInterval: 30000, // Refresh cada 30 segundos
  });

  const { data: botellasConAlertas = [] } = useQuery<BotellaAbierta[]>({
    queryKey: ['botellas-alertas'],
    queryFn: botellasAbiertasApi.getConAlertas,
    refetchInterval: 30000,
  });

  const { data: ubicaciones = [] } = useQuery<string[]>({
    queryKey: ['ubicaciones'],
    queryFn: botellasAbiertasApi.getUbicaciones,
  });

  // Filtrar botellas
  const botellasFiltradas = mostrarAlertas
    ? botellasConAlertas
    : filtroUbicacion
    ? botellas.filter(b => b.ubicacion === filtroUbicacion)
    : botellas;

  // Estadísticas
  const stats = {
    total: botellas.length,
    casiVacias: botellas.filter(b => b.isCasiVacia).length,
    mas24h: botellas.filter(b => b.isAbiertaMas24Horas).length,
    copasDisponibles: botellas.reduce((sum, b) => sum + b.copasRestantes, 0),
    ingresosGenerados: botellas.reduce((sum, b) => sum + b.ingresosGenerados, 0),
    ingresosPotenciales: botellas.reduce((sum, b) => sum + b.ingresosPotencialesPerdidos, 0),
  };

  const handleCerrar = (botella: BotellaAbierta) => {
    setSelectedBotella(botella);
    setIsCerrarModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAbrirModalOpen(false);
    setIsCerrarModalOpen(false);
    setSelectedBotella(null);
  };

  // Renderizar alerta de botella
  const renderAlerta = (botella: BotellaAbierta) => {
    if (!botella.alerta) return null;

    const alertas = {
      VACÍA: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Vacía' },
      CASI_VACÍA: { icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-100', label: 'Casi vacía' },
      ABIERTA_MAS_24H: { icon: Clock, color: 'text-orange-600 bg-orange-100', label: '+24h abierta' },
    };

    const alerta = alertas[botella.alerta];
    if (!alerta) return null;

    const Icon = alerta.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${alerta.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {alerta.label}
      </span>
    );
  };

  // Renderizar barra de progreso de copas
  const renderCopasBarra = (botella: BotellaAbierta) => {
    const porcentaje = botella.porcentajeConsumido;
    let colorClase = 'bg-green-500';

    if (porcentaje >= 90) colorClase = 'bg-red-500';
    else if (porcentaje >= 70) colorClase = 'bg-yellow-500';

    return (
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{botella.copasServidas} servidas</span>
          <span>{botella.copasRestantes} restantes</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${colorClase}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          {porcentaje.toFixed(0)}% consumido
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Botellas Abiertas</h1>
          <p className="text-gray-600 mt-1">Control de botellas en barra</p>
        </div>
        <Button onClick={() => setIsAbrirModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Abrir Botella
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Botellas Abiertas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Wine className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Casi Vacías</p>
              <p className="text-2xl font-bold text-gray-900">{stats.casiVacias}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">+24h Abiertas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.mas24h}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Copas Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.copasDisponibles}</p>
            </div>
            <Package className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Generados</p>
              <p className="text-xl font-bold text-gray-900">€{stats.ingresosGenerados.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Potencial Restante</p>
              <p className="text-xl font-bold text-gray-900">€{stats.ingresosPotenciales.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={mostrarAlertas}
              onChange={(e) => setMostrarAlertas(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Solo alertas ({botellasConAlertas.length})</span>
          </label>

          <div className="flex-1" />

          <label className="text-sm font-medium text-gray-700">Ubicación:</label>
          <select
            value={filtroUbicacion}
            onChange={(e) => setFiltroUbicacion(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
            disabled={mostrarAlertas}
          >
            <option value="">Todas</option>
            {ubicaciones.map(ub => (
              <option key={ub} value={ub}>{ub.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de botellas */}
      {isLoading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : botellasFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Wine className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay botellas abiertas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {botellasFiltradas.map(botella => (
            <div
              key={botella.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden border-t-4 ${
                botella.alerta === 'VACÍA' ? 'border-red-500' :
                botella.alerta === 'CASI_VACÍA' ? 'border-yellow-500' :
                botella.alerta === 'ABIERTA_MAS_24H' ? 'border-orange-500' :
                'border-blue-500'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{botella.productoNombre}</h3>
                    <p className="text-sm text-gray-600">{botella.productoCategoria}</p>
                  </div>
                  {renderAlerta(botella)}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4 space-y-4">
                {/* Ubicación y tiempo */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{botella.ubicacion.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{botella.horasAbierta}h</span>
                  </div>
                </div>

                {/* Barra de copas */}
                {renderCopasBarra(botella)}

                {/* Información financiera */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Generado</p>
                    <p className="font-semibold text-green-700">€{botella.ingresosGenerados.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Potencial</p>
                    <p className="font-semibold text-blue-700">€{botella.ingresosPotencialesPerdidos.toFixed(2)}</p>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Abierta: {format(new Date(botella.fechaApertura), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                  {botella.abiertaPorNombre && <p>Por: {botella.abiertaPorNombre}</p>}
                  {botella.notas && <p className="italic">"{botella.notas}"</p>}
                </div>
              </div>

              {/* Footer - Acciones */}
              <div className="p-4 bg-gray-50 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCerrar(botella)}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cerrar Botella
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AbrirBotellaModal
        isOpen={isAbrirModalOpen}
        onClose={handleModalClose}
      />

      <CerrarBotellaModal
        isOpen={isCerrarModalOpen}
        onClose={handleModalClose}
        botella={selectedBotella}
      />
    </div>
  );
};
