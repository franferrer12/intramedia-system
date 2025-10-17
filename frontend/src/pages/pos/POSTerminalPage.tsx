import { useNavigate } from 'react-router-dom';
import { Monitor, ExternalLink, ArrowRight } from 'lucide-react';

/**
 * POSTerminalPage - Acceso al Terminal Standalone
 *
 * Esta página proporciona acceso al terminal POS standalone.
 * El terminal standalone está optimizado para dispositivos de caja físicos
 * y proporciona una interfaz táctil completa sin necesidad de login admin.
 */
export default function POSTerminalPage() {
  const navigate = useNavigate();

  // REDIRECCIÓN AUTOMÁTICA DESHABILITADA
  // Solo muestra opciones sin redireccionar automáticamente
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     window.location.href = '/pos-terminal/standalone';
  //   }, 2000);
  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          {/* Icon */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Monitor className="h-16 w-16 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Acceso al Terminal POS
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 mb-8">
            Abre el <strong>Terminal POS Standalone</strong> optimizado para dispositivos de caja
          </p>

          {/* Manual redirect button */}
          <div className="space-y-4">
            <a
              href="/pos-terminal/standalone"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <ExternalLink className="h-6 w-6" />
              Ir Ahora al Terminal POS
              <ArrowRight className="h-6 w-6" />
            </a>

            <button
              onClick={() => navigate('/pos')}
              className="block w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              ← Volver al Panel de Gestión
            </button>
          </div>

          {/* Info box */}
          <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-left">
            <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              💡 Sobre el Terminal POS Standalone
            </h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">✓</span>
                <span><strong>Interfaz táctil optimizada</strong> para pantallas de caja</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">✓</span>
                <span><strong>Sin login admin requerido</strong> - autenticación por dispositivo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">✓</span>
                <span><strong>Modo offline</strong> - funciona sin conexión continua</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">✓</span>
                <span><strong>Atajos de teclado</strong> - F5/F6/F7 para pagos rápidos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">✓</span>
                <span><strong>Sincronización automática</strong> - ventas se suben al servidor</span>
              </li>
            </ul>
          </div>

          {/* Alternative options */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              ¿Necesitas gestionar sesiones o ver métricas?{' '}
              <button
                onClick={() => navigate('/pos')}
                className="text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Usa el Panel de Gestión POS
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
