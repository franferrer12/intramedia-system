import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Award } from 'lucide-react';

const LeadScore = ({ score = 0, probability = 0 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedProbability, setAnimatedProbability] = useState(0);

  useEffect(() => {
    // Animación de conteo
    const duration = 1500;
    const steps = 60;
    const scoreIncrement = score / steps;
    const probabilityIncrement = probability / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setAnimatedScore(Math.min(Math.round(scoreIncrement * currentStep), score));
        setAnimatedProbability(Math.min(Math.round(probabilityIncrement * currentStep), probability));
      } else {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, probability]);

  const getScoreColor = (value) => {
    if (value <= 20) return { from: '#ef4444', to: '#dc2626', label: 'Muy Bajo', textColor: 'text-red-600' };
    if (value <= 40) return { from: '#f97316', to: '#ea580c', label: 'Bajo', textColor: 'text-orange-600' };
    if (value <= 60) return { from: '#eab308', to: '#ca8a04', label: 'Medio', textColor: 'text-yellow-600' };
    if (value <= 80) return { from: '#84cc16', to: '#65a30d', label: 'Alto', textColor: 'text-lime-600' };
    return { from: '#22c55e', to: '#16a34a', label: 'Muy Alto', textColor: 'text-green-600' };
  };

  const scoreColor = getScoreColor(score);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Círculo de puntuación */}
        <div className="relative">
          <svg width="180" height="180" className="transform -rotate-90">
            {/* Círculo de fondo */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Círculo de progreso */}
            <motion.circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={`url(#gradient-${score})`}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - progress }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            {/* Gradiente */}
            <defs>
              <linearGradient id={`gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={scoreColor.from} />
                <stop offset="100%" stopColor={scoreColor.to} />
              </linearGradient>
            </defs>
          </svg>

          {/* Puntuación en el centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className={`text-4xl font-bold ${scoreColor.textColor}`}>
                {animatedScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Puntuación
              </div>
            </motion.div>
          </div>
        </div>

        {/* Información detallada */}
        <div className="flex-1 space-y-6 w-full">
          {/* Header */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Lead Score
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Evaluación automática basada en comportamiento y datos del lead
            </p>
          </div>

          {/* Nivel de calidad */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Award className={`w-5 h-5 ${scoreColor.textColor}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nivel de Calidad
              </span>
            </div>
            <div className={`text-2xl font-bold ${scoreColor.textColor}`}>
              {scoreColor.label}
            </div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${animatedScore}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(to right, ${scoreColor.from}, ${scoreColor.to})`
                }}
              />
            </div>
          </div>

          {/* Probabilidad de conversión */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Probabilidad de Conversión
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-3xl font-bold text-purple-600"
              >
                {animatedProbability}%
              </motion.span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${animatedProbability}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
              />
            </div>
          </div>

          {/* Recomendación */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800"
          >
            <p className="text-sm text-purple-900 dark:text-purple-100">
              {score >= 80 && (
                <>
                  <strong>Recomendación:</strong> Lead de alta calidad. Priorizar contacto inmediato y enviar propuesta personalizada.
                </>
              )}
              {score >= 60 && score < 80 && (
                <>
                  <strong>Recomendación:</strong> Lead prometedor. Mantener seguimiento activo y nutrir con contenido relevante.
                </>
              )}
              {score >= 40 && score < 60 && (
                <>
                  <strong>Recomendación:</strong> Lead en desarrollo. Continuar con seguimiento regular y recopilar más información.
                </>
              )}
              {score >= 20 && score < 40 && (
                <>
                  <strong>Recomendación:</strong> Lead frío. Incluir en campañas de nurturing automatizadas.
                </>
              )}
              {score < 20 && (
                <>
                  <strong>Recomendación:</strong> Lead de baja prioridad. Evaluar si cumple con el perfil de cliente ideal.
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LeadScore;
