import { z } from 'zod';

/**
 * Auth Validation Schemas
 * Validates authentication and user management endpoints
 */

// Login schema
export const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Email inválido')
      .max(100, 'El email no puede exceder 100 caracteres'),
    password: z.string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .max(100, 'La contraseña no puede exceder 100 caracteres')
  })
});

// Register schema
export const registerSchema = z.object({
  body: z.object({
    username: z.string()
      .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
      .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
      .regex(/^[a-zA-Z0-9_-]+$/, 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'),
    password: z.string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(100, 'La contraseña no puede exceder 100 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
    email: z.string()
      .email('Email inválido')
      .max(100, 'El email no puede exceder 100 caracteres'),
    nombre: z.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    rol: z.enum(['dj', 'staff', 'admin'], {
      errorMap: () => ({ message: 'Rol inválido. Debe ser: dj, staff o admin' })
    }).optional(),
    agencia: z.string()
      .max(100, 'El nombre de la agencia no puede exceder 100 caracteres')
      .optional()
  })
});

// Change password schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string()
      .min(1, 'La contraseña actual es requerida'),
    newPassword: z.string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(100, 'La nueva contraseña no puede exceder 100 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
  })
});

// Update profile schema
export const updateProfileSchema = z.object({
  body: z.object({
    nombre: z.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .optional(),
    email: z.string()
      .email('Email inválido')
      .max(100, 'El email no puede exceder 100 caracteres')
      .optional(),
    telefono: z.string()
      .regex(/^\+?[0-9\s-()]{7,20}$/, 'Teléfono inválido')
      .optional()
      .nullable(),
    agencia: z.string()
      .max(100, 'El nombre de la agencia no puede exceder 100 caracteres')
      .optional()
      .nullable()
  })
});

// Reset password request schema
export const resetPasswordRequestSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Email inválido')
  })
});

// Reset password schema
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string()
      .min(1, 'Token requerido'),
    newPassword: z.string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(100, 'La nueva contraseña no puede exceder 100 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
  })
});

export default {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateProfileSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema
};
