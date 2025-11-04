import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  HelpCircle,
  Book,
  Video,
  Lightbulb,
  ChevronRight,
  Star,
  PlayCircle,
  FileText,
  Sparkles
} from 'lucide-react';

/**
 * Virtual Assistant Component
 * Provides interactive help, tours, and guidance throughout the application
 */

const VirtualAssistant = ({ currentPage = 'dashboard' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome'); // welcome, quickStart, tours, faq
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  // Check if user has seen welcome message
  useEffect(() => {
    const welcomeSeen = localStorage.getItem('assistantWelcomeSeen');
    if (!welcomeSeen) {
      setTimeout(() => {
        setShowWelcome(true);
      }, 2000);
    } else {
      setHasSeenWelcome(true);
    }
  }, []);

  const closeWelcome = () => {
    setShowWelcome(false);
    setHasSeenWelcome(true);
    localStorage.setItem('assistantWelcomeSeen', 'true');
  };

  const openAssistant = () => {
    setIsOpen(true);
    setShowWelcome(false);
  };

  // Get contextual suggestions based on current page
  const getContextualSuggestions = () => {
    const suggestions = {
      dashboard: [
        { icon: PlayCircle, title: 'Tour del Dashboard', action: 'dashboard-tour', description: 'Conoce las métricas principales' },
        { icon: Book, title: 'Vincular Instagram', action: 'link-instagram', description: 'Conecta tu cuenta de Instagram' },
        { icon: Lightbulb, title: 'Crear Evento', action: 'create-event', description: 'Aprende a crear tu primer evento' }
      ],
      eventos: [
        { icon: PlayCircle, title: 'Tour de Eventos', action: 'events-tour', description: 'Gestiona tus eventos' },
        { icon: Book, title: 'Estados de Eventos', action: 'event-states', description: 'Entiende cada estado' },
        { icon: Lightbulb, title: 'Asignar DJs', action: 'assign-djs', description: 'Asigna DJs a eventos' }
      ],
      instagram: [
        { icon: PlayCircle, title: 'Tour de Analytics', action: 'analytics-tour', description: 'Explora tus estadísticas' },
        { icon: Star, title: 'Predicciones', action: 'predictions-guide', description: 'Usa el sistema de predicciones' },
        { icon: FileText, title: 'Exportar PDF', action: 'export-pdf', description: 'Genera reportes' }
      ],
      djs: [
        { icon: PlayCircle, title: 'Tour de DJs', action: 'djs-tour', description: 'Gestiona tu equipo' },
        { icon: Book, title: 'Comparar DJs', action: 'compare-djs', description: 'Analiza rendimiento' },
        { icon: Lightbulb, title: 'Vincular Redes', action: 'link-social', description: 'Conecta redes sociales' }
      ]
    };

    return suggestions[currentPage] || suggestions.dashboard;
  };

  return (
    <>
      {/* Welcome Tooltip */}
      <AnimatePresence>
        {showWelcome && !hasSeenWelcome && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-50 max-w-sm"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6 shadow-2xl">
              <button
                onClick={closeWelcome}
                className="absolute top-3 right-3 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start space-x-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">¡Hola! 👋</h3>
                  <p className="text-white/90 text-sm">
                    Soy tu asistente virtual. Estoy aquí para ayudarte a aprovechar al máximo Intra Media System.
                  </p>
                </div>
              </div>

              <button
                onClick={openAssistant}
                className="w-full bg-white text-purple-600 font-semibold py-2 px-4 rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Comenzar Tour</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assistant Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:shadow-purple-500/50 transition-shadow"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-7 h-7" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="w-7 h-7" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification badge */}
        {!hasSeenWelcome && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Asistente Virtual</h3>
                  <p className="text-xs text-white/80">Aquí para ayudarte</p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {[
                { id: 'welcome', label: 'Inicio', icon: Sparkles },
                { id: 'quickStart', label: 'Guía Rápida', icon: PlayCircle },
                { id: 'faq', label: 'FAQ', icon: HelpCircle }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-2 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {activeTab === 'welcome' && <WelcomeTab suggestions={getContextualSuggestions()} />}
              {activeTab === 'quickStart' && <QuickStartTab />}
              {activeTab === 'faq' && <FAQTab />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Welcome Tab Component
const WelcomeTab = ({ suggestions }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Sugerencias para ti
        </h3>
        <div className="space-y-2">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <suggestion.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {suggestion.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {suggestion.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Consejo del día
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              Actualiza tus métricas de Instagram regularmente para obtener mejores predicciones y análisis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Start Tab Component
const QuickStartTab = () => {
  const guides = [
    {
      title: 'Configuración Inicial',
      steps: [
        'Vincula tu cuenta de Instagram',
        'Crea tu primer evento',
        'Añade DJs a tu equipo',
        'Explora el dashboard'
      ],
      icon: PlayCircle,
      color: 'purple'
    },
    {
      title: 'Analytics de Instagram',
      steps: [
        'Navega a la sección de DJs',
        'Haz clic en "Ver Instagram"',
        'Explora las 5 pestañas',
        'Usa las predicciones para mejorar'
      ],
      icon: Star,
      color: 'pink'
    },
    {
      title: 'Gestión de Eventos',
      steps: [
        'Ve a la sección Eventos',
        'Crea un nuevo evento',
        'Asigna DJs y clientes',
        'Gestiona cobros y pagos'
      ],
      icon: Video,
      color: 'blue'
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Sigue estas guías paso a paso para dominar Intra Media System
      </p>

      {guides.map((guide, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-3">
            <div className={`w-8 h-8 bg-${guide.color}-100 dark:bg-${guide.color}-900/20 rounded-lg flex items-center justify-center`}>
              <guide.icon className={`w-4 h-4 text-${guide.color}-600 dark:text-${guide.color}-400`} />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              {guide.title}
            </h4>
          </div>
          <ol className="space-y-2">
            {guide.steps.map((step, stepIdx) => (
              <li key={stepIdx} className="flex items-start space-x-2 text-xs">
                <span className={`flex-shrink-0 w-5 h-5 rounded-full bg-${guide.color}-100 dark:bg-${guide.color}-900/20 text-${guide.color}-600 dark:text-${guide.color}-400 flex items-center justify-center font-semibold`}>
                  {stepIdx + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300 pt-0.5">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
};

// FAQ Tab Component
const FAQTab = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      q: '¿Cómo vinculo mi cuenta de Instagram?',
      a: 'Ve a la sección DJs, selecciona un DJ y haz clic en "Link Account". Ingresa el username de Instagram y el sistema lo vinculará automáticamente.'
    },
    {
      q: '¿Qué significan las predicciones de engagement?',
      a: 'Las predicciones analizan tus datos históricos para proyectar crecimiento futuro, recomendar mejores horarios de publicación y sugerir hashtags efectivos.'
    },
    {
      q: '¿Cómo creo un evento?',
      a: 'Ve a la sección Eventos y haz clic en "Crear Evento". Completa los detalles del evento, asigna DJs y clientes, y guarda.'
    },
    {
      q: '¿Puedo comparar el rendimiento de varios DJs?',
      a: 'Sí, usa la función "Comparación de DJs" en la sección de Instagram Analytics para comparar métricas entre diferentes DJs.'
    },
    {
      q: '¿Cómo exporto un reporte en PDF?',
      a: 'En la vista de Instagram Analytics de cualquier DJ, haz clic en el botón "Exportar PDF" en la parte superior derecha.'
    },
    {
      q: '¿Las notificaciones son en tiempo real?',
      a: 'Las notificaciones se actualizan cada 2 minutos y detectan cambios significativos en tus métricas de Instagram automáticamente.'
    }
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Preguntas frecuentes sobre el uso del sistema
      </p>

      {faqs.map((faq, idx) => (
        <div
          key={idx}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
            className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-between"
          >
            <span className="font-medium text-sm text-gray-900 dark:text-white pr-2">
              {faq.q}
            </span>
            <ChevronRight
              className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                openFAQ === idx ? 'rotate-90' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {openFAQ === idx && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 pt-0 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                  {faq.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mt-4">
        <div className="flex items-start space-x-2">
          <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-1">
              ¿Necesitas más ayuda?
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              Explora la sección de Guía Rápida o inicia un tour guiado para aprender de forma interactiva.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualAssistant;
