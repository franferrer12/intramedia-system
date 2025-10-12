import { TourStep } from './InteractiveTour';

// Tour para el Dashboard
export const dashboardTour: TourStep[] = [
  {
    target: '[data-tour="dashboard-title"]',
    title: '¡Bienvenido al Dashboard!',
    content: 'Este es tu panel principal donde verás un resumen completo de tu negocio en tiempo real.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="kpi-ingresos"]',
    title: 'Ingresos del Mes',
    content: 'Aquí ves todos los ingresos acumulados del mes actual. Se actualiza automáticamente cada 30 segundos.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="kpi-gastos"]',
    title: 'Gastos del Mes',
    content: 'Total de gastos del mes, incluyendo nóminas, proveedores y servicios.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="kpi-balance"]',
    title: 'Balance (Beneficio)',
    content: 'El cálculo automático de Ingresos - Gastos. Este es tu beneficio neto del mes.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="grafico-ventas"]',
    title: 'Gráfico de Ventas',
    content: 'Visualiza la evolución de tus ingresos y gastos a lo largo del tiempo.',
    placement: 'top'
  }
];

// Tour para Eventos
export const eventosTour: TourStep[] = [
  {
    target: '[data-tour="eventos-title"]',
    title: 'Gestión de Eventos',
    content: 'Aquí puedes crear, editar y gestionar todos los eventos de tu club: fiestas, conciertos, eventos privados, etc.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="btn-nuevo-evento"]',
    title: 'Crear Nuevo Evento',
    content: 'Haz clic aquí para crear un evento nuevo. Se abrirá un formulario donde podrás configurar todos los detalles.',
    placement: 'bottom',
    action: 'Ver formulario'
  },
  {
    target: '[data-tour="search-eventos"]',
    title: 'Buscar Eventos',
    content: 'Usa este buscador para encontrar eventos rápidamente por nombre o tipo.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="filtro-estado"]',
    title: 'Filtrar por Estado',
    content: 'Filtra eventos por su estado: Planificado, Confirmado, Cancelado o Completado.',
    placement: 'left'
  },
  {
    target: '[data-tour="tabla-eventos"]',
    title: 'Lista de Eventos',
    content: 'Todos tus eventos aparecen aquí. Haz clic en cualquiera para ver detalles o editarlo.',
    placement: 'top'
  }
];

// Tour para Finanzas
export const finanzasTour: TourStep[] = [
  {
    target: '[data-tour="finanzas-title"]',
    title: 'Control de Ingresos y Gastos',
    content: 'Registra todas las transacciones financieras y mantén el control total del dinero.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="cards-resumen"]',
    title: 'Resumen Financiero',
    content: 'Ve de un vistazo los totales de ingresos, gastos y balance del periodo seleccionado.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="btn-nueva-transaccion"]',
    title: 'Nueva Transacción',
    content: 'Registra un nuevo ingreso o gasto. El sistema calculará automáticamente el impacto en el balance.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="filtros-fecha"]',
    title: 'Filtrar por Fecha',
    content: 'Cambia el periodo para ver transacciones de otros meses o rangos personalizados.',
    placement: 'left'
  },
  {
    target: '[data-tour="filtro-tipo"]',
    title: 'Filtrar por Tipo',
    content: 'Muestra solo ingresos, solo gastos, o ambos.',
    placement: 'left'
  },
  {
    target: '[data-tour="exportar-excel"]',
    title: 'Exportar a Excel',
    content: 'Descarga un reporte completo en Excel con todas las transacciones del periodo.',
    placement: 'left'
  }
];

