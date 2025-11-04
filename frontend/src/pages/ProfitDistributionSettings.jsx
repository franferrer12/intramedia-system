import { Settings, HelpCircle, TrendingUp, Users, Briefcase, PiggyBank } from 'lucide-react';
import ProfitDistributionConfig from '../components/ProfitDistributionConfig';

const ProfitDistributionSettings = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configuración de Distribución de Beneficios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona cómo se distribuyen los beneficios de cada evento entre gastos fijos, inversión y socios
          </p>
        </div>
      </div>

      {/* Componente Principal de Configuración */}
      <ProfitDistributionConfig />

      {/* Sección de Ayuda */}
      <div className="card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            ¿Cómo funciona?
          </h3>
        </div>

        <div className="space-y-6">
          {/* Distribución Principal */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Distribución Principal
            </h4>
            <div className="space-y-3 pl-7">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Gastos Fijos</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Porcentaje destinado a cubrir gastos operativos fijos de la agencia (alquiler, servicios, etc.)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Inversión</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Porcentaje destinado a reinversión en el negocio (marketing, equipamiento, mejoras, etc.)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Socios</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Porcentaje que se distribuye entre los socios de la agencia
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Distribución entre Socios */}
          <div className="pt-4 border-t border-blue-200 dark:border-blue-700/50">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Distribución entre Socios
            </h4>
            <div className="pl-7">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Define el porcentaje que recibe cada socio del total asignado a socios.
                Los porcentajes son individuales y deben sumar 100% entre todos los socios.
              </p>
            </div>
          </div>

          {/* Ejemplo Práctico */}
          <div className="pt-4 border-t border-blue-200 dark:border-blue-700/50">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />
              Ejemplo Práctico
            </h4>
            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Beneficio Bruto de un Evento:</span> 1,000€
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Distribución Principal:</span> 30% Gastos Fijos, 20% Inversión, 50% Socios
              </p>
              <div className="pl-4 space-y-1 text-sm text-gray-600 dark:text-gray-400 border-l-2 border-purple-300 dark:border-purple-700">
                <p>• Gastos Fijos: 300€ (30%)</p>
                <p>• Inversión: 200€ (20%)</p>
                <p>• Socios: 500€ (50%)</p>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 pt-2">
                <span className="font-semibold">Distribución entre Socios:</span> Fran 40%, Roberto 35%, Pablo 25%
              </p>
              <div className="pl-4 space-y-1 text-sm text-gray-600 dark:text-gray-400 border-l-2 border-blue-300 dark:border-blue-700">
                <p>• Fran: 200€ (40% de 500€)</p>
                <p>• Roberto: 175€ (35% de 500€)</p>
                <p>• Pablo: 125€ (25% de 500€)</p>
              </div>
            </div>
          </div>

          {/* Notas Importantes */}
          <div className="pt-4 border-t border-blue-200 dark:border-blue-700/50">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Notas Importantes
            </h4>
            <div className="space-y-2 pl-7">
              <div className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">1.</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los cambios solo afectan a eventos nuevos. Usa "Recalcular Eventos" para aplicar a eventos existentes.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">2.</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ambas distribuciones deben sumar exactamente 100% para poder guardar.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">3.</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  El cálculo se basa en el "Beneficio Bruto" del evento (Parte Agencia - Costos).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitDistributionSettings;
