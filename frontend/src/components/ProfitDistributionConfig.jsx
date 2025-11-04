import { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader,
  Settings,
  TrendingUp,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ProfitDistributionConfig = () => {
  const [config, setConfig] = useState({
    porcentaje_gastos_fijos: 0,
    porcentaje_inversion: 0,
    porcentaje_socios: 0,
    porcentaje_fran: 0,
    porcentaje_roberto: 0,
    porcentaje_pablo: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profit-distribution/config');
      setConfig(response.data);
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    // Validar que las sumas sean 100%
    const totalDistribution =
      parseFloat(config.porcentaje_gastos_fijos) +
      parseFloat(config.porcentaje_inversion) +
      parseFloat(config.porcentaje_socios);

    const totalPartners =
      parseFloat(config.porcentaje_fran) +
      parseFloat(config.porcentaje_roberto) +
      parseFloat(config.porcentaje_pablo);

    if (Math.abs(totalDistribution - 100) > 0.01) {
      toast.error('La distribución principal debe sumar 100%');
      return;
    }

    if (Math.abs(totalPartners - 100) > 0.01) {
      toast.error('La distribución entre socios debe sumar 100%');
      return;
    }

    try {
      setSaving(true);
      await api.put('/profit-distribution/config', config);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    if (!window.confirm('¿Estás seguro de recalcular todos los eventos? Esta acción aplicará la configuración actual a todos los eventos.')) {
      return;
    }

    try {
      setRecalculating(true);
      await api.post('/profit-distribution/recalculate');
      toast.success('Eventos recalculados exitosamente');
    } catch (error) {
      console.error('Error recalculando eventos:', error);
      toast.error('Error al recalcular eventos');
    } finally {
      setRecalculating(false);
    }
  };

  const handleSliderChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: parseFloat(value)
    }));
  };

  const getTotalDistribution = () => {
    return parseFloat(config.porcentaje_gastos_fijos) +
           parseFloat(config.porcentaje_inversion) +
           parseFloat(config.porcentaje_socios);
  };

  const getTotalPartners = () => {
    return parseFloat(config.porcentaje_fran) +
           parseFloat(config.porcentaje_roberto) +
           parseFloat(config.porcentaje_pablo);
  };

  const isDistributionValid = () => {
    const total = getTotalDistribution();
    return Math.abs(total - 100) < 0.01;
  };

  const isPartnersValid = () => {
    const total = getTotalPartners();
    return Math.abs(total - 100) < 0.01;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Distribución Principal */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Distribución de Beneficios
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configura cómo se distribuyen los beneficios de cada evento
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Gastos Fijos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Gastos Fijos
              </label>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {config.porcentaje_gastos_fijos}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={config.porcentaje_gastos_fijos}
              onChange={(e) => handleSliderChange('porcentaje_gastos_fijos', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-purple-600"
            />
          </div>

          {/* Inversión */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Inversión
              </label>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {config.porcentaje_inversion}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={config.porcentaje_inversion}
              onChange={(e) => handleSliderChange('porcentaje_inversion', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-green-600"
            />
          </div>

          {/* Socios */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Socios
              </label>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {config.porcentaje_socios}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={config.porcentaje_socios}
              onChange={(e) => handleSliderChange('porcentaje_socios', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
            />
          </div>

          {/* Total de Distribución */}
          <div className={`p-4 rounded-lg border-2 ${
            isDistributionValid()
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
              : 'bg-red-50 dark:bg-red-900/20 border-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isDistributionValid() ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold text-gray-900 dark:text-white">
                  Total Distribución
                </span>
              </div>
              <span className={`text-2xl font-bold ${
                isDistributionValid()
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {getTotalDistribution().toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución entre Socios */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Distribución entre Socios
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Define el porcentaje de cada socio
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Fran */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fran
              </label>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {config.porcentaje_fran}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={config.porcentaje_fran}
              onChange={(e) => handleSliderChange('porcentaje_fran', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-purple-600"
            />
          </div>

          {/* Roberto */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Roberto
              </label>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {config.porcentaje_roberto}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={config.porcentaje_roberto}
              onChange={(e) => handleSliderChange('porcentaje_roberto', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
            />
          </div>

          {/* Pablo */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pablo
              </label>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {config.porcentaje_pablo}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={config.porcentaje_pablo}
              onChange={(e) => handleSliderChange('porcentaje_pablo', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-green-600"
            />
          </div>

          {/* Total de Socios */}
          <div className={`p-4 rounded-lg border-2 ${
            isPartnersValid()
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
              : 'bg-red-50 dark:bg-red-900/20 border-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPartnersValid() ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold text-gray-900 dark:text-white">
                  Total Socios
                </span>
              </div>
              <span className={`text-2xl font-bold ${
                isPartnersValid()
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {getTotalPartners().toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSaveConfig}
          disabled={saving || !isDistributionValid() || !isPartnersValid()}
          className="flex-1 btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Configuración
            </>
          )}
        </button>

        <button
          onClick={handleRecalculate}
          disabled={recalculating || !isDistributionValid() || !isPartnersValid()}
          className="flex-1 btn bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {recalculating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Recalculando...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Recalcular Eventos
            </>
          )}
        </button>
      </div>

      {/* Advertencia */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
              Importante
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              El botón "Recalcular Eventos" aplicará la configuración actual a todos los eventos existentes.
              Esta acción sobrescribirá los valores de distribución calculados anteriormente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitDistributionConfig;
