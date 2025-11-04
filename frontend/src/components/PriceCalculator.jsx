import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, X, DollarSign, Percent, TrendingUp, Copy, Check } from 'lucide-react';

/**
 * Calculadora de Precios
 * Calcula automáticamente caché total, parte DJ, parte agencia y comisiones
 */
const PriceCalculator = ({ isOpen, onClose }) => {
  const [cacheTotal, setCacheTotal] = useState('');
  const [porcentajeAgencia, setPorcentajeAgencia] = useState('20');
  const [copied, setCopied] = useState(false);

  // Cálculos automáticos
  const total = parseFloat(cacheTotal) || 0;
  const porcentaje = parseFloat(porcentajeAgencia) || 0;

  const parteAgencia = (total * porcentaje) / 100;
  const parteDJ = total - parteAgencia;

  const iva = parteAgencia * 0.21; // IVA 21%
  const ivaTotal = total * 0.21;

  const handleCopy = () => {
    const resultado = `
Caché Total: €${total.toFixed(2)}
Parte Agencia (${porcentaje}%): €${parteAgencia.toFixed(2)}
Parte DJ: €${parteDJ.toFixed(2)}
IVA Agencia (21%): €${iva.toFixed(2)}
IVA Total (21%): €${ivaTotal.toFixed(2)}
    `.trim();

    navigator.clipboard.writeText(resultado);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setCacheTotal('');
    setPorcentajeAgencia('20');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold">Calculadora de Precios</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-green-100 text-sm">Calcula automáticamente cachés y comisiones</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Inputs */}
              <div className="space-y-4">
                {/* Caché Total */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4" />
                    Caché Total
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                    <input
                      type="number"
                      value={cacheTotal}
                      onChange={(e) => setCacheTotal(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                </div>

                {/* Porcentaje Agencia */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Percent className="w-4 h-4" />
                    Comisión Agencia
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={porcentajeAgencia}
                      onChange={(e) => setPorcentajeAgencia(e.target.value)}
                      placeholder="20"
                      step="1"
                      min="0"
                      max="100"
                      className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                    <div className="flex items-center justify-center w-12 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold">
                      %
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[15, 20, 25, 30].map((value) => (
                      <button
                        key={value}
                        onClick={() => setPorcentajeAgencia(value.toString())}
                        className={`flex-1 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                          porcentajeAgencia === value.toString()
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

              {/* Results */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-3">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Resultados</span>
                </div>

                {/* Parte Agencia */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">Parte Agencia ({porcentaje}%)</p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Comisión</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    €{parteAgencia.toFixed(2)}
                  </p>
                </div>

                {/* Parte DJ */}
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Parte DJ</p>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">Pago al artista</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    €{parteDJ.toFixed(2)}
                  </p>
                </div>

                {/* IVA Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">IVA Agencia (21%)</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      €{iva.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">IVA Total (21%)</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      €{ivaTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
              >
                Limpiar
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 px-4 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PriceCalculator;
