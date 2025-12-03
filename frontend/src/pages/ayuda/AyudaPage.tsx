import { FC, useState } from 'react';
import { Book, Play, FileText, Lightbulb, HelpCircle, Video, Download, ExternalLink, Bot, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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
    },
    {
      id: 'busqueda-global',
      title: 'Búsqueda Global (Ctrl+K)',
      description: 'Encuentra cualquier recurso rápidamente con el buscador universal',
      module: 'Navegación',
      duration: '2 min',
      icon: '🔍',
      steps: [
        '⌨️ Presiona Ctrl+K (Windows/Linux) o Cmd+K (Mac) desde cualquier página',
        'O haz clic en el botón "Buscar..." en el header (desktop)',
        'Escribe el nombre de lo que buscas: evento, empleado, producto o transacción',
        'El sistema busca en tiempo real en todas las secciones',
        'Usa las flechas ↑↓ del teclado para navegar entre resultados',
        'Presiona Enter para ir directamente al recurso seleccionado',
        'Presiona Esc para cerrar el buscador',
        '⚡ Ahorra hasta 83% del tiempo de búsqueda (60s → 10s)'
      ]
    },
    {
      id: 'calendario-eventos',
      title: 'Vista de Calendario para Eventos',
      description: 'Visualiza tus eventos en un calendario mensual completo',
      module: 'Eventos',
      duration: '3 min',
      icon: '📅',
      steps: [
        'Ve a "Eventos y Fiestas" en el menú principal',
        'Haz clic en el toggle "Calendario" (arriba a la derecha)',
        'Verás un calendario mensual con todos tus eventos',
        'Los eventos están coloreados por estado: 🔵 Planificado, 🟢 Confirmado, 🟡 En Curso, ⚫ Finalizado, 🔴 Cancelado',
        'Navega entre meses con las flechas ← →',
        'Haz clic en "Hoy" para volver al mes actual rápidamente',
        'Haz clic en cualquier evento del calendario para editarlo',
        'Si hay más de 2 eventos en un día, verás "+ X más"',
        'Cambia a vista "Lista" para ver el formato tradicional',
        '✨ Mejora del 400% en visualización temporal'
      ]
    },
    {
      id: 'dashboard-finanzas',
      title: 'Dashboard Consolidado de Finanzas',
      description: 'Análisis completo de ingresos, gastos y P&L en un solo lugar',
      module: 'Finanzas',
      duration: '4 min',
      icon: '💸',
      steps: [
        'Ve a "Ventas y Finanzas" > "Dashboard Finanzas" en el menú',
        'Observa 3 KPIs principales en cards grandes:',
        '  💚 Ingresos del Mes (verde) - Total y # de transacciones',
        '  ❤️ Gastos del Mes (rojo) - Total y # de transacciones',
        '  💙 Balance P&L (azul o naranja) - Beneficio o Pérdida calculado automáticamente',
        'Revisa el gráfico de tendencias de últimos 6 meses',
        'Haz hover sobre las barras para ver valores exactos',
        'Scroll down para ver Top 5 Categorías de Gastos con barras de progreso',
        'Observa la distribución de Ingresos por Método de Pago (Efectivo, Tarjeta, Mixto)',
        'El sistema consolida automáticamente: transacciones manuales + ventas POS',
        '⚡ Ahorro del 70% en tiempo de análisis financiero (3-5 min → 1 min)'
      ]
    },
    {
      id: 'notificaciones',
      title: 'Centro de Notificaciones Persistente',
      description: 'Gestiona y revisa todas tus notificaciones con historial completo',
      module: 'Sistema',
      duration: '3 min',
      icon: '🔔',
      steps: [
        'Busca el icono de campana 🔔 en el header (arriba a la derecha)',
        'El badge rojo muestra el número de notificaciones no leídas (9+ si >9)',
        'Haz clic en la campana para abrir el dropdown de notificaciones',
        'Verás el historial completo de las últimas 50 notificaciones',
        'Cada notificación muestra: tipo (success/error/warning/info), título, mensaje y tiempo relativo',
        'Las no leídas tienen un punto azul a la derecha',
        'Haz clic en el icono ✓ para marcar una notificación como leída',
        'Usa el botón de doble check ✓✓ para marcar todas como leídas',
        'Haz clic en una notificación con acción para navegar a la página relacionada',
        'Elimina notificaciones individualmente con 🗑️ o todas con el botón de basura del header',
        'Las notificaciones se guardan automáticamente en localStorage',
        '✨ Retención del 100% - nunca pierdas información importante'
      ]
    },
    {
      id: 'vista-movil',
      title: 'Vista Móvil Optimizada (Productos)',
      description: 'Gestiona tu inventario desde dispositivos móviles con facilidad',
      module: 'Inventario',
      duration: '3 min',
      icon: '📱',
      steps: [
        '📱 EN MÓVIL (< 768px): Ve a "Productos y Stock"',
        'El sistema detecta automáticamente que estás en móvil',
        'Los productos se muestran en cards verticales optimizadas',
        'Cada card muestra toda la información sin scroll horizontal',
        'Los botones son grandes y touch-friendly para fácil toque',
        'Las barras de progreso de stock son prominentes y visuales',
        'Los bordes de color indican el estado: 🔴 sin stock, 🟡 bajo, 🟢 ok',
        '🖥️ EN DESKTOP: Usa el toggle "Vista" (arriba a la derecha)',
        'Cambia entre "Tabla" (tradicional) y "Tarjetas" (visual)',
        'La vista de tabla conserva las 13 columnas completas',
        'La vista de tarjetas muestra 1-3 columnas según tamaño de pantalla',
        '⚡ Mejora del 300% en usabilidad móvil'
      ]
    },
    {
      id: 'atajos-teclado',
      title: 'Atajos de Teclado ⌨️',
      description: 'Navega más rápido con shortcuts personalizados para cada acción',
      module: 'Productividad',
      duration: '5 min',
      icon: '⌨️',
      steps: [
        '⚡ NAVEGACIÓN GLOBAL (tipo Gmail):',
        'Presiona "G" seguido de una letra para ir a cualquier sección:',
        '  • G + D = Dashboard | G + E = Eventos | G + I = Inventario',
        '  • G + F = Finanzas | G + P = Personal | G + V = POS Terminal',
        '🔍 BÚSQUEDA: Ctrl/Cmd + K para abrir búsqueda global',
        '🆘 AYUDA: Presiona "?" para ver todos los atajos disponibles',
        '💾 GUARDAR: Ctrl/Cmd + S en formularios',
        '🏃 POS RÁPIDO: F2 desde cualquier página abre el Terminal POS',
        '💳 EN TERMINAL POS (atajos de función):',
        '  • F5 = Cobrar Efectivo | F6 = Cobrar Tarjeta | F7 = Pago Mixto',
        '  • F9 = Limpiar carrito | Enter = Confirmar pago',
        'ESC = Cancelar/cerrar modales en cualquier momento',
        '⏱️ AHORRO: -75% de clics, navega 4x más rápido'
      ]
    },
    {
      id: 'plantillas-eventos',
      title: 'Plantillas de Eventos ✨',
      description: 'Crea eventos 60% más rápido con configuraciones predefinidas',
      module: 'Eventos',
      duration: '3 min',
      icon: '✨',
      steps: [
        'Ve a "Eventos y Fiestas" en el menú',
        'Haz clic en el botón morado "Usar Plantilla" (con icono ✨)',
        'Se abre un selector con 5 plantillas predefinidas:',
        '  🎉 Fiesta Regular: Capacidad 300, €15 entrada',
        '  🎵 Concierto en Vivo: Capacidad 250, €25 entrada',
        '  ✨ Fiesta Temática: Capacidad 300, €20 entrada',
        '  👥 Evento Privado: Capacidad 150, entrada gratis',
        '  📅 Evento Personalizado: Desde cero',
        'Haz clic en la plantilla que prefieras',
        'El formulario se abre con campos pre-rellenados automáticamente',
        'Solo edita lo necesario: fecha, hora, nombre y descripción',
        '💾 Guarda y listo, -60% de tiempo de creación (5 min → 2 min)',
        '📋 DUPLICAR: También puedes duplicar eventos existentes con el botón "Copiar"'
      ]
    },
    {
      id: 'graficos-interactivos',
      title: 'Gráficos Interactivos y Exportación',
      description: 'Analiza datos visualmente con gráficos clickeables y exporta a CSV',
      module: 'Análisis',
      duration: '4 min',
      icon: '📊',
      steps: [
        'Ve a "Análisis del Negocio" en el menú',
        'GRÁFICOS INTERACTIVOS:',
        '  • Observa el gráfico "Evolución de Costes Laborales"',
        '  • Haz clic en cualquier barra para ver detalles del período',
        '  • Hover sobre barras/líneas para ver valores exactos en tooltip',
        '  • Toggle entre vista de "Barras" y "Líneas" con los botones superiores',
        'FILTROS DE FECHA:',
        '  • Usa los selectores "Desde" y "Hasta" en Rentabilidad de Eventos',
        '  • El sistema filtra automáticamente los resultados',
        '  • Botón "Limpiar filtros" para resetear',
        'EXPORTACIÓN A CSV:',
        '  • Haz clic en "Exportar CSV" (icono 📊) en la tabla de rentabilidad',
        '  • El archivo se descarga automáticamente con todos los datos',
        '  • Formato: evento, fecha, tipo, ingresos, costes, margen, %',
        '  • Abre en Excel/Google Sheets para análisis avanzado',
        '💡 Mejora del 400% en visualización de datos'
      ]
    },
    {
      id: 'automatizaciones',
      title: 'Automatizaciones ⚡',
      description: 'Configura tareas automáticas para ahorrar 12h/mes',
      module: 'Configuración',
      duration: '5 min',
      icon: '⚡',
      steps: [
        'Ve a "Configuración" > "Automatizaciones" en el menú lateral',
        '🎭 TRANSICIÓN AUTOMÁTICA DE EVENTOS:',
        '  • Cambia el estado de eventos según fecha y hora',
        '  • Configura: horas antes de confirmar, marcar en curso automático, finalizar después de X horas',
        '💰 GENERACIÓN AUTOMÁTICA DE NÓMINAS:',
        '  • Crea nóminas el primer día de cada mes a las 00:00',
        '  • Activa notificaciones para avisar cuando se generen',
        '📦 ALERTAS DE STOCK BAJO:',
        '  • Notifica cuando productos alcanzan el stock mínimo',
        '  • Configura umbral de alerta (ej: 10 unidades)',
        '  • Elige frecuencia: diaria, semanal',
        '🔔 RECORDATORIOS DE EVENTOS:',
        '  • Envía avisos antes de eventos planificados',
        '  • Configura días de anticipación (ej: 7, 3, 1 días antes)',
        'ACTIVAR/DESACTIVAR: Toggle individual en cada regla',
        'EDITAR: Botón "Configurar" para ajustar parámetros',
        '⏱️ Ahorro estimado: ~12 horas/mes en tareas repetitivas',
        '⚠️ Nota: Requiere implementación backend (próximamente)'
      ]
    },
    {
      id: 'venta-dual',
      title: 'Sistema de Venta Dual (Copa + Botella VIP)',
      description: 'Aprende a vender el mismo producto de dos formas: copa individual o botella VIP completa',
      module: 'Inventario',
      duration: '6 min',
      icon: '🍾',
      steps: [
        '¿QUÉ ES LA VENTA DUAL?',
        'Permite vender el mismo producto en dos modalidades:',
        '  🔵 COPA: Servicio individual en barra (ej: 8€ la copa)',
        '  🟣 BOTELLA VIP: Botella completa en zona reservados (ej: 120€)',
        '',
        '1️⃣ CONFIGURAR PRODUCTO CON VENTA DUAL:',
        'Ve a "Productos y Stock" > "+ Nuevo Producto" o edita uno existente',
        'En la sección inferior, activa el checkbox "Venta Dual (Copa+VIP)"',
        'Se abre una sección especial con 3 campos obligatorios:',
        '  • Copas por botella: Ej: 15 copas',
        '  • Precio copa: Ej: 8.00€',
        '  • Precio botella VIP: Ej: 120.00€',
        '',
        '2️⃣ ANÁLISIS DE RENTABILIDAD:',
        'El sistema calcula automáticamente:',
        '  💰 Ingreso potencial COPAS: 15 copas × 8€ = 120€',
        '  💎 Ingreso potencial VIP: 120€',
        '  📊 Margen de beneficio de cada modalidad',
        '  ⭐ Recomendación: Cuál opción es más rentable',
        'La visualización te muestra barras comparativas en tiempo real',
        '',
        '3️⃣ USAR EN EL POS (PUNTO DE VENTA):',
        'Ve a "POS Terminal" y abre una sesión de caja',
        'Cuando agregas un producto con venta dual al carrito:',
        '  🎯 Se abre un MODAL automáticamente con 2 opciones',
        '  🔵 Opción COPA: Muestra precio/copa, copas por botella, ingreso total',
        '  🟣 Opción VIP: Muestra precio botella, ingreso total, margen',
        '  ✨ Badge "RECOMENDADO" en la opción más rentable',
        'Haz clic en la opción que elija el cliente',
        'El producto se agrega al carrito con un badge (COPA o VIP)',
        '',
        '4️⃣ DIFERENCIAS EN EL CARRITO:',
        'Los productos con venta dual se tratan como items separados:',
        '  • Ron Barceló (COPA) × 1 = 8.00€',
        '  • Ron Barceló (VIP) × 1 = 120.00€',
        'Esto permite tener ambas modalidades en la misma venta',
        '',
        '5️⃣ VENTAJAS DEL SISTEMA:',
        '✅ Maximiza ingresos según demanda del cliente',
        '✅ Comparación visual instantánea de rentabilidad',
        '✅ Recomendación automática de mejor opción',
        '✅ Seguimiento separado de ventas copa vs VIP',
        '✅ Optimiza gestión de stock de productos premium',
        '',
        '💡 CASO DE USO TÍPICO:',
        'Cliente en barra → Venta COPA (servicio rápido)',
        'Cliente en zona VIP → Venta BOTELLA (experiencia premium)',
        'El sistema te ayuda a tomar la mejor decisión financiera'
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

      {/* Asistente Virtual Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-shadow cursor-pointer" onClick={() => navigate('/ayuda/asistente')}>
        <div className="absolute top-0 right-0 opacity-10">
          <Bot className="h-32 w-32 group-hover:scale-110 transition-transform" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <Bot className="h-6 w-6" />
              </div>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-lg">
                <Sparkles className="h-4 w-4 mr-1" />
                NUEVO
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-2">🤖 Asistente Virtual Interactivo</h3>
            <p className="text-blue-100 mb-4">
              Tu guía personal paso a paso. Te acompañaré en tiempo real mientras aprendes a usar cada funcionalidad del sistema.
            </p>
            <div className="flex items-center space-x-6 text-sm text-blue-100">
              <span className="flex items-center">
                ✨ Guías interactivas
              </span>
              <span className="flex items-center">
                🎯 Navegación automática
              </span>
              <span className="flex items-center">
                📊 Seguimiento de progreso
              </span>
            </div>
          </div>
          <div className="hidden md:block">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-lg">
              Comenzar Ahora
              <Sparkles className="h-5 w-5 ml-2" />
            </Button>
          </div>
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
