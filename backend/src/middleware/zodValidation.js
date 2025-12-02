import { z } from 'zod';

/**
 * Zod Validation Middleware
 * Validates request data against Zod schemas
 */

/**
 * Middleware factory to validate requests with Zod schemas
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request data
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod errors
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      // Unknown error
      next(error);
    }
  };
};

/**
 * Middleware to validate body only
 * @param {z.ZodSchema} schema - Zod schema for body
 * @returns {Function} Express middleware
 */
export const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Invalid request body',
          errors
        });
      }

      next(error);
    }
  };
};

/**
 * Middleware to validate query params only
 * @param {z.ZodSchema} schema - Zod schema for query
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors
        });
      }

      next(error);
    }
  };
};

/**
 * Middleware to validate URL params only
 * @param {z.ZodSchema} schema - Zod schema for params
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Invalid URL parameters',
          errors
        });
      }

      next(error);
    }
  };
};

export default {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams
};
