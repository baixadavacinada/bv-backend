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
      return `${fieldName} é obrigatório`;
    }

    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    if (rule.type) {
      if (rule.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return `${fieldName} deve ser um email válido`;
        }
      } else if (rule.type === 'array') {
        if (!Array.isArray(value)) {
          return `${fieldName} deve ser um array`;
        }
      } else if (typeof value !== rule.type) {
        return `${fieldName} deve ser do tipo ${rule.type}`;
      }
    }

    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${fieldName} deve ter pelo menos ${rule.minLength} caracteres`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${fieldName} deve ter no máximo ${rule.maxLength} caracteres`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return `${fieldName} não atende ao padrão exigido`;
      }
    }

    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `${fieldName} deve ser pelo menos ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `${fieldName} deve ser no máximo ${rule.max}`;
      }
    }

    if (rule.enum && !rule.enum.includes(value)) {
      return `${fieldName} deve ser um dos valores: ${rule.enum.join(', ')}`;
    }

    if (rule.custom) {
      const result = rule.custom(value);
      if (typeof result === 'string') {
        return result;
      }
      if (result === false) {
        return `${fieldName} não é válido`;
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
      throw new ValidationError('Dados inválidos', { fields: errors });
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
      throw new ValidationError('Parâmetros de consulta inválidos', { fields: errors });
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
    phone: { required: false, type: 'string' as const, pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/ }
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
    doses: { required: true, type: 'array' as const }
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
  }
};