// Tour para Personal/Empleados
export const personalTour: TourStep[] = [
  {
    target: '[data-tour="personal-title"]',
    title: 'Gestión de Tu Equipo',
    content: 'Administra a todas las personas que trabajan contigo: camareros, bartenders, seguridad, etc.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="stats-empleados"]',
    title: 'Estadísticas del Equipo',
    content: 'Ve cuántos empleados tienes activos, horas trabajadas este mes y costos de nómina.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="btn-nuevo-empleado"]',
    title: 'Agregar Empleado',
    content: 'Da de alta a un nuevo miembro del equipo con sus datos personales, puesto y salario.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="lista-empleados"]',
    title: 'Tu Equipo',
    content: 'Aquí aparecen todos tus empleados. Haz clic en uno para ver detalles, editar datos o registrar turnos.',
    placement: 'top'
  }
];

// Tour para Jornadas/Turnos
export const jornadasTour: TourStep[] = [
  {
    target: '[data-tour="jornadas-title"]',
    title: 'Registro de Turnos',
    content: 'Registra las jornadas trabajadas por cada empleado para calcular sus sueldos.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="btn-nueva-jornada"]',
    title: 'Registrar Turno',
    content: 'Registra un turno: selecciona empleado, fecha, hora de entrada y salida. Las horas se calculan automáticamente.',
    placement: 'bottom',
    action: 'Ver formulario'
  },
  {
    target: '[data-tour="calculo-automatico"]',
    title: 'Cálculo Automático',
    content: 'El sistema calcula automáticamente las horas trabajadas, incluso si el turno cruza la medianoche (ej: 23:00-03:00 = 4 horas).',
    placement: 'left'
  },
  {
    target: '[data-tour="lista-jornadas"]',
    title: 'Historial de Turnos',
    content: 'Todas las jornadas registradas aparecen aquí. Puedes filtrar por empleado o fecha.',
    placement: 'top'
  }
];

// Tour para Nóminas
export const nominasTour: TourStep[] = [
  {
    target: '[data-tour="nominas-title"]',
    title: 'Gestión de Sueldos',
    content: 'Genera y administra los pagos a tu equipo basados en sus turnos trabajados.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="btn-generar-masiva"]',
    title: 'Generar Nóminas Masivas',
    content: '¡Súper útil! Genera automáticamente las nóminas de TODOS los empleados para el mes con un solo clic.',
    placement: 'bottom',
    action: 'Probar ahora'
  },
  {
    target: '[data-tour="filtro-estado"]',
    title: 'Filtrar por Estado',
    content: 'Ve solo las nóminas pendientes de pago o las ya pagadas.',
    placement: 'left'
  },
  {
    target: '[data-tour="nomina-card"]',
    title: 'Detalle de Nómina',
    content: 'Cada nómina muestra: empleado, periodo, monto total, y botón para marcar como pagada.',
    placement: 'top'
  },
  {
    target: '[data-tour="btn-pagar"]',
    title: 'Marcar como Pagada',
    content: 'Una vez que hagas la transferencia bancaria, márcala como pagada aquí. Esto crea automáticamente un registro en "Ingresos y Gastos".',
    placement: 'left'
  }
];

// Tour para Inventario/Productos
export const inventarioTour: TourStep[] = [
  {
    target: '[data-tour="inventario-title"]',
    title: 'Productos y Stock',
    content: 'Gestiona todo tu inventario: bebidas, comidas, suministros, etc.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="alertas-stock"]',
    title: 'Alertas de Stock Bajo',
    content: 'El sistema te avisa automáticamente cuando un producto está por agotarse.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="btn-nuevo-producto"]',
    title: 'Agregar Producto',
    content: 'Da de alta un nuevo producto con su nombre, categoría, precios y stock mínimo.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="filtro-categoria"]',
    title: 'Filtrar por Categoría',
    content: 'Filtra productos por categoría: Bebidas Alcohólicas, Refrescos, Cervezas, Suministros, etc.',
    placement: 'left'
  },
  {
    target: '[data-tour="producto-card"]',
    title: 'Ficha de Producto',
    content: 'Cada producto muestra: stock actual, precio de compra, precio de venta y margen de beneficio.',
    placement: 'top'
  },
  {
    target: '[data-tour="movimientos"]',
    title: 'Movimientos de Stock',
    content: 'Registra ENTRADAS (compras), SALIDAS (consumos) o AJUSTES (correcciones de inventario).',
    placement: 'top'
  }
];

