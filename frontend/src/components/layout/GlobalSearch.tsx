import { FC, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Users, Package, DollarSign, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { eventosApi } from '../../api/eventos.api';
import { empleadosApi } from '../../api/empleados.api';
import { productosApi } from '../../api/productos.api';
import { transaccionesApi } from '../../api/transacciones.api';

interface SearchResult {
  id: number;
  type: 'evento' | 'empleado' | 'producto' | 'transaccion';
  title: string;
  subtitle?: string;
  route: string;
  icon: typeof Calendar;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Refs to avoid re-creating event handlers
  const resultsRef = useRef<SearchResult[]>([]);
  const selectedIndexRef = useRef(0);

  useEffect(() => {
    resultsRef.current = results;
    selectedIndexRef.current = selectedIndex;
  }, [results, selectedIndex]);

  // Fetch all data
  const { data: eventos = [] } = useQuery({
    queryKey: ['eventos'],
    queryFn: eventosApi.getAll,
    enabled: isOpen,
  });

  const { data: empleados = [] } = useQuery({
    queryKey: ['empleados'],
    queryFn: empleadosApi.getAll,
    enabled: isOpen,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: productosApi.getAll,
    enabled: isOpen,
  });

  const { data: transacciones = [] } = useQuery({
    queryKey: ['transacciones'],
    queryFn: transaccionesApi.getAll,
    enabled: isOpen,
  });

  // Search logic
  useEffect(() => {
    if (!isOpen) {
      return; // Don't run search if modal is closed
    }

    if (!searchTerm.trim()) {
      if (results.length > 0) {
        setResults([]);
      }
      return;
    }

    const term = searchTerm.toLowerCase();
    const newResults: SearchResult[] = [];

    // Search eventos
    eventos
      .filter(e =>
        e.nombre.toLowerCase().includes(term) ||
        e.artista?.toLowerCase().includes(term)
      )
      .slice(0, 3)
      .forEach(e => {
        newResults.push({
          id: e.id,
          type: 'evento',
          title: e.nombre,
          subtitle: e.fecha + (e.artista ? ` - ${e.artista}` : ''),
          route: '/eventos',
          icon: Calendar,
        });
      });

    // Search empleados
    empleados
      .filter(emp =>
        emp.nombre.toLowerCase().includes(term) ||
        emp.apellidos.toLowerCase().includes(term) ||
        emp.dni.toLowerCase().includes(term) ||
        emp.cargo.toLowerCase().includes(term)
      )
      .slice(0, 3)
      .forEach(emp => {
        newResults.push({
          id: emp.id,
          type: 'empleado',
          title: `${emp.nombre} ${emp.apellidos}`,
          subtitle: `${emp.cargo} - ${emp.dni}`,
          route: '/personal',
          icon: Users,
        });
      });

    // Search productos
    productos
      .filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term) ||
        p.categoria?.toLowerCase().includes(term)
      )
      .slice(0, 3)
      .forEach(p => {
        newResults.push({
          id: p.id,
          type: 'producto',
          title: p.nombre,
          subtitle: `${p.codigo} - Stock: ${p.stockActual}`,
          route: '/inventario',
          icon: Package,
        });
      });

    // Search transacciones
    transacciones
      .filter(t =>
        t.concepto.toLowerCase().includes(term) ||
        t.categoriaNombre?.toLowerCase().includes(term)
      )
      .slice(0, 3)
      .forEach(t => {
        newResults.push({
          id: t.id,
          type: 'transaccion',
          title: t.concepto,
          subtitle: `${t.tipo} - €${t.monto.toFixed(2)} - ${t.fecha}`,
          route: '/finanzas',
          icon: DollarSign,
        });
      });

    setResults(newResults);
    setSelectedIndex(0);
  }, [isOpen, searchTerm, eventos, empleados, productos, transacciones, results.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, resultsRef.current.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (resultsRef.current[selectedIndexRef.current]) {
            navigate(resultsRef.current[selectedIndexRef.current].route);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, navigate, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl">
        {/* Search Input */}
        <div className="flex items-center border-b border-gray-200 px-4">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar eventos, empleados, productos, transacciones..."
            className="w-full py-4 text-lg outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="ml-2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = result.icon;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      navigate(result.route);
                      onClose();
                    }}
                    className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${
                      result.type === 'evento' ? 'bg-blue-100 text-blue-600' :
                      result.type === 'empleado' ? 'bg-green-100 text-green-600' :
                      result.type === 'producto' ? 'bg-purple-100 text-purple-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-gray-500">{result.subtitle}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 uppercase ml-4">
                      {result.type}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : searchTerm.trim() ? (
            <div className="py-12 text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron resultados para "{searchTerm}"</p>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Escribe para buscar en eventos, empleados, productos...</p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Usa ↑↓ para navegar, Enter para seleccionar, Esc para cerrar</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">↑↓</kbd>
                Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Enter</kbd>
                Abrir
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Esc</kbd>
                Cerrar
              </span>
            </div>
            <span>{results.length} resultados</span>
          </div>
        </div>
      </div>
    </div>
  );
};
