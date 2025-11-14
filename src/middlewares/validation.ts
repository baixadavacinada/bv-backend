import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandling';

/**
 * Schema de validação simples mas robusto
 * Pode ser substituído por Joi, Zod ou Yup em projetos maiores
 */
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * Validador de campos seguindo o princípio Single Responsibility
 */
class FieldValidator {
  static validate(value: any, rule: ValidationRule, fieldName: string): string | null {

    if (rule.required && (value === undefined || value === null || value === '')) {
      return `${fieldName} is required`;
    }

    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    if (rule.type) {
      if (rule.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return `${fieldName} must be a valid email`;
        }
      } else if (rule.type === 'array') {
        if (!Array.isArray(value)) {
          return `${fieldName} must be an array`;
        }
      } else if (typeof value !== rule.type) {
        return `${fieldName} must be of type ${rule.type}`;
      }
    }

    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${fieldName} must have at least ${rule.minLength} characters`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${fieldName} must have at most ${rule.maxLength} characters`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return `${fieldName} format is invalid`;
      }
    }

    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `${fieldName} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `${fieldName} must be at most ${rule.max}`;
      }
    }

    if (rule.enum && !rule.enum.includes(value)) {
      return `${fieldName} must be one of: ${rule.enum.join(', ')}`;
    }

    if (rule.custom) {
      const result = rule.custom(value);
      if (typeof result === 'string') {
        return result;
      }
      if (result === false) {
        return `${fieldName} is invalid`;
      }
    }

    return null;
  }
}

/**
 * Middleware de validação configurável
 * Implementa o padrão Strategy para diferentes tipos de validação
 */
export const validateBody = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    for (const [fieldName, rule] of Object.entries(schema)) {
      const value = req.body[fieldName];
      const error = FieldValidator.validate(value, rule, fieldName);

      if (error) {
        errors[fieldName] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Invalid data', { fields: errors });
    }

    next();
  };
};

/**
 * Middleware de validação para query params
 */
export const validateQuery = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    for (const [fieldName, rule] of Object.entries(schema)) {
      let value = req.query[fieldName];

      let valueForValidation: any = value;
      if (typeof value === 'string') {
        if (rule.type === 'number') {
          const num = Number(value);
          valueForValidation = isNaN(num) ? value : num;
        } else if (rule.type === 'boolean') {
          valueForValidation = value.toLowerCase() === 'true';
        }
      }

      const error = FieldValidator.validate(valueForValidation, rule, fieldName);

      if (error) {
        errors[fieldName] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Invalid query parameters', { fields: errors });
    }

    next();
  };
};

/**
 * Schemas de validação pré-definidos para entidades comuns
 */
export const ValidationSchemas = {
  user: {
    name: { required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
    email: { required: true, type: 'email' as const },
    password: { required: true, type: 'string' as const, minLength: 6 },
    role: { required: true, type: 'string' as const, enum: ['public', 'agent', 'admin'] as any[] }
  },

  healthUnit: {
    name: { required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
    address: { required: true, type: 'string' as const, minLength: 5, maxLength: 200 },
    city: { required: true, type: 'string' as const, minLength: 2, maxLength: 50 },
    state: { required: true, type: 'string' as const, minLength: 2, maxLength: 50 },
    zipCode: { required: true, type: 'string' as const, pattern: /^\d{5}-?\d{3}$/ },
    phone: { required: false, type: 'string' as const, pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/ },
    operatingHours: { 
      required: false, 
      type: 'object' as const,
      custom: (value: any) => {
        if (!value) return true;
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const hourPattern = /^(\d{2}:\d{2}-\d{2}:\d{2}|Fechado|Closed)$/i;
        
        for (const day of Object.keys(value)) {
          if (!validDays.includes(day)) {
            return `Invalid day of week: ${day}`;
          }
          if (value[day] && !hourPattern.test(value[day])) {
            return `Invalid time format for ${day}. Use: HH:MM-HH:MM or 'Fechado'`;
          }
        }
        return true;
      }
    }
  },

  feedback: {
    comment: { required: true, type: 'string' as const, minLength: 10, maxLength: 1000 },
    rating: { required: true, type: 'number' as const, min: 1, max: 5 },
    healthUnitId: { required: true, type: 'string' as const, minLength: 24, maxLength: 24 }
  },

  vaccine: {
    name: { required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
    manufacturer: { required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
    ageGroup: { required: true, type: 'string' as const, minLength: 1, maxLength: 50 },
    doses: { required: true, type: 'array' as const },
    batchNumber: { required: false, type: 'string' as const, minLength: 1, maxLength: 50 },
    description: { required: false, type: 'string' as const, minLength: 1, maxLength: 500 }
  },

  login: {
    email: { required: true, type: 'email' as const },
    password: { required: true, type: 'string' as const, minLength: 1 }
  },

  pagination: {
    page: { required: false, type: 'number' as const, min: 1 },
    limit: { required: false, type: 'number' as const, min: 1, max: 100 },
    sort: { required: false, type: 'string' as const },
    order: { required: false, type: 'string' as const, enum: ['asc', 'desc'] as any[] }
  },

  firebaseUser: {
    email: { required: true, type: 'email' as const },
    password: { required: true, type: 'string' as const, minLength: 6 },
    displayName: { required: false, type: 'string' as const, minLength: 2, maxLength: 100 },
    role: { required: false, type: 'string' as const, enum: ['public', 'agent', 'admin'] as any[] }
  },

  firebaseRegistration: {
    email: { required: true, type: 'email' as const },
    displayName: { required: false, type: 'string' as const, minLength: 2, maxLength: 100 }
  },

  firebaseEmailLogin: {
    email: { required: true, type: 'email' as const },
    password: { required: true, type: 'string' as const, minLength: 1 }
  },

  firebaseTokenVerify: {
    idToken: { required: true, type: 'string' as const, minLength: 10 }
  },

  firebaseUserClaims: {
    uid: { required: true, type: 'string' as const, minLength: 1 },
    claims: { 
      required: true, 
      type: 'object' as const,
      custom: (value: any) => {
        if (!value || typeof value !== 'object') {
          return 'Claims must be an object';
        }
        return true;
      }
    }
  },

  firebaseUserStatus: {
    disabled: { required: true, type: 'boolean' as const }
  },

  profileUpdate: {
    displayName: { required: false, type: 'string' as const, minLength: 2, maxLength: 100 },
    name: { required: false, type: 'string' as const, minLength: 2, maxLength: 100 },
    phone: { required: false, type: 'string' as const, minLength: 10, maxLength: 20 },
    cpf: { required: false, type: 'string' as const, minLength: 11, maxLength: 14 },
    photoURL: { 
      required: false, 
      type: 'string' as const,
      pattern: /^https?:\/\/.+/,
      custom: (value: any) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return 'photoURL must be a valid URL';
        }
      }
    },
    notifications: { required: false, type: 'object' as const },
    favoritesHealthUnit: { required: false, type: 'array' as const }
  }
};