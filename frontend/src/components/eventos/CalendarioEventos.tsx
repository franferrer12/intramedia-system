import { FC, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Evento } from '../../types';

interface CalendarioEventosProps {
  eventos: Evento[];
  onEventClick: (evento: Evento) => void;
}

export const CalendarioEventos: FC<CalendarioEventosProps> = ({ eventos, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Funciones de navegación
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);

    // Día de la semana del primer día (0 = domingo, 1 = lunes, ...)
    const firstDayOfWeek = firstDay.getDay();
    // Día de la semana del último día
    const lastDayOfWeek = lastDay.getDay();

    const days: Array<{ date: Date; isCurrentMonth: boolean; eventos: Evento[] }> = [];

    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        eventos: getEventosForDate(date),
      });
    }

    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        eventos: getEventosForDate(date),
      });
    }

    // Días del mes siguiente
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        eventos: getEventosForDate(date),
      });
    }

    return days;
  }, [currentDate, eventos]);

  // Obtener eventos para una fecha específica
  const getEventosForDate = (date: Date): Evento[] => {
    const dateStr = date.toISOString().split('T')[0];
    return eventos.filter(evento => evento.fecha === dateStr);
  };

  // Verificar si es hoy
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Formatear nombre del mes
  const monthName = currentDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  // Color por estado del evento
  const getEventoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PLANIFICADO: 'bg-blue-500',
      CONFIRMADO: 'bg-green-500',
      EN_CURSO: 'bg-yellow-500',
      FINALIZADO: 'bg-gray-500',
      CANCELADO: 'bg-red-500',
    };
    return colors[estado] || 'bg-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 capitalize">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del calendario */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          const hasEventos = day.eventos.length > 0;
          const isTodayDate = isToday(day.date);

          return (
            <div
              key={index}
              className={`
                min-h-[100px] p-2 border rounded-lg transition-all
                ${!day.isCurrentMonth ? 'bg-gray-50 opacity-50' : 'bg-white'}
                ${isTodayDate ? 'ring-2 ring-blue-500' : 'border-gray-200'}
                ${hasEventos ? 'cursor-pointer hover:shadow-md' : ''}
              `}
            >
              {/* Número del día */}
              <div
                className={`
                  text-sm font-medium mb-1
                  ${isTodayDate ? 'text-blue-600 font-bold' : 'text-gray-700'}
                `}
              >
                {day.date.getDate()}
              </div>

              {/* Eventos del día */}
              {day.eventos.length > 0 && (
                <div className="space-y-1">
                  {day.eventos.slice(0, 2).map((evento) => (
                    <div
                      key={evento.id}
                      onClick={() => onEventClick(evento)}
                      className={`
                        px-2 py-1 rounded text-xs text-white truncate
                        ${getEventoColor(evento.estado)}
                        hover:opacity-80 transition-opacity
                      `}
                      title={evento.nombre}
                    >
                      {evento.nombre}
                    </div>
                  ))}
                  {day.eventos.length > 2 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{day.eventos.length - 2} más
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        <span className="font-medium text-gray-700">Estados:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Planificado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Confirmado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>En Curso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 rounded"></div>
          <span>Finalizado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Cancelado</span>
        </div>
      </div>
    </div>
  );
};
