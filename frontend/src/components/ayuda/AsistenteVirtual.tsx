import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  ChevronRight,
  ChevronLeft,
  Check,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';

interface Step {
  id: number;
  title: string;
  description: string;
  action?: string;
  route?: string;
  tip?: string;
  image?: string;
}

interface GuidedTour {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  estimatedTime: string;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado';
  steps: Step[];
}

interface AsistenteVirtualProps {
  onClose?: () => void;
}

export const AsistenteVirtual: FC<AsistenteVirtualProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [selectedTour, setSelectedTour] = useState<GuidedTour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const tours: GuidedTour[] = [
    {
      id: 'first-steps',
      title: 'Primeros Pasos en el Sistema',
      description: 'Te guiaré paso a paso para conocer las funciones básicas',
      icon: '🚀',
      category: 'Introducción',
      estimatedTime: '5 min',
      difficulty: 'Fácil',
      steps: [
        {
          id: 1,
          title: 'Bienvenido al Club Management System',
          description: 'Hola! Soy tu asistente virtual. Estoy aquí para ayudarte a aprender a usar el sistema de forma rápida y sencilla.',
          tip: 'Puedes pausar esta guía en cualquier momento y volver cuando quieras'
        },
        {
          id: 2,
          title: 'Explora el Dashboard',
          description: 'El Dashboard es tu punto de partida. Aquí verás un resumen de todo lo importante: ventas del día, inventario, eventos próximos y más.',
          route: '/dashboard',
          action: 'Ver Dashboard',
          tip: 'El dashboard se actualiza automáticamente cada 30 segundos'
        },
        {
          id: 3,
          title: 'Navega por el Menú Lateral',
          description: 'En el lado izquierdo encontrarás el menú principal. Está organizado por categorías: Punto de Venta, Inventario, Finanzas, Personal y más.',
          tip: 'Haz clic en cualquier opción del menú para explorar esa sección'
        },
        {
          id: 4,
          title: 'Prueba el Sistema POS',
          description: 'El POS (Punto de Venta) es donde registras las ventas. Es rápido, intuitivo y funciona en cualquier dispositivo.',
          route: '/pos',
          action: 'Ir al POS',
          tip: 'Primero debes abrir una sesión de caja antes de hacer ventas'
        },
        {
          id: 5,
          title: '¡Listo para Empezar!',
          description: 'Ya conoces lo básico. Ahora puedes explorar el sistema por tu cuenta o elegir otro tutorial específico.',
          tip: 'Siempre puedes volver al Centro de Ayuda desde el menú lateral'
        }
      ]
    },
    {
      id: 'pos-complete',
      title: 'Domina el Sistema POS',
      description: 'Aprende a realizar ventas, gestionar caja y cerrar sesiones',
      icon: '🖥️',
      category: 'Punto de Venta',
      estimatedTime: '8 min',
      difficulty: 'Intermedio',
      steps: [
        {
          id: 1,
          title: 'Preparación: Abre una Sesión de Caja',
          description: 'Antes de vender, debes abrir la caja. Ve a POS Dashboard y haz clic en "Abrir Sesión". Selecciona el empleado responsable e introduce el saldo inicial.',
          route: '/pos-dashboard',
          action: 'Ir a POS Dashboard',
          tip: 'El saldo inicial debe coincidir con el efectivo físico en la caja'
        },
        {
          id: 2,
          title: 'Agregar Productos a la Venta',
          description: 'En la pantalla POS, busca productos por nombre o categoría. Haz clic en un producto para agregarlo al carrito. Puedes ajustar la cantidad con los botones + y -.',
          route: '/pos',
          action: 'Ir al POS',
          tip: 'Usa el buscador para encontrar productos rápidamente'
        },
        {
          id: 3,
          title: 'Selecciona el Método de Pago',
          description: 'Una vez agregados los productos, revisa el total. Selecciona el método de pago: Efectivo, Tarjeta o Mixto (combinación de ambos).',
          tip: 'En pago mixto, puedes especificar cuánto se paga en efectivo y cuánto con tarjeta'
        },
        {
          id: 4,
          title: 'Confirma la Venta',
          description: 'Haz clic en el botón del método de pago elegido. El sistema registrará la venta, descontará el stock automáticamente y mostrará un resumen.',
          tip: 'Puedes imprimir o enviar el ticket al cliente'
        },
        {
          id: 5,
          title: 'Monitorea tu Sesión',
          description: 'Durante el día, ve al POS Dashboard para ver las estadísticas de tu sesión: ventas totales, tickets, productos vendidos y métodos de pago.',
          route: '/pos-dashboard',
          action: 'Ver Estadísticas'
        },
        {
          id: 6,
          title: 'Cierra la Sesión al Final del Día',
          description: 'Cuando termines tu turno, ve a POS Dashboard > Sesiones y haz clic en "Cerrar Sesión". Revisa el cuadre de caja y registra cualquier observación.',
          tip: 'Es importante cerrar la sesión para tener un control preciso de cada turno'
        }
      ]
    },
    {
      id: 'inventory-basics',
      title: 'Gestiona tu Inventario',
      description: 'Control de productos, stock, alertas y movimientos',
      icon: '📦',
      category: 'Inventario',
      estimatedTime: '6 min',
      difficulty: 'Fácil',
      steps: [
        {
          id: 1,
          title: 'Visualiza tu Inventario Actual',
          description: 'Ve a "Inventario" en el menú. Aquí verás todos tus productos con su stock actual, precio de venta y estado.',
          route: '/inventario',
          action: 'Ver Inventario',
          tip: 'Los productos con stock bajo aparecen resaltados en rojo'
        },
        {
          id: 2,
          title: 'Agrega un Nuevo Producto',
          description: 'Haz clic en "+ Nuevo Producto". Completa la información: nombre, categoría, precio de compra, precio de venta, stock inicial y stock mínimo.',
          tip: 'El stock mínimo activa alertas automáticas cuando el inventario baja de ese nivel'
        },
        {
          id: 3,
          title: 'Registra una Entrada de Stock',
          description: 'Cuando compres productos a proveedores, ve a "Movimientos" > "+ Entrada". Selecciona el producto, cantidad y motivo (Compra a proveedor).',
          route: '/movimientos-stock',
          action: 'Ver Movimientos',
          tip: 'Cada movimiento queda registrado con fecha, cantidad y motivo'
        },
        {
          id: 4,
          title: 'Revisa las Alertas de Stock',
          description: 'Ve a "Alertas" para ver qué productos necesitan reposición. El sistema te avisa automáticamente cuando el stock es bajo.',
          route: '/alertas-stock',
          action: 'Ver Alertas',
          tip: 'Puedes configurar notificaciones para recibir alertas por email'
        },
        {
          id: 5,
          title: 'Consulta el Dashboard de Inventario',
          description: 'El Dashboard de Inventario te muestra gráficos y métricas: valor total del inventario, productos más vendidos, movimientos recientes y alertas.',
          route: '/inventario/dashboard',
          action: 'Ver Dashboard',
          tip: 'Usa los filtros de fecha para analizar periodos específicos'
        }
      ]
    },
    {
      id: 'financial-control',
      title: 'Control Financiero',
      description: 'Registra ingresos, gastos y analiza tu balance',
      icon: '💰',
      category: 'Finanzas',
      estimatedTime: '5 min',
      difficulty: 'Intermedio',
      steps: [
        {
          id: 1,
          title: 'Accede al Módulo de Finanzas',
          description: 'Ve a "Finanzas" en el menú. Aquí verás todas las transacciones: ingresos (ventas, eventos) y gastos (compras, sueldos, servicios).',
          route: '/finanzas',
          action: 'Ir a Finanzas',
          tip: 'El sistema calcula automáticamente tu balance (ingresos - gastos)'
        },
        {
          id: 2,
          title: 'Registra un Ingreso',
          description: 'Haz clic en "+ Nueva Transacción". Selecciona tipo INGRESO, elige la categoría (Venta, Evento, Otro), introduce el monto y descripción.',
          tip: 'Las ventas del POS se registran automáticamente como ingresos'
        },
        {
          id: 3,
          title: 'Registra un Gasto',
          description: 'Para registrar gastos, selecciona tipo GASTO. Elige la categoría (Compra, Sueldo, Servicio, Otro), monto y descripción.',
          tip: 'Asocia los gastos con proveedores y empleados para mejor trazabilidad'
        },
        {
          id: 4,
          title: 'Analiza tu Profit & Loss (P&L)',
          description: 'El sistema calcula automáticamente tu P&L: Ingresos totales, Gastos totales y Balance (ganancia o pérdida). Filtra por periodos para analizar.',
          tip: 'Usa los filtros de fecha para ver tu P&L mensual, semanal o anual'
        },
        {
          id: 5,
          title: 'Exporta Reportes Financieros',
          description: 'Puedes exportar tus transacciones y balance a Excel o PDF. Útil para contabilidad, impuestos y análisis detallado.',
          tip: 'Programa exportaciones automáticas mensuales para tu contador'
        }
      ]
    }
  ];

  const handleStartTour = (tour: GuidedTour) => {
    setSelectedTour(tour);
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsPlaying(false);
  };

  const handleNextStep = () => {
    if (selectedTour && currentStep < selectedTour.steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  const handleNavigateToRoute = (route: string) => {
    if (route) {
      navigate(route);
      handleCompleteStep();
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsPlaying(false);
  };

  const progressPercentage = selectedTour
    ? ((completedSteps.length / selectedTour.steps.length) * 100).toFixed(0)
    : 0;

  if (!selectedTour) {
    return (
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Bot className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Asistente Virtual</h1>
                <p className="text-blue-100">Te guiaré paso a paso en el uso del sistema</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-6">
              <p className="text-sm">
                👋 ¡Hola! Soy tu asistente personal. Selecciona una guía interactiva y te llevaré paso a paso
                a través de cada funcionalidad del sistema. Puedes pausar, retroceder o saltar en cualquier momento.
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 opacity-10">
            <Bot className="h-64 w-64" />
          </div>
        </div>

        {/* Tours Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Guías Interactivas Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500 overflow-hidden"
                onClick={() => handleStartTour(tour)}
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="text-5xl mb-3">{tour.icon}</div>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      tour.difficulty === 'Fácil' ? 'bg-green-500' :
                      tour.difficulty === 'Intermedio' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}>
                      {tour.difficulty}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tour.title}</h3>
                  <p className="text-sm text-blue-100">{tour.category}</p>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">{tour.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Play className="h-4 w-4 mr-1" />
                        {tour.estimatedTime}
                      </span>
                      <span className="flex items-center">
                        <Lightbulb className="h-4 w-4 mr-1" />
                        {tour.steps.length} pasos
                      </span>
                    </div>
                    <Button size="sm" className="group">
                      Comenzar
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Consejos para Aprovechar al Máximo las Guías
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Sigue los pasos en orden para una experiencia de aprendizaje óptima</li>
            <li>• Usa los botones de navegación para avanzar o retroceder a tu ritmo</li>
            <li>• Los botones de acción te llevarán directamente a la pantalla correspondiente</li>
            <li>• Marca los pasos como completados para hacer seguimiento de tu progreso</li>
            <li>• Puedes pausar y continuar en cualquier momento</li>
          </ul>
        </div>
      </div>
    );
  }

  const currentStepData = selectedTour.steps[currentStep];
  const isLastStep = currentStep === selectedTour.steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedTour(null)}
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Volver a Guías
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Progreso:</span>
            <span className="font-bold text-blue-600">{progressPercentage}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Paso {currentStep + 1} de {selectedTour.steps.length}</span>
          <span>{selectedTour.estimatedTime} estimado</span>
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl">
              {currentStep + 1}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{currentStepData.title}</h2>
              <span className="text-sm text-blue-100">{selectedTour.title}</span>
            </div>
            {completedSteps.includes(currentStep) && (
              <div className="flex-shrink-0">
                <div className="bg-green-500 rounded-full p-2">
                  <Check className="h-6 w-6" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {currentStepData.description}
            </p>
          </div>

          {currentStepData.tip && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">💡 Consejo</h4>
                  <p className="text-sm text-yellow-800">{currentStepData.tip}</p>
                </div>
              </div>
            </div>
          )}

          {currentStepData.route && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <Button
                onClick={() => handleNavigateToRoute(currentStepData.route!)}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                {currentStepData.action || 'Ir a esta sección'}
              </Button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleReset}
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
              {!completedSteps.includes(currentStep) && (
                <Button
                  variant="outline"
                  onClick={handleCompleteStep}
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Marcar como completado
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={isFirstStep}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              {!isLastStep ? (
                <Button onClick={handleNextStep}>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => setSelectedTour(null)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Finalizar Guía
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Steps Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Todos los Pasos</h3>
        <div className="space-y-2">
          {selectedTour.steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                index === currentStep
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : completedSteps.includes(index)
                  ? 'bg-green-50 border border-green-300'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index === currentStep
                  ? 'bg-blue-500 text-white'
                  : completedSteps.includes(index)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {completedSteps.includes(index) ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`text-sm ${
                index === currentStep ? 'font-semibold text-blue-900' : 'text-gray-700'
              }`}>
                {step.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
