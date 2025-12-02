import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CalendarIcon, UserIcon, MusicalNoteIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import api from '../services/api';
import toast from '../utils/toast';

/**
 * Global Search Component
 * Search across all entities (eventos, DJs, clientes, leads)
 * Opens with Ctrl+K
 */
const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ eventos: [], djs: [], clientes: [], leads: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Listen for command palette open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search debounced
  useEffect(() => {
    if (!query.trim()) {
      setResults({ eventos: [], djs: [], clientes: [], leads: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Search in parallel
        const [eventosRes, djsRes, clientesRes, leadsRes] = await Promise.all([
          api.get(`/eventos?search=${encodeURIComponent(query)}&limit=5`),
          api.get(`/djs?search=${encodeURIComponent(query)}&limit=5`),
          api.get(`/clientes?search=${encodeURIComponent(query)}&limit=5`),
          api.get(`/leads?search=${encodeURIComponent(query)}&limit=5`),
        ]);

        setResults({
          eventos: eventosRes.data.data || [],
          djs: djsRes.data.data || [],
          clientes: clientesRes.data.data || [],
          leads: leadsRes.data.data || [],
        });
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Error en la búsqueda');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Calculate total results for keyboard navigation
  const allResults = [
    ...results.eventos.map(e => ({ type: 'evento', data: e })),
    ...results.djs.map(d => ({ type: 'dj', data: d })),
    ...results.clientes.map(c => ({ type: 'cliente', data: c })),
    ...results.leads.map(l => ({ type: 'lead', data: l })),
  ];

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    }
  };

  const handleSelect = (result) => {
    const { type, data } = result;
    let path = '';

    switch (type) {
      case 'evento':
        path = `/eventos?id=${data.id}`;
        break;
      case 'dj':
        path = `/djs?id=${data.id}`;
        break;
      case 'cliente':
        path = `/clientes?id=${data.id}`;
        break;
      case 'lead':
        path = `/leads?id=${data.id}`;
        break;
      default:
        return;
    }

    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const getIcon = (type) => {
    switch (type) {
      case 'evento':
        return <CalendarIcon className="h-5 w-5 text-blue-500" />;
      case 'dj':
        return <MusicalNoteIcon className="h-5 w-5 text-purple-500" />;
      case 'cliente':
        return <UserIcon className="h-5 w-5 text-green-500" />;
      case 'lead':
        return <UserGroupIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getLabel = (type) => {
    const labels = { evento: 'Evento', dj: 'DJ', cliente: 'Cliente', lead: 'Lead' };
    return labels[type];
  };

  const formatResult = (type, data) => {
    switch (type) {
      case 'evento':
        return {
          title: data.evento,
          subtitle: data.ubicacion || new Date(data.fecha).toLocaleDateString('es-ES'),
        };
      case 'dj':
        return {
          title: data.nombre_artistico || data.nombre,
          subtitle: data.especialidad || data.email,
        };
      case 'cliente':
        return {
          title: data.nombre,
          subtitle: data.email || data.telefono,
        };
      case 'lead':
        return {
          title: data.nombre,
          subtitle: `${data.status} - Score: ${data.score || 0}`,
        };
      default:
        return { title: '', subtitle: '' };
    }
  };

  if (!isOpen) return null;

  const totalResults = allResults.length;
  const hasResults = totalResults > 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex items-start justify-center min-h-screen p-4 pt-20">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar eventos, DJs, clientes, leads..."
              className="flex-1 px-4 py-4 text-gray-900 dark:text-white bg-transparent border-0 focus:ring-0 focus:outline-none"
              aria-label="Búsqueda global"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                aria-label="Limpiar búsqueda"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isSearching && (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Buscando...</p>
              </div>
            )}

            {!isSearching && !hasResults && query && (
              <div className="p-8 text-center">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron resultados para "{query}"
                </p>
              </div>
            )}

            {!isSearching && !query && (
              <div className="p-8 text-center">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-900 dark:text-white font-medium">
                  Búsqueda Global
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Busca en eventos, DJs, clientes y leads
                </p>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>↑↓ para navegar</p>
                  <p>Enter para seleccionar</p>
                  <p>Esc para cerrar</p>
                </div>
              </div>
            )}

            {!isSearching && hasResults && (
              <div className="py-2">
                {allResults.map((result, index) => {
                  const { title, subtitle } = formatResult(result.type, result.data);
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={`${result.type}-${result.data.id}`}
                      onClick={() => handleSelect(result)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      {getIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {title}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            {getLabel(result.type)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {hasResults && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>{totalResults} resultado{totalResults !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-4">
                <span>↑↓ Navegar</span>
                <span>Enter Seleccionar</span>
                <span>Esc Cerrar</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
