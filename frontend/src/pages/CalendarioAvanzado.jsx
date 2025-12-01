import { useState } from 'react';
import { djsAPI } from '../services/api';
import {
  Calendar,
  Home,
  Users,
  Filter,
  Sparkles
} from 'lucide-react';
import { Breadcrumbs, Select } from '../components';
import DJAvailabilityCalendar from '../components/DJAvailabilityCalendar';
import SmartSuggestionsPanel from '../components/SmartSuggestionsPanel';
import toast from 'react-hot-toast';

/**
 * Página de Calendario Avanzado
 * Integra disponibilidad de DJs con sugerencias inteligentes
 * Sprint 4.1.2 - Calendar View Frontend
 */
const CalendarioAvanzado = () => {
  const [selectedDJ, setSelectedDJ] = useState(null);
  const [djs, setDJs] = useState([]);
  const [viewMode, setViewMode] = useState('agency'); // 'agency' or 'individual'
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Cargar DJs cuando el componente se monta
  useState(() => {
    loadDJs();
  }, []);

  const loadDJs = async () => {
    try {
      const response = await djsAPI.getAll();
      setDJs(response.data.data || []);
    } catch (error) {
      console.error('Error loading DJs:', error);
      toast.error('Error al cargar lista de DJs');
    }
  };

  const handleDateClick = (dayData) => {
    setSelectedDate(dayData);
    console.log('Día seleccionado:', dayData);

    // Si hay eventos reservados, no mostrar sugerencias
    const reservadoCount = dayData.reservado_count || 0;
    if (reservadoCount === 0 && selectedDJ) {
      // Mostrar panel de sugerencias si no hay nada reservado
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleEventClick = (event) => {
    console.log('Evento seleccionado:', event);
    toast.success(`Evento: ${event.evento_nombre || 'Sin nombre'}`);
  };

  const handleSelectSuggestedDJ = (dj) => {
    console.log('DJ sugerido seleccionado:', dj);
    toast.success(`DJ seleccionado: ${dj.nombre}`);
    setShowSuggestions(false);
    // Aquí podrías abrir un modal para crear/asignar evento
  };

  const handleDJChange = (djId) => {
    if (djId === '') {
      setSelectedDJ(null);
      setViewMode('agency');
    } else {
      const dj = djs.find(d => d.id === parseInt(djId));
      setSelectedDJ(dj);
      setViewMode('individual');
    }
    setShowSuggestions(false);
    setSelectedDate(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Inicio', path: '/', icon: Home },
          { label: 'Calendario Avanzado', path: '/calendario-avanzado', icon: Calendar }
        ]}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <Calendar className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Calendario Avanzado
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Gestión inteligente de disponibilidad con sugerencias automáticas
              </p>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Selector de modo */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
            <button
              onClick={() => {
                setViewMode('agency');
                setSelectedDJ(null);
                setShowSuggestions(false);
              }}
              className={`
                px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 text-sm font-medium
                ${viewMode === 'agency'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Agencia</span>
            </button>
            <button
              onClick={() => setViewMode('individual')}
              disabled={!selectedDJ}
              className={`
                px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 text-sm font-medium
                ${viewMode === 'individual'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Individual</span>
            </button>
          </div>

          {/* Selector de DJ */}
          <Select
            value={selectedDJ?.id || ''}
            onChange={(e) => handleDJChange(e.target.value)}
            className="min-w-[200px]"
          >
            <option value="">Todos los DJs</option>
            {djs.map(dj => (
              <option key={dj.id} value={dj.id}>
                {dj.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Info card */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              ¿Cómo funciona el sistema inteligente?
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>✅ <strong>Verde:</strong> DJ disponible en esa fecha</li>
              <li>🔵 <strong>Azul:</strong> DJ reservado para un evento</li>
              <li>❌ <strong>Rojo:</strong> DJ no disponible</li>
              <li>💡 <strong>Sugerencias inteligentes:</strong> Click en un día sin eventos para ver DJs alternativos disponibles</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Layout principal: Calendario + Sugerencias */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendario - 2/3 del espacio */}
        <div className="xl:col-span-2">
          <DJAvailabilityCalendar
            djId={viewMode === 'individual' ? selectedDJ?.id : null}
            agencyId={viewMode === 'agency' ? 1 : null}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        </div>

        {/* Panel lateral - 1/3 del espacio */}
        <div className="space-y-4">
          {/* Información del día seleccionado */}
          {selectedDate && (
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Día Seleccionado
              </h3>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {new Date(selectedDate.fecha).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Disponible</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {selectedDate.disponible_count || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Reservado</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {selectedDate.reservado_count || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">No Disp.</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {selectedDate.no_disponible_count || 0}
                    </p>
                  </div>
                </div>

                {/* Botón para mostrar sugerencias */}
                {viewMode === 'individual' && selectedDJ && (selectedDate.reservado_count || 0) === 0 && (
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="w-full mt-4 btn-primary flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {showSuggestions ? 'Ocultar Sugerencias' : 'Ver Sugerencias Inteligentes'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Panel de sugerencias inteligentes */}
          {showSuggestions && selectedDJ && selectedDate && (
            <SmartSuggestionsPanel
              originalDjId={selectedDJ.id}
              fecha={selectedDate.fecha}
              onSelectDJ={handleSelectSuggestedDJ}
            />
          )}

          {/* Placeholder cuando no hay selección */}
          {!selectedDate && (
            <div className="card dark:bg-gray-800 dark:border-gray-700 text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Selecciona un día en el calendario para ver detalles y sugerencias
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Leyenda completa */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Leyenda del Sistema de Disponibilidad
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-md flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Disponible</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                DJ libre para reservas
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Reservado</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                DJ asignado a evento
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="w-8 h-8 bg-red-500 rounded-md flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">No Disponible</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                DJ bloqueado o inactivo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarioAvanzado;
