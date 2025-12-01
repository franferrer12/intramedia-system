import { useState, useEffect } from 'react';
import { availabilityAPI } from '../services/api';
import {
  Music,
  Star,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Panel de Sugerencias Inteligentes de DJs
 * Muestra DJs alternativos con scoring de similitud cuando el DJ original no está disponible
 * Algoritmo basado en: especialidad (40pts), rating (30pts), precio (30pts)
 */
const SmartSuggestionsPanel = ({
  originalDjId,
  fecha,
  horaInicio,
  horaFin,
  agencyId,
  onSelectDJ,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (originalDjId && fecha) {
      loadSuggestions();
    }
  }, [originalDjId, fecha, horaInicio, horaFin, agencyId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await availabilityAPI.getSmartSuggestions(
        originalDjId,
        fecha,
        horaInicio,
        horaFin,
        agencyId
      );

      setSuggestions(response.data.data || []);

      if (response.data.count === 0) {
        setError('No se encontraron DJs alternativos disponibles para esta fecha');
      }
    } catch (err) {
      console.error('Error loading smart suggestions:', err);
      setError('Error al cargar sugerencias de DJs');
      toast.error('Error al cargar sugerencias');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excelente match';
    if (score >= 60) return 'Buen match';
    if (score >= 40) return 'Match aceptable';
    return 'Match bajo';
  };

  if (loading) {
    return (
      <div className={`card dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sugerencias Inteligentes
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sugerencias Inteligentes
          </h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`card dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sugerencias Inteligentes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {suggestions.length} DJs alternativos disponibles
          </p>
        </div>
      </div>

      {/* Explicación del algoritmo */}
      <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <p className="text-sm text-purple-900 dark:text-purple-200">
          <TrendingUp className="w-4 h-4 inline mr-1" />
          <strong>Algoritmo de similitud:</strong> Especialidad (40%), Rating (30%), Precio (30%)
        </p>
      </div>

      {/* Lista de sugerencias */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className="relative p-4 border-2 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
            onClick={() => onSelectDJ && onSelectDJ(suggestion)}
          >
            {/* Badge de posición */}
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
              #{index + 1}
            </div>

            {/* Score badge */}
            <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full border-2 font-bold text-sm ${getScoreColor(suggestion.similarity_score)}`}>
              {suggestion.similarity_score}%
            </div>

            <div className="mt-2">
              {/* Nombre del DJ */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {suggestion.nombre}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getScoreLabel(suggestion.similarity_score)}
                  </p>
                </div>
              </div>

              {/* Información del DJ */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                {/* Especialidad */}
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Especialidad</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {suggestion.especialidad || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {suggestion.rating ? `${suggestion.rating}/5` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Tarifa */}
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tarifa/h</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      €{suggestion.tarifa_hora || '0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Razón de la sugerencia */}
              <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {suggestion.reason}
                </p>
              </div>

              {/* Contacto */}
              {(suggestion.email || suggestion.telefono) && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                  {suggestion.email && (
                    <span>✉ {suggestion.email}</span>
                  )}
                  {suggestion.telefono && (
                    <span>📞 {suggestion.telefono}</span>
                  )}
                </div>
              )}

              {/* Hover indicator */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                  Click para seleccionar →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer con info */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          💡 Los DJs están ordenados por similitud con el DJ original.
          Haz click en uno para ver más detalles o asignarlo al evento.
        </p>
      </div>
    </div>
  );
};

export default SmartSuggestionsPanel;
