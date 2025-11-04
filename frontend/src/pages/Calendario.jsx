import { useState, useEffect, useMemo } from 'react';
import { eventosAPI } from '../services/api';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Music,
  MapPin,
  DollarSign,
  Clock,
  Filter,
  Download,
  Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CalendarDragDrop } from '../utils/dragAndDrop';
import CalendarViewSwitcher from '../components/CalendarViewSwitcher';
import { Breadcrumbs, Select, Skeleton } from '../components';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Componente de Evento en el Calendario
const EventoCalendario = ({ evento, onClick, onDragStart, onDragEnd }) => {
  const getColorByCategoria = (categoria) => {
    const colores = {
      'Boda': 'bg-pink-500',
      'Cumpleaños': 'bg-purple-500',
      'Discoteca': 'bg-blue-500',
      'Corporativo': 'bg-green-500',
      'Festival': 'bg-orange-500',
      'Privado': 'bg-indigo-500',
      'default': 'bg-gray-500'
    };
    return colores[categoria] || colores.default;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, evento)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(evento)}
      className={`
        ${getColorByCategoria(evento.categoria)}
        text-white p-1.5 md:p-2 rounded-md cursor-move
        hover:shadow-lg hover:scale-105 transform transition-all duration-200
        text-xs md:text-sm mb-1 relative overflow-hidden
        group
      `}
    >
      {/* Efecto de brillo al hover */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>

      <div className="relative z-10">
        <div className="font-semibold truncate">{evento.evento}</div>
        <div className="flex items-center gap-1 text-xs opacity-90 mt-0.5">
          <Music className="w-3 h-3" />
          <span className="truncate">{evento.dj_nombre || 'Sin DJ'}</span>
        </div>
      </div>

      {/* Badge de cobrado/pagado */}
      {evento.cobrado_cliente && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-green-300 rounded-full"></div>
      )}
    </div>
  );
};