// Tour para POS
export const posTour: TourStep[] = [
  {
    target: '[data-tour="pos-title"]',
    title: 'Sistema POS - Punto de Venta',
    content: 'Tu caja registradora digital. Aquí registras todas las ventas en barra.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="btn-abrir-sesion"]',
    title: 'Abrir Sesión de Caja',
    content: 'Antes de vender, debes abrir una sesión. Indica el empleado y el saldo inicial de caja.',
    placement: 'bottom',
    action: 'Abrir ahora'
  },
  {
    target: '[data-tour="carrito"]',
    title: 'Carrito de Compra',
    content: 'Los productos que agregues aparecen aquí. Puedes modificar cantidades o eliminar items.',
    placement: 'right'
  },
  {
    target: '[data-tour="productos-grid"]',
    title: 'Catálogo de Productos',
    content: 'Haz clic en un producto para agregarlo al carrito. Usa el buscador para encontrarlos rápido.',
    placement: 'left'
  },
  {
    target: '[data-tour="total"]',
    title: 'Total a Cobrar',
    content: 'El sistema calcula automáticamente el total de la venta.',
    placement: 'right'
  },
  {
    target: '[data-tour="metodos-pago"]',
    title: 'Métodos de Pago',
    content: 'Selecciona cómo paga el cliente: Efectivo, Tarjeta o Mixto (parte efectivo, parte tarjeta).',
    placement: 'right'
  },
  {
    target: '[data-tour="descuento-auto"]',
    title: 'Descuento Automático',
    content: 'Al finalizar la venta, el stock se descuenta automáticamente. ¡No tienes que hacer nada!',
    placement: 'bottom'
  },
  {
    target: '[data-tour="btn-cerrar-sesion"]',
    title: 'Cerrar Sesión',
    content: 'Al final del turno, cierra la sesión. El sistema te mostrará un resumen de ventas y el cuadre de caja.',
    placement: 'bottom'
  }
];

// Tour para Botellas VIP
export const botellasVipTour: TourStep[] = [
  {
    target: '[data-tour="botellas-title"]',
    title: 'Gestión de Botellas VIP',
    content: 'Sistema avanzado para controlar botellas abiertas en barra con seguimiento copa por copa.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="kpis-botellas"]',
    title: 'KPIs de Botellas',
    content: 'Ve de un vistazo: botellas abiertas, alertas, copas disponibles e ingresos potenciales.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="btn-abrir-botella"]',
    title: 'Abrir Nueva Botella',
    content: 'Cuando un cliente pida una botella, regístrala aquí. Selecciona el producto, ubicación y empleado.',
    placement: 'bottom',
    action: 'Ver formulario'
  },
  {
    target: '[data-tour="filtros"]',
    title: 'Filtros Inteligentes',
    content: 'Filtra por ubicación (Barra Principal, VIP) o muestra solo botellas con alertas.',
    placement: 'left'
  },
  {
    target: '[data-tour="botella-card"]',
    title: 'Tarjeta de Botella',
    content: 'Cada botella muestra: copas servidas/restantes, barra de progreso, ingresos generados y alertas.',
    placement: 'top'
  },
  {
    target: '[data-tour="alertas-botellas"]',
    title: 'Sistema de Alertas',
    content: '🔴 Vacía (0 copas) | 🟡 Casi vacía (<20%) | 🟠 Abierta +24h. Te avisa para que cierres la botella.',
    placement: 'top'
  },
  {
    target: '[data-tour="ingresos-potenciales"]',
    title: 'Ingresos Potenciales',
    content: 'Muestra cuánto dinero PODRÍAS ganar si vendes todas las copas restantes. Útil para saber qué botellas priorizar.',
    placement: 'top'
  },
  {
    target: '[data-tour="btn-cerrar-botella"]',
    title: 'Cerrar Botella',
    content: 'Cuando la botella se termina (o se rompe), ciérrala. Puedes marcarla como "Terminada" o "Desperdiciada".',
    placement: 'top'
  },
  {
    target: '[data-tour="auto-refresh"]',
    title: 'Actualización Automática',
    content: 'Los datos se actualizan cada 30 segundos automáticamente. ¡Siempre tendrás info fresca!',
    placement: 'bottom'
  }
];

