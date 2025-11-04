import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';

/**
 * Componente reutilizable de Autocompletado
 *
 * @param {Array} options - Array de opciones
 * @param {Function} getOptionLabel - Función para obtener el label de una opción
 * @param {Function} getOptionValue - Función para obtener el value de una opción
 * @param {Function} onChange - Callback cuando cambia la selección
 * @param {Function} renderOption - Función custom para renderizar opciones (opcional)
 * @param {String} placeholder - Placeholder del input
 * @param {String} value - Valor seleccionado actual
 * @param {Boolean} required - Campo requerido
 * @param {String} className - Clases CSS adicionales
 */
const Autocomplete = ({
  options = [],
  getOptionLabel = (opt) => opt.label || opt.name || opt,
  getOptionValue = (opt) => opt.value || opt.id || opt,
  onChange,
  renderOption,
  placeholder = 'Buscar...',
  value,
  required = false,
  className = '',
  icon: Icon
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const containerRef = useRef(null);

  // Encontrar la opción seleccionada basada en el value
  useEffect(() => {
    if (value) {
      const option = options.find(opt => getOptionValue(opt) === value);
      if (option) {
        setSelectedOption(option);
        setSearchTerm(getOptionLabel(option));
      }
    } else {
      setSelectedOption(null);
      setSearchTerm('');
    }
  }, [value, options]);

  // Filtrar opciones basadas en el término de búsqueda
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options.slice(0, 10);

    return options.filter(opt => {
      const label = getOptionLabel(opt).toLowerCase();
      return label.includes(searchTerm.toLowerCase());
    }).slice(0, 10);
  }, [searchTerm, options]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setSearchTerm(getOptionLabel(option));
    setShowSuggestions(false);
    onChange && onChange(getOptionValue(option), option);
  };

  const handleClear = () => {
    setSelectedOption(null);
    setSearchTerm('');
    onChange && onChange(null, null);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);

    // Si el usuario borra, limpiar selección
    if (!value) {
      setSelectedOption(null);
      onChange && onChange(null, null);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          required={required}
          placeholder={placeholder}
          className="input w-full pr-20"
        />

        {/* Icono a la izquierda */}
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}

        {/* Botones a la derecha */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedOption && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Lista de sugerencias */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-gray-500 text-sm text-center">
              No se encontraron resultados
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full p-3 hover:bg-gray-50 text-left transition-colors border-b last:border-b-0"
              >
                {renderOption ? (
                  renderOption(option)
                ) : (
                  <div className="font-medium text-gray-900">
                    {getOptionLabel(option)}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Autocomplete;
