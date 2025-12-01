import { z } from 'zod';

/**
 * Cliente Validation Schemas
 * Validación de inputs para el sistema de clientes
 */

// Tipo de cliente
const tipoClienteEnum = z.enum(['particular', 'empresa', 'organizacion']);

// Base Cliente schema for creation
export const createClienteSchema = z.object({
  // Información básica
  nombre: z.string().min(2).max(255),
  email: z.string().email(),
  telefono: z.string().min(9).max(20).regex(/^[+\d\s()-]+$/),

  // Tipo
  tipo: tipoClienteEnum.default('particular'),

  // Información adicional
  empresa: z.string().max(255).optional(),
  ciudad: z.string().min(2).max(255).optional(),
  direccion: z.string().max(500).optional(),

  // Datos fiscales
  nif_cif: z.string().min(5).max(50).optional(),

  // Clasificación
  categoria: z.string().max(100).optional(),
  fuente: z.enum(['referido', 'web', 'redes_sociales', 'evento', 'otro']).optional(),

  // Valoración
  valoracion: z.number().int().min(1).max(5).optional(),

  // Estado
  activo: z.boolean().default(true),

  // Observaciones
  observaciones: z.string().max(2000).optional(),
  preferencias: z.string().max(1000).optional()
}).refine(
  (data) => {
    // Si es empresa, debe tener nombre de empresa
    if (data.tipo === 'empresa' && !data.empresa) {
      return false;
    }
    return true;
  },
  {
    message: "Los clientes de tipo 'empresa' deben tener un nombre de empresa",
    path: ["empresa"]
  }
);

// Schema para actualización de cliente
export const updateClienteSchema = z.object({
  nombre: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  telefono: z.string().min(9).max(20).regex(/^[+\d\s()-]+$/).optional(),
  tipo: tipoClienteEnum.optional(),
  empresa: z.string().max(255).optional(),
  ciudad: z.string().min(2).max(255).optional(),
  direccion: z.string().max(500).optional(),
  nif_cif: z.string().min(5).max(50).optional(),
  categoria: z.string().max(100).optional(),
  fuente: z.enum(['referido', 'web', 'redes_sociales', 'evento', 'otro']).optional(),
  valoracion: z.number().int().min(1).max(5).optional(),
  activo: z.boolean().optional(),
  observaciones: z.string().max(2000).optional(),
  preferencias: z.string().max(1000).optional()
}).strict();

// Schema para query params de listado
export const listClientesQuerySchema = z.object({
  tipo: tipoClienteEnum.optional(),
  activo: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  ciudad: z.string().min(2).max(255).optional(),
  categoria: z.string().max(100).optional(),
  fuente: z.enum(['referido', 'web', 'redes_sociales', 'evento', 'otro']).optional(),
  valoracion: z.string().regex(/^[1-5]$/).transform(Number).optional(),
  search: z.string().min(2).max(100).optional()
});

// Schema para ID en params
export const clienteIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
});

// Schema para estadísticas de cliente
export const clienteStatsQuerySchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
  fecha_desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// Schema para actualizar valoración
export const updateValoracionSchema = z.object({
  valoracion: z.number().int().min(1).max(5),
  comentario: z.string().max(500).optional()
});

export default {
  createClienteSchema,
  updateClienteSchema,
  listClientesQuerySchema,
  clienteIdSchema,
  clienteStatsQuerySchema,
  updateValoracionSchema
};
