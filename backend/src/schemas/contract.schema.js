import { z } from 'zod';

/**
 * Contract Validation Schemas
 * Validación de inputs para el sistema de contratos
 */

// Enum types
export const contractTypeEnum = z.enum([
  'service',
  'rental',
  'collaboration',
  'partnership',
  'other'
]);

export const contractStatusEnum = z.enum([
  'draft',
  'pending_signature',
  'signed',
  'active',
  'completed',
  'cancelled',
  'expired'
]);

// Base contract schema for creation
export const createContractSchema = z.object({
  // Tipo y plantilla
  contract_type: contractTypeEnum,
  template_id: z.number().int().positive().optional(),

  // Referencias
  cliente_id: z.number().int().positive().optional(),
  dj_id: z.number().int().positive().optional(),
  evento_id: z.number().int().positive().optional(),

  // Parte A (normalmente la agencia)
  party_a_name: z.string().min(2).max(255),
  party_a_id: z.string().min(5).max(50), // NIF/CIF
  party_a_address: z.string().min(10).max(500),

  // Parte B (cliente/DJ)
  party_b_name: z.string().min(2).max(255),
  party_b_id: z.string().min(5).max(50), // NIF/CIF
  party_b_address: z.string().min(10).max(500),
  party_b_email: z.string().email(),
  party_b_phone: z.string().min(9).max(20).regex(/^[+\d\s()-]+$/),

  // Contenido
  title: z.string().min(5).max(255),
  description: z.string().min(10).max(2000).optional(),
  content: z.string().min(50), // Contenido completo del contrato
  variables: z.record(z.any()).optional(), // Variables para plantillas

  // Términos financieros
  total_amount: z.number().nonnegative(),
  currency: z.string().length(3).default('EUR'), // ISO 4217
  payment_terms: z.string().min(10).max(1000).optional(),

  // Fechas
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  // Renovación automática
  auto_renew: z.boolean().default(false),
  renewal_period: z.string().max(50).optional(),

  // Notas
  notes: z.string().max(2000).optional(),

  // Usuario creador (se obtiene del middleware de auth)
  created_by: z.number().int().positive()
}).refine(
  (data) => {
    // Si hay end_date, debe ser posterior a start_date
    if (data.end_date) {
      return new Date(data.end_date) > new Date(data.start_date);
    }
    return true;
  },
  {
    message: "end_date debe ser posterior a start_date",
    path: ["end_date"]
  }
);

// Schema para actualización de contrato
export const updateContractSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  description: z.string().min(10).max(2000).optional(),
  content: z.string().min(50).optional(),
  variables: z.record(z.any()).optional(),
  total_amount: z.number().nonnegative().optional(),
  payment_terms: z.string().min(10).max(1000).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  auto_renew: z.boolean().optional(),
  renewal_period: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  internal_notes: z.string().max(2000).optional()
}).strict(); // No permitir campos adicionales

// Schema para firma de contrato
export const signContractSchema = z.object({
  party: z.enum(['a', 'b']),
  signatureData: z.object({
    signature: z.string().min(50), // Base64 de la firma
    ip_address: z.string().ip().optional(),
    user_agent: z.string().max(500).optional(),
    timestamp: z.string().datetime()
  })
});

// Schema para cambio de estado
export const updateStatusSchema = z.object({
  status: contractStatusEnum,
  reason: z.string().min(10).max(500).optional()
}).refine(
  (data) => {
    // Si el estado es 'cancelled', debe haber una razón
    if (data.status === 'cancelled' && !data.reason) {
      return false;
    }
    return true;
  },
  {
    message: "Se requiere una razón para cancelar el contrato",
    path: ["reason"]
  }
);

// Schema para query params de listado
export const listContractsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: contractStatusEnum.optional(),
  contract_type: contractTypeEnum.optional(),
  cliente_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  dj_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().min(2).max(100).optional()
});

// Schema para ID en params
export const contractIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
});

export default {
  createContractSchema,
  updateContractSchema,
  signContractSchema,
  updateStatusSchema,
  listContractsQuerySchema,
  contractIdSchema
};
