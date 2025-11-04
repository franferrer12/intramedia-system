/**
 * Validation Middleware
 * Sistema de validación robusto para requests
 */

/**
 * Validators - Funciones de validación reutilizables
 */
export const validators = {
  isEmail: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  isPhone: (value) => {
    // Acepta formatos: +34123456789, 123456789, 123-456-789, etc.
    const phoneRegex = /^\+?[\d\s\-()]{9,}$/;
    return phoneRegex.test(value);
  },

  isURL: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  isDate: (value) => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  isNumeric: (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  isInteger: (value) => {
    return Number.isInteger(Number(value));
  },

  isPositive: (value) => {
    return Number(value) > 0;
  },

  isAlpha: (value) => {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value);
  },

  isAlphanumeric: (value) => {
    return /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(value);
  },

  minLength: (value, min) => {
    return String(value).length >= min;
  },

  maxLength: (value, max) => {
    return String(value).length <= max;
  },

  min: (value, min) => {
    return Number(value) >= min;
  },

  max: (value, max) => {
    return Number(value) <= max;
  },

  isIn: (value, array) => {
    return array.includes(value);
  },

  matches: (value, regex) => {
    return regex.test(value);
  }
};

/**
 * Validation Rule Builder
 */
class ValidationRule {
  constructor(field, friendlyName = null) {
    this.field = field;
    this.friendlyName = friendlyName || field;
    this.rules = [];
  }

  required(message = null) {
    this.rules.push({
      type: 'required',
      message: message || `${this.friendlyName} es requerido`
    });
    return this;
  }

  optional() {
    this.rules.push({ type: 'optional' });
    return this;
  }

  email(message = null) {
    this.rules.push({
      type: 'email',
      message: message || `${this.friendlyName} debe ser un email válido`
    });
    return this;
  }

  phone(message = null) {
    this.rules.push({
      type: 'phone',
      message: message || `${this.friendlyName} debe ser un teléfono válido`
    });
    return this;
  }

  url(message = null) {
    this.rules.push({
      type: 'url',
      message: message || `${this.friendlyName} debe ser una URL válida`
    });
    return this;
  }

  date(message = null) {
    this.rules.push({
      type: 'date',
      message: message || `${this.friendlyName} debe ser una fecha válida`
    });
    return this;
  }

  numeric(message = null) {
    this.rules.push({
      type: 'numeric',
      message: message || `${this.friendlyName} debe ser numérico`
    });
    return this;
  }

  integer(message = null) {
    this.rules.push({
      type: 'integer',
      message: message || `${this.friendlyName} debe ser un entero`
    });
    return this;
  }

  positive(message = null) {
    this.rules.push({
      type: 'positive',
      message: message || `${this.friendlyName} debe ser positivo`
    });
    return this;
  }

  minLength(min, message = null) {
    this.rules.push({
      type: 'minLength',
      value: min,
      message: message || `${this.friendlyName} debe tener al menos ${min} caracteres`
    });
    return this;
  }

  maxLength(max, message = null) {
    this.rules.push({
      type: 'maxLength',
      value: max,
      message: message || `${this.friendlyName} debe tener máximo ${max} caracteres`
    });
    return this;
  }

  min(min, message = null) {
    this.rules.push({
      type: 'min',
      value: min,
      message: message || `${this.friendlyName} debe ser al menos ${min}`
    });
    return this;
  }

  max(max, message = null) {
    this.rules.push({
      type: 'max',
      value: max,
      message: message || `${this.friendlyName} debe ser máximo ${max}`
    });
    return this;
  }

  isIn(array, message = null) {
    this.rules.push({
      type: 'isIn',
      value: array,
      message: message || `${this.friendlyName} debe ser uno de: ${array.join(', ')}`
    });
    return this;
  }

  matches(regex, message = null) {
    this.rules.push({
      type: 'matches',
      value: regex,
      message: message || `${this.friendlyName} tiene un formato inválido`
    });
    return this;
  }

  custom(validator, message) {
    this.rules.push({
      type: 'custom',
      validator,
      message
    });
    return this;
  }
}

/**
 * Helper para crear reglas de validación
 */
export const field = (fieldName, friendlyName = null) => {
  return new ValidationRule(fieldName, friendlyName);
};

/**
 * Valida los datos contra las reglas
 */
const validateData = (data, rules) => {
  const errors = {};

  for (const rule of rules) {
    const value = data[rule.field];
    const isOptional = rule.rules.some(r => r.type === 'optional');
    const isEmpty = value === undefined || value === null || value === '';

    // Si es opcional y está vacío, skip
    if (isOptional && isEmpty) {
      continue;
    }

    for (const validation of rule.rules) {
      if (validation.type === 'optional') continue;

      // Required check
      if (validation.type === 'required' && isEmpty) {
        errors[rule.field] = validation.message;
        break;
      }

      // Skip other validations if empty (will be caught by required)
      if (isEmpty) continue;

      // Run validators
      let isValid = true;

      switch (validation.type) {
        case 'email':
          isValid = validators.isEmail(value);
          break;
        case 'phone':
          isValid = validators.isPhone(value);
          break;
        case 'url':
          isValid = validators.isURL(value);
          break;
        case 'date':
          isValid = validators.isDate(value);
          break;
        case 'numeric':
          isValid = validators.isNumeric(value);
          break;
        case 'integer':
          isValid = validators.isInteger(value);
          break;
        case 'positive':
          isValid = validators.isPositive(value);
          break;
        case 'minLength':
          isValid = validators.minLength(value, validation.value);
          break;
        case 'maxLength':
          isValid = validators.maxLength(value, validation.value);
          break;
        case 'min':
          isValid = validators.min(value, validation.value);
          break;
        case 'max':
          isValid = validators.max(value, validation.value);
          break;
        case 'isIn':
          isValid = validators.isIn(value, validation.value);
          break;
        case 'matches':
          isValid = validators.matches(value, validation.value);
          break;
        case 'custom':
          isValid = validation.validator(value, data);
          break;
      }

      if (!isValid) {
        errors[rule.field] = validation.message;
        break;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Middleware de validación
 * @param {Array} rules - Array de ValidationRule
 * @returns {Function} Express middleware
 */
export const validate = (rules) => {
  return (req, res, next) => {
    const data = { ...req.body, ...req.query, ...req.params };
    const { isValid, errors } = validateData(data, rules);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        errors
      });
    }

    next();
  };
};

/**
 * Sanitizers - Funciones para limpiar/formatear datos
 */
export const sanitize = {
  trim: (value) => String(value).trim(),
  lowercase: (value) => String(value).toLowerCase(),
  uppercase: (value) => String(value).toUpperCase(),
  escape: (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;'),
  removeSpaces: (value) => String(value).replace(/\s+/g, ''),
  toNumber: (value) => Number(value),
  toBoolean: (value) => {
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
  }
};

/**
 * Middleware de sanitización
 */
export const sanitizeRequest = (sanitizers) => {
  return (req, res, next) => {
    for (const [field, sanitizerFn] of Object.entries(sanitizers)) {
      if (req.body[field] !== undefined) {
        req.body[field] = sanitizerFn(req.body[field]);
      }
      if (req.query[field] !== undefined) {
        req.query[field] = sanitizerFn(req.query[field]);
      }
    }
    next();
  };
};

export default {
  field,
  validate,
  validators,
  sanitize,
  sanitizeRequest
};
