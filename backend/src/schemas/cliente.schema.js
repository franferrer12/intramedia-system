import { z } from 'zod';

/**
 * Cliente Validation Schemas
 */

const clienteBaseSchema = z.object({
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
  tipo: z.enum(['corporativo', 'particular', 'empresa', 'agencia'], {
    errorMap: () => ({ message: 'Tipo de cliente inválido' })
  }).optional().nullable(),
  empresa: z.string()
    .max(100, 'Empresa no puede exceder 100 caracteres')
    .optional()
    .nullable(),
  ciudad: z.string()
    .max(100, 'Ciudad no puede exceder 100 caracteres')
    .optional()
    .nullable(),
  direccion: z.string()
    .max(200, 'Dirección no puede exceder 200 caracteres')
    .optional()
    .nullable(),
  rfc: z.string()
    .regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-V1-9][A-Z1-9][0-9A]$/, 'RFC inválido')
    .optional()
    .nullable(),
  valoracion: z.number()
    .int('Valoración debe ser un número entero')
    .min(1, 'Valoración mínima es 1')
    .max(5, 'Valoración máxima es 5')
    .optional()
    .nullable(),
  activo: z.boolean().optional(),
  observaciones: z.string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .optional()
    .nullable()
});

// Export base schema for direct validation (e.g., in tests)
export const clienteSchema = clienteBaseSchema;

export const createClienteSchema = z.object({
  body: clienteBaseSchema.required({ nombre: true })
});

export const updateClienteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número')
  }),
  body: clienteBaseSchema.partial()
});

export default {
  clienteSchema,
  createClienteSchema,
  updateClienteSchema
};
