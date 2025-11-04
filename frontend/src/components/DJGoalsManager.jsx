import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  Award,
  Users,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  BarChart3,
  Play,
  Pause
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

/**
 * Sistema de Objetivos y Metas Mensuales para DJs
 * Permite establecer y hacer seguimiento de objetivos de crecimiento
 */
const DJGoalsManager = ({ djId, djData, eventosData }) => {
  const [activeView, setActiveView] = useState('current'); // current, history, create
  const [selectedGoalSet, setSelectedGoalSet] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);

  // Mock data - En producción vendría del backend
  const [goalSets, setGoalSets] = useState([
    {
      id: 1,
      mes: 'Diciembre 2025',
      periodo: '2025-12',
      estado: 'activo',
      objetivos: [
        {
          tipo: 'eventos',
          nombre: 'Eventos del Mes',
          objetivo: 10,
          actual: 8,
          unidad: 'eventos',
          icon: Calendar,
          color: 'blue'
        },
        {
          tipo: 'revenue',
          nombre: 'Revenue Mensual',
          objetivo: 10000,
          actual: 6500,
          unidad: 'EUR',
          icon: DollarSign,
          color: 'green'
        },
        {
          tipo: 'rating',
          nombre: 'Rating Promedio',
          objetivo: 4.5,
          actual: 4.8,
          unidad: 'estrellas',
          icon: Star,
          color: 'yellow'
        },
        {
          tipo: 'nuevos_clientes',
          nombre: 'Nuevos Clientes',
          objetivo: 3,
          actual: 2,
          unidad: 'clientes',
          icon: Users,
          color: 'purple'
        }
      ],
      notas: 'Enfoque en eventos corporativos y bodas de alto perfil',
      fechaCreacion: '2025-12-01',
      creadoPor: 'Manager Principal'
    },
    {
      id: 2,
      mes: 'Noviembre 2025',
      periodo: '2025-11',
      estado: 'completado',
      objetivos: [
        {
          tipo: 'eventos',
          nombre: 'Eventos del Mes',
          objetivo: 8,
          actual: 9,
          unidad: 'eventos',
          icon: Calendar,
          color: 'blue'
        },
        {
          tipo: 'revenue',
          nombre: 'Revenue Mensual',
          objetivo: 8000,
          actual: 8500,
          unidad: 'EUR',
          icon: DollarSign,
          color: 'green'
        },
        {
          tipo: 'rating',
          nombre: 'Rating Promedio',
          objetivo: 4.3,
          actual: 4.6,
          unidad: 'estrellas',
          icon: Star,
          color: 'yellow'
        }
      ],
      resultado: 'Superó expectativas en todos los objetivos',
      fechaCreacion: '2025-11-01',
      fechaCompletado: '2025-11-30',
      creadoPor: 'Manager Principal'
    }
  ]);

  const [newGoalSet, setNewGoalSet] = useState({
    mes: '',
    objetivos: [
      { tipo: 'eventos', objetivo: 10 },
      { tipo: 'revenue', objetivo: 10000 },
      { tipo: 'rating', objetivo: 4.5 },
      { tipo: 'nuevos_clientes', objetivo: 3 }
    ],
    notas: ''
  });

  const currentGoalSet = goalSets.find(g => g.estado === 'activo');

  const calculateProgress = (objetivo, actual) => {
    return Math.min((actual / objetivo) * 100, 100);
  };

  const getProgressColor = (progreso) => {
    if (progreso >= 100) return 'from-green-500 to-emerald-500';
    if (progreso >= 80) return 'from-yellow-500 to-orange-500';
    if (progreso >= 60) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-rose-500';
  };

  const getProgressTextColor = (progreso) => {
    if (progreso >= 100) return 'text-green-600 dark:text-green-400';
    if (progreso >= 80) return 'text-yellow-600 dark:text-yellow-400';
    if (progreso >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusBadge = (estado) => {
    if (estado === 'activo') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
          <Play className="w-3 h-3" />
          Activo
        </span>
      );
    }
    if (estado === 'completado') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
          <CheckCircle className="w-3 h-3" />
          Completado
        </span>
      );
    }
    return null;
  };

  const handleCreateGoalSet = () => {
    const goalSet = {
      id: goalSets.length + 1,
      ...newGoalSet,
      estado: 'activo',
      objetivos: [
        { tipo: 'eventos', nombre: 'Eventos del Mes', ...newGoalSet.objetivos[0], actual: 0, unidad: 'eventos', icon: Calendar, color: 'blue' },
        { tipo: 'revenue', nombre: 'Revenue Mensual', ...newGoalSet.objetivos[1], actual: 0, unidad: 'EUR', icon: DollarSign, color: 'green' },
        { tipo: 'rating', nombre: 'Rating Promedio', ...newGoalSet.objetivos[2], actual: 0, unidad: 'estrellas', icon: Star, color: 'yellow' },
        { tipo: 'nuevos_clientes', nombre: 'Nuevos Clientes', ...newGoalSet.objetivos[3], actual: 0, unidad: 'clientes', icon: Users, color: 'purple' }
      ],
      fechaCreacion: new Date().toISOString().split('T')[0],
      creadoPor: 'Manager Principal'
    };
    setGoalSets([goalSet, ...goalSets]);
    toast.success('Objetivos creados exitosamente');
    setActiveView('current');
  };

  const GoalCard = ({ objetivo }) => {
    const progreso = calculateProgress(objetivo.objetivo, objetivo.actual);
    const Icon = objetivo.icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg bg-gradient-to-br from-${objetivo.color}-500 to-${objetivo.color}-600`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{objetivo.nombre}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-500">Objetivo {objetivo.objetivo} {objetivo.unidad}</p>
            </div>
          </div>
          <div className={`text-right ${getProgressTextColor(progreso)}`}>
            <p className="text-2xl font-bold">{progreso.toFixed(0)}%</p>
            <p className="text-xs">completado</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {objetivo.tipo === 'revenue' ? `€${objetivo.actual.toLocaleString()}` : objetivo.actual}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-500">
              / {objetivo.tipo === 'revenue' ? `€${objetivo.objetivo.toLocaleString()}` : objetivo.objetivo}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progreso}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${getProgressColor(progreso)} rounded-full relative`}
            >
              {progreso >= 100 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          </div>

          {progreso >= 100 ? (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              ¡Objetivo cumplido! 🎉
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Faltan {objetivo.tipo === 'revenue'
                ? `€${(objetivo.objetivo - objetivo.actual).toLocaleString()}`
                : Math.ceil(objetivo.objetivo - objetivo.actual)} {objetivo.unidad}
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  // Datos para gráfico de progreso histórico
  const progressHistory = goalSets
    .filter(g => g.estado === 'completado')
    .reverse()
    .map(g => {
      const totalProgress = g.objetivos.reduce((sum, obj) => {
        return sum + calculateProgress(obj.objetivo, obj.actual);
      }, 0) / g.objetivos.length;
      return {
        mes: g.mes.split(' ')[0],
        progreso: totalProgress
      };
    });

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('current')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'current'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Objetivos Actuales
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'history'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Historial
        </button>
        <button
          onClick={() => setActiveView('create')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeView === 'create'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Plus className="w-4 h-4" />
          Nuevos Objetivos
        </button>
      </div>

      {/* Current Goals View */}
      {activeView === 'current' && currentGoalSet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Target className="w-7 h-7 text-blue-600" />
                {currentGoalSet.mes}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Creado el {currentGoalSet.fechaCreacion} por {currentGoalSet.creadoPor}
              </p>
            </div>
            {getStatusBadge(currentGoalSet.estado)}
          </div>

          {/* Notas */}
          {currentGoalSet.notas && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">{currentGoalSet.notas}</p>
            </div>
          )}

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentGoalSet.objetivos.map((objetivo, idx) => (
              <GoalCard key={idx} objetivo={objetivo} />
            ))}
          </div>

          {/* Overall Progress */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Progreso General
              </h4>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {(currentGoalSet.objetivos.reduce((sum, obj) =>
                  sum + calculateProgress(obj.objetivo, obj.actual), 0
                ) / currentGoalSet.objetivos.length).toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {currentGoalSet.objetivos.map((obj, idx) => {
                const progreso = calculateProgress(obj.objetivo, obj.actual);
                return (
                  <div key={idx} className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{obj.nombre}</p>
                    <div className="relative w-16 h-16 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          className="stroke-gray-200 dark:stroke-gray-700"
                          strokeWidth="4"
                          fill="none"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          className={`stroke-${obj.color}-600`}
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${(progreso / 100) * 175.93} 175.93`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-bold text-${obj.color}-600`}>
                          {progreso.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {activeView === 'current' && !currentGoalSet && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay objetivos activos
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Crea un nuevo set de objetivos para empezar el seguimiento
          </p>
          <button
            onClick={() => setActiveView('create')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Crear Objetivos
          </button>
        </div>
      )}

      {/* History View */}
      {activeView === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Clock className="w-7 h-7 text-purple-600" />
            Historial de Objetivos
          </h3>

          {/* Progress Chart */}
          {progressHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Evolución del Cumplimiento
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={progressHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="mes" className="text-gray-600 dark:text-gray-400" />
                  <YAxis domain={[0, 100]} className="text-gray-600 dark:text-gray-400" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="progreso"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    name="% Cumplimiento"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Historical Goal Sets */}
          <div className="space-y-4">
            {goalSets.filter(g => g.estado === 'completado').map(goalSet => (
              <motion.div
                key={goalSet.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{goalSet.mes}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {goalSet.fechaCreacion} - {goalSet.fechaCompletado}
                    </p>
                  </div>
                  {getStatusBadge(goalSet.estado)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {goalSet.objetivos.map((obj, idx) => {
                    const progreso = calculateProgress(obj.objetivo, obj.actual);
                    const Icon = obj.icon;
                    return (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{obj.nombre}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {progreso.toFixed(0)}%
                        </p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-full bg-gradient-to-r ${getProgressColor(progreso)} rounded-full`}
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {goalSet.resultado && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    {goalSet.resultado}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Create View */}
      {activeView === 'create' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <Plus className="w-7 h-7 text-green-600" />
            Crear Nuevos Objetivos
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mes / Periodo
              </label>
              <input
                type="month"
                value={newGoalSet.mes}
                onChange={(e) => setNewGoalSet({ ...newGoalSet, mes: e.target.value })}
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objetivo: Eventos del Mes
                </label>
                <input
                  type="number"
                  value={newGoalSet.objetivos[0].objetivo}
                  onChange={(e) => {
                    const updated = [...newGoalSet.objetivos];
                    updated[0].objetivo = parseInt(e.target.value);
                    setNewGoalSet({ ...newGoalSet, objetivos: updated });
                  }}
                  className="input"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objetivo: Revenue (EUR)
                </label>
                <input
                  type="number"
                  value={newGoalSet.objetivos[1].objetivo}
                  onChange={(e) => {
                    const updated = [...newGoalSet.objetivos];
                    updated[1].objetivo = parseInt(e.target.value);
                    setNewGoalSet({ ...newGoalSet, objetivos: updated });
                  }}
                  className="input"
                  min="1"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objetivo: Rating Promedio
                </label>
                <input
                  type="number"
                  value={newGoalSet.objetivos[2].objetivo}
                  onChange={(e) => {
                    const updated = [...newGoalSet.objetivos];
                    updated[2].objetivo = parseFloat(e.target.value);
                    setNewGoalSet({ ...newGoalSet, objetivos: updated });
                  }}
                  className="input"
                  min="1"
                  max="5"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objetivo: Nuevos Clientes
                </label>
                <input
                  type="number"
                  value={newGoalSet.objetivos[3].objetivo}
                  onChange={(e) => {
                    const updated = [...newGoalSet.objetivos];
                    updated[3].objetivo = parseInt(e.target.value);
                    setNewGoalSet({ ...newGoalSet, objetivos: updated });
                  }}
                  className="input"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas / Estrategia
              </label>
              <textarea
                value={newGoalSet.notas}
                onChange={(e) => setNewGoalSet({ ...newGoalSet, notas: e.target.value })}
                rows={4}
                className="input resize-none"
                placeholder="Describe la estrategia y enfoque para este periodo..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setActiveView('current')}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGoalSet}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md"
              >
                Crear Objetivos
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DJGoalsManager;
