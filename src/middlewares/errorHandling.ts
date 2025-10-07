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
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
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
 * Centraliza todo o handling seguindo DRY principle e padrões RESTful
 */
export const errorHandlingMiddleware = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger = Logger.getInstance();
  const correlationId = req.correlationId || 'unknown';

  const requestContext = {
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? '[REDACTED]' : undefined,
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip']
    },
    ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
    userId: req.user?.id,
    userRole: req.user?.role,
    timestamp: new Date().toISOString(),
    correlationId
  };

  if (error instanceof AppError) {
    const errorContext = {
      ...requestContext,
      error: {
        type: 'OPERATIONAL',
        code: error.code,
        statusCode: error.statusCode,
        message: error.message,
        details: error.details,
        isOperational: error.isOperational
      }
    };

    if (error.statusCode >= 500) {
      logger.error(`Operational Server Error: ${error.message}`, error, errorContext);
    } else if (error.statusCode >= 400) {
      logger.warn(`Client Error: ${error.message}`, errorContext);
    } else {
      logger.info(`Operational Info: ${error.message}`, errorContext);
    }

    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        correlationId,
        path: req.path
      }
    });
  }

  if (error.name === 'ValidationError') {
    const mongoError = error as any;
    const validationErrors: Record<string, string> = {};

    for (const field in mongoError.errors) {
      validationErrors[field] = mongoError.errors[field].message;
    }

    const validationContext = {
      ...requestContext,
      error: {
        type: 'VALIDATION',
        name: error.name,
        validationErrors,
        originalMessage: error.message
      }
    };

    logger.warn(`Validation Error: Invalid request data`, validationContext);

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: { 
          fields: validationErrors,
          count: Object.keys(validationErrors).length
        },
        timestamp: new Date().toISOString(),
        correlationId,
        path: req.path
      }
    });
  }

  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    const duplicateError = error as any;
    const field = Object.keys(duplicateError.keyPattern)[0];
    const value = duplicateError.keyValue[field];

    const duplicateContext = {
      ...requestContext,
      error: {
        type: 'DUPLICATE_KEY',
        name: error.name,
        code: duplicateError.code,
        field,
        value: typeof value === 'string' ? value.substring(0, 50) : value, // Truncate long values
        index: duplicateError.keyPattern
      }
    };

    logger.warn(`Duplicate Key Error: Resource already exists`, duplicateContext);

    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `${field} already in use`,
        details: { 
          field,
          constraint: 'unique'
        },
        timestamp: new Date().toISOString(),
        correlationId,
        path: req.path
      }
    });
  }

  if (error.name === 'JsonWebTokenError') {
    const jwtContext = {
      ...requestContext,
      error: {
        type: 'JWT_ERROR',
        name: error.name,
        message: error.message
      }
    };

    logger.warn(`JWT Error: Invalid token`, jwtContext);

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        timestamp: new Date().toISOString(),
        correlationId,
        path: req.path
      }
    });
  }

  if (error.name === 'TokenExpiredError') {
    const jwtContext = {
      ...requestContext,
      error: {
        type: 'JWT_EXPIRED',
        name: error.name,
        message: error.message,
        expiredAt: (error as any).expiredAt
      }
    };

    logger.warn(`JWT Error: Token expired`, jwtContext);

    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token expired',
        details: {
          expiredAt: (error as any).expiredAt
        },
        timestamp: new Date().toISOString(),
        correlationId,
        path: req.path
      }
    });
  }

  const criticalContext = {
    ...requestContext,
    error: {
      type: 'UNHANDLED',
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 10), // Primeiras 10 linhas do stack
      constructor: error.constructor.name
    },
    request: {
      body: req.body ? JSON.stringify(req.body).substring(0, 1000) : undefined, // Truncate large bodies
      params: req.params,
      query: req.query
    }
  };

  logger.error(`Critical Unhandled Error: ${error.message}`, error, criticalContext);

  if (process.env.NODE_ENV === 'production') {
    logger.error(`ALERT: Production Error Requires Investigation`, error, {
      severity: 'CRITICAL',
      requiresInvestigation: true,
      ...criticalContext
    });
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: isDevelopment ? { 
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5),
        timestamp: new Date().toISOString()
      } : undefined,
      timestamp: new Date().toISOString(),
      correlationId,
      path: req.path
    }
  });
};

/**
 * Middleware para capturar 404s
 * Log detalhado para análise de rotas não encontradas
 */
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const logger = Logger.getInstance();
  const correlationId = req.correlationId || 'unknown';

  const notFoundContext = {
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    headers: {
      'user-agent': req.headers['user-agent'],
      'referer': req.headers.referer
    },
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
    correlationId,
    availableRoutes: req.app._router ? 'Use swagger /api-docs for available routes' : undefined
  };

  logger.warn(`Route Not Found: ${req.method} ${req.originalUrl || req.url}`, notFoundContext);

  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl || req.url}`);
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
 * Captura erros de parsing e log detalhado
 */
export const jsonErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (
    error instanceof SyntaxError &&
    typeof (error as any).status === 'number' &&
    (error as any).status === 400 &&
    'body' in error
  ) {
    const logger = Logger.getInstance();
    const correlationId = req.correlationId || 'unknown';

    const jsonErrorContext = {
      method: req.method,
      url: req.originalUrl || req.url,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      ip: req.ip,
      timestamp: new Date().toISOString(),
      correlationId,
      error: {
        type: 'JSON_PARSE_ERROR',
        name: error.name,
        message: error.message,
        position: (error as any).body
      }
    };

    logger.warn(`JSON Parse Error: Malformed request body`, jsonErrorContext);

    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON format in request',
        details: {
          hint: 'Check the JSON syntax sent',
          contentType: req.headers['content-type']
        },
        timestamp: new Date().toISOString(),
        correlationId,
        path: req.path
      }
    });
  }
  next(error);
};