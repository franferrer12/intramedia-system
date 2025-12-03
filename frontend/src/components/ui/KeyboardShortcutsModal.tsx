import { FC } from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutCategory {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

export const KeyboardShortcutsModal: FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories: ShortcutCategory[] = [
    {
      title: 'Navegación Global',
      shortcuts: [
        { keys: ['Ctrl', 'K'], description: 'Búsqueda global' },
        { keys: ['F2'], description: 'Abrir Terminal POS' },
        { keys: ['Esc'], description: 'Cerrar modal/cancelar' },
        { keys: ['G', 'D'], description: 'Ir a Dashboard' },
        { keys: ['G', 'E'], description: 'Ir a Eventos' },
        { keys: ['G', 'I'], description: 'Ir a Inventario' },
        { keys: ['G', 'F'], description: 'Ir a Finanzas' },
        { keys: ['G', 'P'], description: 'Ir a Personal' },
        { keys: ['G', 'V'], description: 'Ir a Ventas (POS)' },
      ],
    },
    {
      title: 'Acciones Generales',
      shortcuts: [
        { keys: ['Ctrl', 'N'], description: 'Nuevo (según contexto)' },
        { keys: ['Ctrl', 'S'], description: 'Guardar formulario' },
        { keys: ['Ctrl', 'E'], description: 'Exportar (cuando disponible)' },
      ],
    },
    {
      title: 'Terminal POS',
      shortcuts: [
        { keys: ['F5'], description: 'Cobrar Efectivo' },
        { keys: ['F6'], description: 'Cobrar Tarjeta' },
        { keys: ['F7'], description: 'Pago Mixto' },
        { keys: ['F9'], description: 'Limpiar carrito' },
        { keys: ['Enter'], description: 'Confirmar pago' },
      ],
    },
    {
      title: 'Listas y Tablas',
      shortcuts: [
        { keys: ['↑', '↓'], description: 'Navegar resultados de búsqueda' },
        { keys: ['Enter'], description: 'Seleccionar/abrir' },
      ],
    },
  ];

  // Detectar si es Mac
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const renderKey = (key: string) => {
    // Reemplazar Ctrl por Cmd en Mac
    const displayKey = isMac && key === 'Ctrl' ? 'Cmd' : key;

    return (
      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow-sm min-w-[2rem] inline-flex items-center justify-center">
        {displayKey === 'Cmd' && <Command className="h-3 w-3" />}
        {displayKey !== 'Cmd' && displayKey}
      </kbd>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Keyboard className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Atajos de Teclado</h2>
                <p className="text-purple-100 text-sm mt-1">
                  Aumenta tu productividad con estos atajos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-purple-200 pb-2">
                  {category.title}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
                    >
                      <span className="text-sm text-gray-700">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center space-x-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <span key={keyIdx} className="flex items-center">
                            {renderKey(key)}
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="text-gray-400 mx-1">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 rounded p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              💡 Consejos
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Los atajos <strong>G + tecla</strong> funcionan presionando 'G' primero, luego la letra</li>
              <li>• Presiona <strong>?</strong> en cualquier momento para ver esta ayuda</li>
              <li>• Los atajos solo funcionan cuando no estás escribiendo en un campo de texto</li>
              <li>• {isMac ? 'Cmd' : 'Ctrl'} + K abre la búsqueda global desde cualquier página</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Presiona <kbd className="px-2 py-1 text-xs font-semibold bg-white border rounded">?</kbd> para abrir esta ayuda
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
