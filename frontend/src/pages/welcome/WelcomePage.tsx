import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Smartphone, Users, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const WelcomePage: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Club Management System
          </h1>
          <p className="text-xl text-blue-200">
            Selecciona cómo quieres acceder al sistema
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Terminal POS Card */}
          <div
            onClick={() => navigate('/pos-terminal/standalone')}
            className="bg-white rounded-2xl shadow-2xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-3xl"
          >
            <div className="flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6 mx-auto">
              <Monitor className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Terminal POS
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Acceso directo al punto de venta para tablets y dispositivos táctiles.
              Funciona sin conexión a internet.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-700">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <span>Optimizado para tablets</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Monitor className="h-5 w-5 text-blue-600" />
                <span>Pantalla completa</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Funciona offline</span>
              </div>
            </div>
            <Button
              variant="primary"
              className="w-full h-14 text-lg font-semibold group"
            >
              <span>Abrir Terminal POS</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Sistema Principal Card */}
          <div
            onClick={() => navigate('/login')}
            className="bg-white rounded-2xl shadow-2xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-3xl"
          >
            <div className="flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-6 mx-auto">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Backoffice
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Acceso completo al sistema de gestión: eventos, finanzas, personal,
              inventario, analytics y más.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Dashboard completo</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Gestión avanzada</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Control de accesos</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full h-14 text-lg font-semibold border-2 border-green-600 text-green-600 hover:bg-green-50 group"
            >
              <span>Acceder al Backoffice</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-blue-200 text-sm">
            ¿Primera vez usando el Terminal POS?{' '}
            <button
              onClick={() => navigate('/ayuda')}
              className="underline hover:text-white transition-colors"
            >
              Ver guía de inicio rápido
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
