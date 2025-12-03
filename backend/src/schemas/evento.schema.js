import { z } from 'zod';

/**
 * Evento Validation Schemas
 * Validates event creation and updates
 */

// Base evento fields
const eventoBaseSchema = z.object({
  evento: z.string()
    .min(3, 'El nombre del evento debe tener al menos 3 caracteres')
    .max(200, 'El nombre del evento no puede exceder 200 caracteres'),
  fecha: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida. Formato: YYYY-MM-DD'),
  mes: z.string()
    .max(50, 'El mes no puede exceder 50 caracteres')
    .optional(),
  hora: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida. Formato: HH:MM')
    .optional()
    .nullable(),
  ciudad_lugar: z.string()
    .min(2, 'El lugar debe tener al menos 2 caracteres')
    .max(200, 'El lugar no puede exceder 200 caracteres')
    .optional()
    .nullable(),
  categoria_id: z.number()
    .int('Categoría ID debe ser un número entero')
    .positive('Categoría ID debe ser positivo')
    .optional()
    .nullable(),
  dj_id: z.number()
    .int('DJ ID debe ser un número entero')
    .positive('DJ ID debe ser positivo')
    .optional()
    .nullable(),
  cliente_id: z.number()
    .int('Cliente ID debe ser un número entero')
    .positive('Cliente ID debe ser positivo')
    .optional()
    .nullable(),
  horas: z.number()
    .nonnegative('Las horas no pueden ser negativas')
    .optional()
    .nullable(),
  cache_total: z.number()
    .nonnegative('El caché total no puede ser negativo')
    .max(999999999.99, 'El caché total es demasiado grande')
    .optional()
    .nullable(),
  parte_dj: z.number()
    .nonnegative('La parte del DJ no puede ser negativa')
    .max(999999999.99, 'La parte del DJ es demasiado grande')
    .optional()
    .nullable(),
  parte_agencia: z.number()
    .nonnegative('La parte de la agencia no puede ser negativa')
    .max(999999999.99, 'La parte de la agencia es demasiado grande')
    .optional()
    .nullable(),
  reserva: z.number()
    .nonnegative('La reserva no puede ser negativa')
    .optional()
    .nullable(),
  cobrado_cliente: z.boolean()
    .optional(),
  pagado_dj: z.boolean()
    .optional(),
  costo_alquiler: z.number()
    .nonnegative('El costo de alquiler no puede ser negativo')
    .optional()
    .nullable(),
  otros_costos: z.number()
    .nonnegative('Otros costos no pueden ser negativos')
    .optional()
    .nullable(),
  descripcion_costos: z.string()
    .max(500, 'La descripción de costos no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  estado: z.enum(['pendiente', 'confirmado', 'cancelado', 'completado'], {
    errorMap: () => ({ message: 'Estado inválido' })
  }).optional(),
  observaciones: z.string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .optional()
    .nullable()
});

// Export base schema for direct validation (e.g., in tests)
export const eventoSchema = eventoBaseSchema;

// Create evento schema (for Express middleware validation)
export const createEventoSchema = z.object({
  body: eventoBaseSchema.required({
    evento: true,
    fecha: true
  })
});

// Update evento schema
export const updateEventoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número')
  }),
  body: eventoBaseSchema.partial()
});

// Date range query schema
export const dateRangeQuerySchema = z.object({
  query: z.object({
    fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional()
  })
});

// ID param validation schema
export const eventoIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID debe ser un número')
});

// List eventos query schema (for filtering and pagination)
export const listEventosQuerySchema = z.object({
  dj_id: z.string().regex(/^\d+$/).optional(),
  cliente_id: z.string().regex(/^\d+$/).optional(),
  estado: z.enum(['pendiente', 'confirmado', 'cancelado', 'completado']).optional(),
  mes: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

// Update pago schema (for payment status updates)
export const updatePagoSchema = z.object({
  pagado_dj: z.boolean().optional(),
  cobrado_cliente: z.boolean().optional()
});

export default {
  eventoSchema,
  createEventoSchema,
  updateEventoSchema,
  dateRangeQuerySchema,
  eventoIdSchema,
  listEventosQuerySchema,
  updatePagoSchema
};
