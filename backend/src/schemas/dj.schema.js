import { z } from 'zod';

/**
 * DJ Validation Schemas
 */

const djBaseSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres')
    .optional()
    .nullable(),
  telefono: z.string()
    .regex(/^\+?[0-9\s-()]{7,20}$/, 'Teléfono inválido')
    .optional()
    .nullable(),
  genero_musical: z.string()
    .max(100, 'Género musical no puede exceder 100 caracteres')
    .optional()
    .nullable(),
  tarifa_base: z.number()
    .nonnegative('La tarifa base no puede ser negativa')
    .max(999999999.99, 'La tarifa base es demasiado grande')
    .optional()
    .nullable(),
  porcentaje_comision: z.number()
    .min(0, 'El porcentaje no puede ser negativo')
    .max(100, 'El porcentaje no puede exceder 100')
    .optional()
    .nullable(),
  instagram: z.string()
    .max(100, 'Instagram no puede exceder 100 caracteres')
    .optional()
    .nullable(),
  notas: z.string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional()
    .nullable()
});

export const createDJSchema = z.object({
  body: djBaseSchema.required({ nombre: true })
});

export const updateDJSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número')
  }),
  body: djBaseSchema.partial()
});

export default {
  createDJSchema,
  updateDJSchema
};
