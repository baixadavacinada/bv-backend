import { Request, Response, NextFunction } from 'express';
import { Logger } from './logging';

/**
 * Classe de erro customizada seguindo padrões REST
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erros específicos para diferentes cenários
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 404, 'NOT_FOUND', true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403, 'FORBIDDEN', true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

/**
 * Middleware global de tratamento de erros
 * Centraliza todo o handling seguindo DRY principle
 */
export const errorHandlingMiddleware = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger = Logger.getInstance();
  const correlationId = req.correlationId || 'unknown';

  if (error instanceof AppError) {
    logger.warn(`Operational error: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      url: req.url,
      method: req.method,
      userId: req.user?.id
    }, correlationId);

    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        correlationId
      }
    });
  }

  if (error.name === 'ValidationError') {
    const mongoError = error as any;
    const validationErrors: Record<string, string> = {};

    for (const field in mongoError.errors) {
      validationErrors[field] = mongoError.errors[field].message;
    }

    logger.warn(`MongoDB validation error`, { validationErrors }, correlationId);

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: { fields: validationErrors },
        timestamp: new Date().toISOString(),
        correlationId
      }
    });
  }

  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    const duplicateError = error as any;
    const field = Object.keys(duplicateError.keyPattern)[0];

    logger.warn(`Duplicate key error: ${field}`, { field }, correlationId);

    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `${field} já existe`,
        details: { field },
        timestamp: new Date().toISOString(),
        correlationId
      }
    });
  }

  logger.error(`Unhandled error: ${error.message}`, error, {
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    body: req.body
  }, correlationId);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
      details: isDevelopment ? { stack: error.stack } : undefined,
      timestamp: new Date().toISOString(),
      correlationId
    }
  });
};

/**
 * Middleware para capturar 404s
 */
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Rota ${req.method} ${req.url}`);
  next(error);
};

/**
 * Wrapper para async handlers (evita try/catch repetitivo)
 * Implementa o padrão de Higher-Order Function
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware de validação de JSON malformado
 */
export const jsonErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (
    error instanceof SyntaxError &&
    typeof (error as any).status === 'number' &&
    (error as any).status === 400 &&
    'body' in error
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'JSON malformado na requisição',
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId
      }
    });
  }
  next(error);
};