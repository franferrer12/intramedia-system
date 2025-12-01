import { z } from 'zod';

/**
 * DJ Validation Schemas
 * Validación de inputs para el sistema de DJs
 */

// Base DJ schema for creation
export const createDJSchema = z.object({
  // Información básica
  nombre: z.string().min(2).max(255),
  email: z.string().email(),
  telefono: z.string().min(9).max(20).regex(/^[+\d\s()-]+$/),

  // Información adicional
  nombre_artistico: z.string().min(2).max(255).optional(),
  genero_musical: z.string().max(255).optional(),
  ciudad: z.string().min(2).max(255).optional(),

  // Datos fiscales
  nif_cif: z.string().min(5).max(50).optional(),
  direccion_fiscal: z.string().max(500).optional(),

  // Tipo de DJ
  tipo: z.enum(['interno', 'externo']).default('externo'),

  // Porcentajes y comisiones
  porcentaje_comision: z.number().min(0).max(100).optional(),

  // Estado
  activo: z.boolean().default(true),

  // Redes sociales
  instagram: z.string().max(255).optional(),
  facebook: z.string().max(255).optional(),
  spotify: z.string().max(255).optional(),

  // Observaciones
  observaciones: z.string().max(2000).optional()
}).refine(
  (data) => {
    // Validar formato de redes sociales si están presentes
    if (data.instagram && !data.instagram.match(/^@?[\w.]+$/)) {
      return false;
    }
    return true;
  },
  {
    message: "Formato de Instagram inválido (usa @usuario o usuario)",
    path: ["instagram"]
  }
);

// Schema para actualización de DJ
export const updateDJSchema = z.object({
  nombre: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  telefono: z.string().min(9).max(20).regex(/^[+\d\s()-]+$/).optional(),
  nombre_artistico: z.string().min(2).max(255).optional(),
  genero_musical: z.string().max(255).optional(),
  ciudad: z.string().min(2).max(255).optional(),
  nif_cif: z.string().min(5).max(50).optional(),
  direccion_fiscal: z.string().max(500).optional(),
  tipo: z.enum(['interno', 'externo']).optional(),
  porcentaje_comision: z.number().min(0).max(100).optional(),
  activo: z.boolean().optional(),
  instagram: z.string().max(255).optional(),
  facebook: z.string().max(255).optional(),
  spotify: z.string().max(255).optional(),
  observaciones: z.string().max(2000).optional()
}).strict();

// Schema para query params de listado
export const listDJsQuerySchema = z.object({
  tipo: z.enum(['interno', 'externo']).optional(),
  activo: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  ciudad: z.string().min(2).max(255).optional(),
  search: z.string().min(2).max(100).optional()
});

// Schema para ID en params
export const djIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
});

// Schema para estadísticas de DJ
export const djStatsQuerySchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
  fecha_desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export default {
  createDJSchema,
  updateDJSchema,
  listDJsQuerySchema,
  djIdSchema,
  djStatsQuerySchema
};
