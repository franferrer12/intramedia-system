import { z } from 'zod';

/**
 * Evento Validation Schemas
 * Validación de inputs para el sistema de eventos
 */

// Meses válidos
const mesEnum = z.enum([
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]);

// Base evento schema for creation
export const createEventoSchema = z.object({
  // Información básica
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  mes: mesEnum,
  evento: z.string().min(3).max(255),
  ciudad_lugar: z.string().min(2).max(255),

  // Referencias
  dj_id: z.number().int().positive(),
  cliente_id: z.number().int().positive(),
  categoria_id: z.number().int().positive().optional(),

  // Detalles del evento
  horas: z.number().positive().max(24),
  cache_total: z.number().nonnegative(),
  parte_dj: z.number().nonnegative(),
  parte_agencia: z.number().nonnegative(),
  reserva: z.number().nonnegative().default(0),

  // Estados de pago
  cobrado_cliente: z.boolean().default(false),
  pagado_dj: z.boolean().default(false),

  // Costos adicionales
  costo_alquiler: z.number().nonnegative().default(0),
  otros_costos: z.number().nonnegative().default(0),
  descripcion_costos: z.string().max(1000).optional(),

  // Observaciones
  observaciones: z.string().max(2000).optional()
}).refine(
  (data) => {
    // Validar que cache_total = parte_dj + parte_agencia
    const suma = data.parte_dj + data.parte_agencia;
    return Math.abs(suma - data.cache_total) < 0.01; // Tolerancia de 1 céntimo
  },
  {
    message: "La suma de parte_dj y parte_agencia debe ser igual a cache_total",
    path: ["cache_total"]
  }
).refine(
  (data) => {
    // La fecha no debe estar más de 2 años en el futuro
    const fecha = new Date(data.fecha);
    const maxFecha = new Date();
    maxFecha.setFullYear(maxFecha.getFullYear() + 2);
    return fecha <= maxFecha;
  },
  {
    message: "La fecha no puede estar más de 2 años en el futuro",
    path: ["fecha"]
  }
);

// Schema para actualización de evento
export const updateEventoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mes: mesEnum.optional(),
  evento: z.string().min(3).max(255).optional(),
  ciudad_lugar: z.string().min(2).max(255).optional(),
  dj_id: z.number().int().positive().optional(),
  cliente_id: z.number().int().positive().optional(),
  categoria_id: z.number().int().positive().optional(),
  horas: z.number().positive().max(24).optional(),
  cache_total: z.number().nonnegative().optional(),
  parte_dj: z.number().nonnegative().optional(),
  parte_agencia: z.number().nonnegative().optional(),
  reserva: z.number().nonnegative().optional(),
  cobrado_cliente: z.boolean().optional(),
  pagado_dj: z.boolean().optional(),
  costo_alquiler: z.number().nonnegative().optional(),
  otros_costos: z.number().nonnegative().optional(),
  descripcion_costos: z.string().max(1000).optional(),
  observaciones: z.string().max(2000).optional()
}).strict()
.refine(
  (data) => {
    // Si se actualizan los montos, validar coherencia
    if (data.cache_total !== undefined && (data.parte_dj !== undefined || data.parte_agencia !== undefined)) {
      const parteDj = data.parte_dj ?? 0;
      const parteAgencia = data.parte_agencia ?? 0;
      const suma = parteDj + parteAgencia;
      if (parteDj > 0 && parteAgencia > 0) {
        return Math.abs(suma - data.cache_total) < 0.01;
      }
    }
    return true;
  },
  {
    message: "Si actualizas montos, la suma de parte_dj y parte_agencia debe ser igual a cache_total",
    path: ["cache_total"]
  }
);

// Schema para marcar pagos
export const updatePagoSchema = z.object({
  cobrado_cliente: z.boolean().optional(),
  pagado_dj: z.boolean().optional(),
  observaciones: z.string().max(500).optional()
}).refine(
  (data) => {
    // Al menos uno de los campos de pago debe estar presente
    return data.cobrado_cliente !== undefined || data.pagado_dj !== undefined;
  },
  {
    message: "Debes especificar al menos un estado de pago",
    path: ["cobrado_cliente"]
  }
);

// Schema para query params de listado
export const listEventosQuerySchema = z.object({
  mes: mesEnum.optional(),
  dj_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  cliente_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  categoria_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  cobrado_cliente: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  pagado_dj: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  fecha_desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().min(2).max(100).optional()
});

// Schema para ID en params
export const eventoIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
});

// Schema para estadísticas por período
export const estadisticasPeriodoSchema = z.object({
  mes: mesEnum.optional(),
  anio: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  fecha_desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export default {
  createEventoSchema,
  updateEventoSchema,
  updatePagoSchema,
  listEventosQuerySchema,
  eventoIdSchema,
  estadisticasPeriodoSchema
};
