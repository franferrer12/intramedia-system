/**
 * Schema Exports
 * Central export point for all Zod validation schemas
 */

// Import schemas
import authSchemas from './auth.schema.js';
import eventoSchemas from './evento.schema.js';
import djSchemas from './dj.schema.js';
import clienteSchemas from './cliente.schema.js';

// Re-export all schemas
export const {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateProfileSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema
} = authSchemas;

export const {
  createEventoSchema,
  updateEventoSchema,
  dateRangeQuerySchema
} = eventoSchemas;

export const {
  createDJSchema,
  updateDJSchema
} = djSchemas;

export const {
  createClienteSchema,
  updateClienteSchema
} = clienteSchemas;

// Default export
export default {
  // Auth
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateProfileSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  
  // Eventos
  createEventoSchema,
  updateEventoSchema,
  dateRangeQuerySchema,
  
  // DJs
  createDJSchema,
  updateDJSchema,
  
  // Clientes
  createClienteSchema,
  updateClienteSchema
};
