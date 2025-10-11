import { FC, useState } from 'react';
import { Book, Play, FileText, Lightbulb, HelpCircle, Video, Download, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  module: string;
  duration: string;
  icon: any;
  steps: string[];
}

export const AyudaPage: FC = () => {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tutorials: Tutorial[] = [
    {
      id: 'auth',
      title: 'Iniciar Sesión y Roles',
      description: 'Aprende a acceder al sistema y entender los diferentes roles de usuario',
      module: 'Autenticación',
      duration: '2 min',
      icon: '🔐',
      steps: [
        'Ingresa tu usuario y contraseña en la pantalla de login',
        'El sistema validará tus credenciales y generará un token de acceso',
        'Serás redirigido al dashboard principal según tu rol',
        'ADMIN: Acceso total | GERENTE: Operaciones | RRHH: Personal | ENCARGADO: Turnos',
        'Tu sesión permanece activa durante 24 horas'
      ]
    },
    {
      id: 'eventos',
      title: 'Crear y Gestionar Eventos',
      description: 'Cómo planificar fiestas, conciertos y eventos en el club',
      module: 'Eventos',
      duration: '5 min',
      icon: '🎊',
      steps: [
        'Ve a la sección "Eventos y Fiestas" en el menú',
        'Haz clic en "+ Nuevo Evento"',
        'Completa los datos: nombre, fecha, tipo, capacidad y precios',
        'El evento se crea en estado "Planificado"',
        'Cámbialo a "Confirmado" cuando esté todo listo',
        'Usa filtros para ver eventos por estado o buscar por nombre'
      ]
    },
    {
      id: 'finanzas',
      title: 'Control de Ingresos y Gastos',
      description: 'Registra transacciones y analiza el balance financiero',
      module: 'Finanzas',
      duration: '4 min',
      icon: '💰',
      steps: [
        'Accede a "Ingresos y Gastos" desde el menú',
        'Haz clic en "+ Nueva Transacción"',
        'Selecciona el tipo: INGRESO o GASTO',
        'Elige la categoría correspondiente',
        'Introduce el monto, método de pago y descripción',
        'El sistema calcula automáticamente el balance y P&L',
        'Usa filtros por fecha para ver periodos específicos'
      ]
    },
    {
      id: 'personal',
      title: 'Gestionar Tu Equipo',
      description: 'Administra empleados, turnos y nóminas',
      module: 'Personal',
      duration: '6 min',
      icon: '👥',
      steps: [
        '1️⃣ EMPLEADOS: Ve a "Mi Equipo" > "+ Nuevo Empleado"',
        'Completa datos personales, puesto y salario base',
        '2️⃣ TURNOS: Registra jornadas en "Turnos y Jornadas"',
        'Introduce hora de entrada y salida (calcula horas automáticamente)',
        'Soporta turnos nocturnos (ej: 23:00 a 03:00 = 4 horas)',
        '3️⃣ NÓMINAS: Genera sueldos en "Sueldos"',
        'Usa "Generar Nóminas Masivas" para todo el mes',
        'Marca como "Pagada" cuando realices la transferencia'
      ]
    },
    {
      id: 'inventario',
      title: 'Control de Productos y Stock',
      description: 'Gestiona el inventario de bebidas y productos',
      module: 'Inventario',
      duration: '5 min',
      icon: '📦',
      steps: [
        'Ve a "Productos y Stock" en el menú',
        'Agrega productos con "+ Nuevo Producto"',
        'Establece stock mínimo para alertas automáticas',
        'Registra ENTRADAS cuando compres a proveedores',
        'Las SALIDAS se registran automáticamente con el POS',
        'Revisa "Alertas de Stock" para productos bajos',
        'Usa AJUSTES para correcciones de inventario'
      ]
    },
    {
      id: 'pos',
      title: 'Sistema POS - Punto de Venta',
      description: 'Realiza ventas en barra y gestiona la caja',
      module: 'POS',
      duration: '7 min',
      icon: '🖥️',
      steps: [
        '1️⃣ ABRIR SESIÓN: Ve a "POS" > "Abrir Caja"',
        'Selecciona empleado e introduce saldo inicial',
        '2️⃣ REALIZAR VENTAS: Busca productos o haz clic en ellos',
        'Se agregan al carrito con cantidad ajustable',
        'Revisa el total y selecciona método de pago',
        'Haz clic en EFECTIVO, TARJETA o MIXTO para cobrar',
        '3️⃣ DESCUENTO AUTOMÁTICO: El stock se reduce solo',
        '4️⃣ CERRAR SESIÓN: "Cerrar Caja" al final del turno',
        'Revisa el resumen de ventas y cuadre de caja',
        'Registra observaciones si hay diferencias'
      ]
    },
    {
      id: 'botellas',
      title: 'Botellas VIP - Gestión Avanzada',
      description: 'Controla botellas abiertas con tracking de copas',
      module: 'Botellas VIP',
      duration: '6 min',
      icon: '🍾',
      steps: [
        '1️⃣ ABRIR BOTELLA: Ve a "Botellas VIP" > "+ Abrir Botella"',
        'Selecciona producto (debe ser tipo botella)',
        'Elige ubicación (Barra Principal, Barra VIP, etc.)',
        'El stock cerrado se reduce automáticamente',
        '2️⃣ SERVIR COPAS: Vende copas individuales desde el POS',
        'El sistema descuenta del contador de copas',
        '3️⃣ MONITOREAR: El dashboard muestra alertas',
        '🔴 Vacía: 0 copas | 🟡 Casi vacía: <20% | 🟠 +24h abierta',
        '4️⃣ CERRAR: Marca como "Terminada" o "Desperdiciada"',
        'Revisa ingresos generados vs potenciales'
      ]
    },
    {
      id: 'analytics',
      title: 'Análisis del Negocio',
      description: 'Visualiza métricas y genera reportes',
      module: 'Analytics',
      duration: '4 min',
      icon: '📊',
      steps: [
        'Accede al "Dashboard" para ver métricas en tiempo real',
        'Auto-refresh cada 30 segundos para datos actualizados',
        'Ve a "Análisis del Negocio" para reportes detallados',
        'Filtra por periodos de tiempo',
        'Exporta reportes a Excel o PDF con un clic',
        'Analiza productos más vendidos y horarios pico',
        'Revisa rendimiento de empleados y ROI de eventos'
      ]
    }
  ];

  const filteredTutorials = tutorials.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.module.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Centro de Ayuda</h1>
            <p className="text-blue-100">Aprende a usar todas las funcionalidades del sistema</p>
          </div>
          <HelpCircle className="h-16 w-16 opacity-80" />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <a
          href="/ayuda/presentacion"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
        >
          <Book className="h-10 w-10 text-blue-500 mb-3" />
          <h3 className="font-semibold text-lg mb-2">Presentación Completa</h3>
          <p className="text-sm text-gray-600">Guía visual de todas las funcionalidades</p>
        </a>

        <button
          onClick={() => window.open('/PRESENTACION_SISTEMA.html', '_blank')}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left border-l-4 border-green-500"
        >
          <Play className="h-10 w-10 text-green-500 mb-3" />
          <h3 className="font-semibold text-lg mb-2">Ver Presentación</h3>
          <p className="text-sm text-gray-600">Abre la presentación visual en nueva pestaña</p>
        </button>

        <a
          href="/docs"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500"
        >
          <FileText className="h-10 w-10 text-purple-500 mb-3" />
          <h3 className="font-semibold text-lg mb-2">Documentación</h3>
          <p className="text-sm text-gray-600">Referencias técnicas y APIs</p>
        </a>

        <a
          href="/ayuda/novedades"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-orange-500"
        >
          <Lightbulb className="h-10 w-10 text-orange-500 mb-3" />
          <h3 className="font-semibold text-lg mb-2">Novedades</h3>
          <p className="text-sm text-gray-600">Últimas actualizaciones y mejoras</p>
        </a>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="🔍 Buscar tutorial o funcionalidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button variant="outline">Buscar</Button>
        </div>
      </div>

      {/* Tutorials Grid */}
      {!selectedTutorial ? (
        <>
          <h2 className="text-2xl font-bold text-gray-900">Tutoriales Paso a Paso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map(tutorial => (
              <div
                key={tutorial.id}
                className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                onClick={() => setSelectedTutorial(tutorial)}
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                  <div className="text-5xl mb-3">{tutorial.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{tutorial.title}</h3>
                  <p className="text-sm text-blue-100">{tutorial.module}</p>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4 text-sm">{tutorial.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Play className="h-3 w-3 mr-1" />
                      {tutorial.duration}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      {tutorial.steps.length} pasos
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        // Tutorial Detail
        <div className="bg-white rounded-lg shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <button
              onClick={() => setSelectedTutorial(null)}
              className="mb-4 text-white hover:text-blue-200 flex items-center"
            >
              ← Volver a tutoriales
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-6xl">{selectedTutorial.icon}</div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{selectedTutorial.title}</h2>
                <p className="text-blue-100 text-lg">{selectedTutorial.description}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    📁 {selectedTutorial.module}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    ⏱️ {selectedTutorial.duration}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Pasos a Seguir</h3>
            <div className="space-y-4">
              {selectedTutorial.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-gray-700 leading-relaxed">{step}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-green-50 border-l-4 border-green-500 rounded">
              <h4 className="font-semibold text-green-900 mb-2">✅ ¡Listo para practicar!</h4>
              <p className="text-green-800">
                Ahora que conoces los pasos, ve al módulo correspondiente y practica.
                Recuerda que puedes volver a esta guía cuando lo necesites.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Resources */}
      {!selectedTutorial && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Recursos Adicionales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <Video className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Video Tutoriales</h4>
                <p className="text-sm text-gray-600">Próximamente: tutoriales en video</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <Download className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Guías en PDF</h4>
                <p className="text-sm text-gray-600">Descarga manuales para imprimir</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <ExternalLink className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Soporte Técnico</h4>
                <p className="text-sm text-gray-600">Contacta con el equipo de soporte</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
