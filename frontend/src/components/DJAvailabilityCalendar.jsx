import { useState, useEffect } from 'react';
import { availabilityAPI } from '../services/api';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Music
} from 'lucide-react';
import toast from 'react-hot-toast';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Calendario de Disponibilidad de DJ
 * Muestra disponibilidad y eventos de un DJ específico o de toda la agencia
 * Integrado con endpoint /api/availability/calendar-summary
 */
const DJAvailabilityCalendar = ({
  djId,
  agencyId,
  onDateClick,
  onEventClick,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCalendarData();
  }, [djId, agencyId, currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const response = await availabilityAPI.getCalendarSummary(
        year,
        month,
        djId,
        agencyId
      );

      setCalendarData(response.data.data);
    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError('Error al cargar el calendario');
      toast.error('Error al cargar datos del calendario');
    } finally {
      setLoading(false);
    }
  };

  const navegarMes = (direccion) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direccion);
    setCurrentDate(newDate);
  };

  const irHoy = () => {
    setCurrentDate(new Date());
  };

  const esHoy = (dateStr) => {
    const hoy = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return day === hoy.getDate() &&
           month === hoy.getMonth() + 1 &&
           year === hoy.getFullYear();
  };

  // Determinar color del día basado en disponibilidad
  const getDayBackgroundClass = (day) => {
    if (!day) return 'bg-white dark:bg-gray-800';

    const disponible = day.disponible_count || 0;
    const reservado = day.reservado_count || 0;
    const noDisponible = day.no_disponible_count || 0;

    // Si hay eventos reservados
    if (reservado > 0) {
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
    }

    // Si está marcado como no disponible
    if (noDisponible > 0 && disponible === 0) {
      return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
    }

    // Si está disponible
    if (disponible > 0) {
      return 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700';
    }

    // Sin información
    return 'bg-white dark:bg-gray-800';
  };

  // Renderizar indicador de disponibilidad
  const renderDisponibilityIndicator = (day) => {
    if (!day) return null;

    const disponible = day.disponible_count || 0;
    const reservado = day.reservado_count || 0;
    const noDisponible = day.no_disponible_count || 0;

    return (
      <div className="flex items-center justify-center gap-1 mt-1">
        {disponible > 0 && (
          <div className="flex items-center gap-0.5">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              {disponible}
            </span>
          </div>
        )}
        {reservado > 0 && (
          <div className="flex items-center gap-0.5">
            <Clock className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
              {reservado}
            </span>
          </div>
        )}
        {noDisponible > 0 && (
          <div className="flex items-center gap-0.5">
            <XCircle className="w-3 h-3 text-red-600" />
            <span className="text-xs font-medium text-red-700 dark:text-red-400">
              {noDisponible}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Renderizar eventos del día
  const renderDayEvents = (day) => {
    if (!day || !day.events || day.events.length === 0) return null;

    const eventsToShow = day.events.slice(0, 2);
    const remainingCount = day.events.length - eventsToShow.length;

    return (
      <div className="mt-1 space-y-1">
        {eventsToShow.map((event, idx) => (
          <div
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick && onEventClick(event);
            }}
            className={`
              text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity
              ${event.estado === 'reservado' ? 'bg-blue-500 text-white' :
                event.estado === 'disponible' ? 'bg-green-500 text-white' :
                'bg-gray-500 text-white'}
            `}
          >
            <div className="flex items-center gap-1 truncate">
              <Music className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">
                {event.hora_inicio ? `${event.hora_inicio}` : ''}
                {event.evento_nombre || 'Disponible'}
              </span>
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium px-1">
            +{remainingCount} más
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`card dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !calendarData) {
    return (
      <div className={`card dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">{error || 'No se pudo cargar el calendario'}</p>
          <button
            onClick={loadCalendarData}
            className="mt-4 btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { days, statistics, calendar_type } = calendarData;

  return (
    <div className={`card dark:bg-gray-800 dark:border-gray-700 p-0 overflow-hidden ${className}`}>
      {/* Header con navegación */}
      <div className="p-4 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {MESES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {calendar_type === 'individual' ? 'Calendario DJ Individual' : 'Calendario de Agencia'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navegarMes(-1)}
              className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>

            <button
              onClick={irHoy}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
            >
              Hoy
            </button>

            <button
              onClick={() => navegarMes(1)}
              className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
          </div>
        </div>

        {/* Estadísticas del mes */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Total Eventos</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {statistics.total_events || 0}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Reservados</span>
              </div>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {statistics.reservado_count || 0}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Disponibles</span>
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {statistics.disponible_count || 0}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">No Disponible</span>
              </div>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {statistics.no_disponible_count || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Header de días de la semana */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        {DIAS_SEMANA.map(dia => (
          <div key={dia} className="p-2 md:p-3 text-center font-semibold text-xs md:text-sm text-gray-700 dark:text-gray-300">
            {dia}
          </div>
        ))}
      </div>

      {/* Grid del calendario */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {days && days.map((dayData, index) => {
          const fecha = dayData.fecha;
          const isToday = esHoy(fecha);

          return (
            <div
              key={index}
              onClick={() => onDateClick && onDateClick(dayData)}
              className={`
                min-h-[100px] md:min-h-[130px] p-2 border-b border-r border-gray-200 dark:border-gray-700
                ${getDayBackgroundClass(dayData)}
                ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}
                hover:bg-opacity-70 dark:hover:bg-opacity-30 transition-all cursor-pointer
              `}
            >
              {/* Número del día */}
              <div className={`
                text-sm font-semibold mb-1
                ${isToday ? 'bg-primary-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-gray-900 dark:text-white'}
              `}>
                {new Date(fecha).getDate()}
              </div>

              {/* Indicadores de disponibilidad */}
              {renderDisponibilityIndicator(dayData)}

              {/* Eventos del día */}
              {renderDayEvents(dayData)}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-700 dark:text-gray-300">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-gray-700 dark:text-gray-300">Reservado</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-gray-700 dark:text-gray-300">No disponible</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DJAvailabilityCalendar;