// Tour para Analytics
export const analyticsTour: TourStep[] = [
  {
    target: '[data-tour="analytics-title"]',
    title: 'Análisis del Negocio',
    content: 'Aquí encontrarás reportes avanzados y análisis profundo de tu club.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="periodo-selector"]',
    title: 'Selector de Periodo',
    content: 'Cambia el periodo de análisis: hoy, esta semana, este mes, o personalizado.',
    placement: 'left'
  },
  {
    target: '[data-tour="graficos"]',
    title: 'Gráficos Interactivos',
    content: 'Visualiza tendencias de ventas, productos más vendidos, horarios pico, etc.',
    placement: 'top'
  },
  {
    target: '[data-tour="btn-exportar"]',
    title: 'Exportar Reportes',
    content: 'Descarga reportes profesionales en Excel o PDF para compartir con socios o contadores.',
    placement: 'left'
  },
  {
    target: '[data-tour="productos-top"]',
    title: 'Top Productos',
    content: 'Lista de productos más vendidos del periodo. Úsala para saber qué comprar más.',
    placement: 'top'
  }
];

// Tour para Venta Dual
export const ventaDualTour: TourStep[] = [
  {
    target: '[data-tour="venta-dual-checkbox"]',
    title: '🍾 Sistema de Venta Dual',
    content: 'Activa esta opción para vender el mismo producto de dos formas: por copa individual (barra) o botella completa (VIP).',
    placement: 'bottom'
  },
  {
    target: '[data-tour="venta-dual-section"]',
    title: 'Configuración de Precios',
    content: 'Define 3 valores clave: copas por botella, precio por copa, y precio de botella VIP. El sistema calculará automáticamente cuál opción es más rentable.',
    placement: 'top'
  },
  {
    target: '[data-tour="copas-botella"]',
    title: 'Copas por Botella',
    content: 'Indica cuántas copas se pueden servir de una botella. Ejemplo: una botella de 750ml puede dar 15 copas de 50ml.',
    placement: 'right'
  },
  {
    target: '[data-tour="precio-copa"]',
    title: 'Precio por Copa',
    content: 'Precio de venta individual por copa. Ejemplo: 8.00€ por copa de ron.',
    placement: 'right'
  },
  {
    target: '[data-tour="precio-vip"]',
    title: 'Precio Botella VIP',
    content: 'Precio premium de la botella completa en zona VIP. Ejemplo: 120.00€ por botella completa.',
    placement: 'right'
  },
  {
    target: '[data-tour="comparacion-visual"]',
    title: 'Comparación Automática',
    content: 'El sistema calcula y muestra visualmente qué opción genera más ingresos. Verde = más rentable, con diferencia exacta en euros.',
    placement: 'top'
  },
  {
    target: '[data-tour="mejor-opcion"]',
    title: 'Recomendación Inteligente',
    content: 'Badge "MÁS RENTABLE" aparece automáticamente en la opción que maximiza tus ingresos según los precios configurados.',
    placement: 'top'
  }
];

// Mapa de tours por ruta
export const toursByRoute: Record<string, TourStep[]> = {
  '/': dashboardTour,
  '/dashboard': dashboardTour,
  '/eventos': eventosTour,
  '/transacciones': finanzasTour,
  '/empleados': personalTour,
  '/jornadas': jornadasTour,
  '/nominas': nominasTour,
  '/productos': inventarioTour,
  '/inventario': inventarioTour,
  '/pos': posTour,
  '/botellas-abiertas': botellasVipTour,
  '/analytics': analyticsTour,
  '/venta-dual': ventaDualTour
};