// Modal de Detalle de Evento
const EventoDetailModal = ({ evento, onClose }) => {
  if (!evento) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header con color de categoría */}
        <div className={`
          ${evento.categoria === 'Boda' ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
            evento.categoria === 'Discoteca' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
            evento.categoria === 'Cumpleaños' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
            'bg-gradient-to-r from-gray-500 to-gray-600'}
          text-white p-6 rounded-t-lg
        `}>
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-block px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm mb-2">
                {evento.categoria || 'Sin categoría'}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{evento.evento}</h2>
              <div className="flex items-center gap-2 mt-2 text-white text-opacity-90">
                <CalendarIcon className="w-5 h-5" />
                <span className="text-lg">{evento.fecha}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* DJ y Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-2">
                <Music className="w-5 h-5" />
                <span className="font-semibold">DJ</span>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {evento.dj_nombre || 'No asignado'}
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">Cliente</span>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {evento.cliente_nombre || evento.cliente || 'No especificado'}
              </p>
            </div>
          </div>

          {/* Ubicación */}
          {evento.ciudad_lugar && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">Ubicación</span>
              </div>
              <p className="text-gray-900 dark:text-white">{evento.ciudad_lugar}</p>
            </div>
          )}

          {/* Información Financiera */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-3">
              <DollarSign className="w-5 h-5" />
              <span className="font-semibold">Información Financiera</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Caché Total</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  €{parseFloat(evento.cache_total || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Parte DJ (70%)</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  €{parseFloat(evento.parte_dj || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Parte Agencia (30%)</p>
                <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                  €{parseFloat(evento.parte_agencia || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Estados */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`
              p-3 rounded-lg border-2
              ${evento.cobrado_cliente
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-red-50 border-red-300 text-red-700'}
            `}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${evento.cobrado_cliente ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-semibold">
                  {evento.cobrado_cliente ? 'Cobrado ✓' : 'Pendiente de cobro'}
                </span>
              </div>
            </div>

            <div className={`
              p-3 rounded-lg border-2
              ${evento.pagado_dj
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-orange-50 border-orange-300 text-orange-700'}
            `}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${evento.pagado_dj ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                <span className="font-semibold">
                  {evento.pagado_dj ? 'DJ Pagado ✓' : 'Pendiente pago DJ'}
                </span>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {evento.observaciones && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Observaciones</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{evento.observaciones}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente Principal del Calendario
const Calendario = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterDJ, setFilterDJ] = useState('');
  const [dragOverCell, setDragOverCell] = useState(null);
  const [view, setView] = useState('month'); // 'month', 'week', 'day'

  // Inicializar drag & drop
  const dragDrop = useMemo(() => new CalendarDragDrop(async (evento, nuevaFecha) => {
    try {
      await eventosAPI.update(evento.id, { fecha: nuevaFecha });
      toast.success(`Evento "${evento.evento}" movido a ${nuevaFecha}`);
      loadEventos();
    } catch (error) {
      console.error('Error al mover evento:', error);
      toast.error('Error al mover el evento');
    } finally {
      setDragOverCell(null);
    }
  }), []);

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const res = await eventosAPI.getAll();
      setEventos(res.data.data || []);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  // Obtener días del mes
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Días del mes anterior para llenar la primera semana
    const prevMonthDays = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    const prevMonth = new Date(year, month, 0);
    for (let i = prevMonthDays; i > 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i + 1),
        isCurrentMonth: false
      });
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  // Agrupar eventos por día
  const eventosPorDia = useMemo(() => {
    const grupos = {};

    eventos
      .filter(evento => {
        // Filtros
        if (filterCategoria && evento.categoria !== filterCategoria) return false;
        if (filterDJ && evento.dj_nombre !== filterDJ) return false;
        return true;
      })
      .forEach(evento => {
        const fechaEvento = evento.fecha; // formato: YYYY-MM-DD
        if (!grupos[fechaEvento]) {
          grupos[fechaEvento] = [];
        }
        grupos[fechaEvento].push(evento);
      });

    return grupos;
  }, [eventos, filterCategoria, filterDJ]);

  const navegarMes = (direccion) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direccion);
    setCurrentDate(newDate);
  };

  const irHoy = () => {
    setCurrentDate(new Date());
  };

  const formatearFecha = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const esHoy = (date) => {
    const hoy = new Date();
    return date.getDate() === hoy.getDate() &&
           date.getMonth() === hoy.getMonth() &&
           date.getFullYear() === hoy.getFullYear();
  };

  // Lista única de DJs para filtro
  const djsUnicos = [...new Set(eventos.map(e => e.dj_nombre).filter(Boolean))];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Inicio', path: '/', icon: Home },
          { label: 'Calendario', path: '/calendario', icon: CalendarIcon }
        ]}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Calendario de Eventos</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Vista mensual de todos tus eventos
          </p>
        </div>

        {/* Controles de navegación y vista */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Selector de vista */}
          <CalendarViewSwitcher
            currentView={view}
            onViewChange={setView}
          />

          {/* Navegación */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navegarMes(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>

            <button
              onClick={irHoy}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Hoy
            </button>

            <button
              onClick={() => navegarMes(1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Título del mes */}
      <div className="card bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-2 border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {MESES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>

          {/* Filtros */}
          <div className="hidden md:flex items-center gap-3">
            <Select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="text-sm"
            >
              <option value="">Todas las categorías</option>
              <option value="Boda">Boda</option>
              <option value="Cumpleaños">Cumpleaños</option>
              <option value="Discoteca">Discoteca</option>
              <option value="Corporativo">Corporativo</option>
              <option value="Festival">Festival</option>
              <option value="Privado">Privado</option>
            </Select>

            <Select
              value={filterDJ}
              onChange={(e) => setFilterDJ(e.target.value)}
              className="text-sm"
            >
              <option value="">Todos los DJs</option>
              {djsUnicos.map(dj => (
                <option key={dj} value={dj}>{dj}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Filtros móvil */}
        <div className="md:hidden mt-4 space-y-2">
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="input text-sm w-full"
          >
            <option value="">Todas las categorías</option>
            <option value="Boda">Boda</option>
            <option value="Cumpleaños">Cumpleaños</option>
            <option value="Discoteca">Discoteca</option>
            <option value="Corporativo">Corporativo</option>
            <option value="Festival">Festival</option>
            <option value="Privado">Privado</option>
          </select>

          <select
            value={filterDJ}
            onChange={(e) => setFilterDJ(e.target.value)}
            className="input text-sm w-full"
          >
            <option value="">Todos los DJs</option>
            {djsUnicos.map(dj => (
              <option key={dj} value={dj}>{dj}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      ) : (
        <div className="card dark:bg-gray-800 dark:border-gray-700 p-0 overflow-hidden">
          {/* Header de días de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-gray-700/50">
            {DIAS_SEMANA.map(dia => (
              <div key={dia} className="p-2 md:p-3 text-center font-semibold text-xs md:text-sm text-gray-700 dark:text-gray-300">
                {dia}
              </div>
            ))}
          </div>

          {/* Grid del calendario */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, index) => {
              const fechaKey = formatearFecha(day.date);
              const eventosDelDia = eventosPorDia[fechaKey] || [];
              const isToday = esHoy(day.date);

              return (
                <div
                  key={index}
                  onDragOver={(e) => {
                    dragDrop.handleDragOver(e);
                    setDragOverCell(fechaKey);
                  }}
                  onDragLeave={() => setDragOverCell(null)}
                  onDrop={(e) => dragDrop.handleDrop(e, fechaKey)}
                  className={`
                    min-h-[80px] md:min-h-[120px] p-1 md:p-2 border-b border-r border-gray-200 dark:border-white/20
                    ${!day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800'}
                    ${isToday ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-600' : ''}
                    ${dragOverCell === fechaKey ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 border-2' : ''}
                    hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors
                  `}
                >
                  {/* Número del día */}
                  <div className={`
                    text-xs md:text-sm font-semibold mb-1
                    ${!day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
                    ${isToday ? 'bg-primary-600 dark:bg-primary-500 text-white w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center' : ''}
                  `}>
                    {day.date.getDate()}
                  </div>

                  {/* Eventos del día */}
                  <div className="space-y-1">
                    {eventosDelDia.slice(0, 3).map(evento => (
                      <EventoCalendario
                        key={evento.id}
                        evento={evento}
                        onClick={setSelectedEvento}
                        onDragStart={dragDrop.handleDragStart.bind(dragDrop)}
                        onDragEnd={dragDrop.handleDragEnd.bind(dragDrop)}
                      />
                    ))}
                    {eventosDelDia.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium px-1">
                        +{eventosDelDia.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leyenda de colores */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Leyenda de Categorías</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { cat: 'Boda', color: 'bg-pink-500' },
            { cat: 'Cumpleaños', color: 'bg-purple-500' },
            { cat: 'Discoteca', color: 'bg-blue-500' },
            { cat: 'Corporativo', color: 'bg-green-500' },
            { cat: 'Festival', color: 'bg-orange-500' },
            { cat: 'Privado', color: 'bg-indigo-500' },
          ].map(({ cat, color }) => (
            <div key={cat} className="flex items-center gap-2">
              <div className={`w-4 h-4 ${color} rounded`}></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de detalle */}
      {selectedEvento && (
        <EventoDetailModal
          evento={selectedEvento}
          onClose={() => setSelectedEvento(null)}
        />
      )}

      {/* CSS para animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Calendario;
