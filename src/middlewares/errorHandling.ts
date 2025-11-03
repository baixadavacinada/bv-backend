import { Request, Response, NextFunction } from 'express';
import { Logger } from './logging';

/**
 * RFC 7807 - Problem Details for HTTP APIs
 * Interface padrão para respostas de erro seguindo especificação REST
 */
export interface ProblemDetails {
  type: string; // URI que identifica o tipo de problema
  title: string; // Resumo legível do tipo de problema
  status: number; // Código HTTP
  detail?: string; // Explicação específica do problema
  instance?: string; // URI que identifica a instância (correlationId)
  code?: string; // Código de erro interno para tracking
  timestamp?: string; // ISO timestamp
  path?: string; // Caminho da requisição
  [key: string]: any; // Propriedades customizadas específicas do erro
}

/**
 * Classe de erro customizada seguindo padrões REST e RFC 7807
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;
  public readonly errorType: string; // RFC 7807 type

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, any>,
    errorType: string = 'about:blank'
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.errorType = errorType;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converte o erro para formato RFC 7807
   */
  public toProblemDetails(correlationId: string, path: string): ProblemDetails {
    return {
      type: this.errorType,
      title: this.getTitleFromCode(),
      status: this.statusCode,
      detail: this.message,
      instance: correlationId,
      code: this.code,
      timestamp: new Date().toISOString(),
      path,
      ...(this.details && { ...this.details })
    };
  }

  private getTitleFromCode(): string {
    const titles: Record<string, string> = {
      'VALIDATION_ERROR': 'Validation Failed',
      'NOT_FOUND': 'Resource Not Found',
      'UNAUTHORIZED': 'Authentication Required',
      'FORBIDDEN': 'Access Denied',
      'CONFLICT': 'Conflict',
      'INTERNAL_ERROR': 'Internal Server Error',
      'INVALID_TOKEN': 'Invalid Token',
      'TOKEN_EXPIRED': 'Token Expired',
      'DUPLICATE_KEY': 'Resource Already Exists'
    };
    return titles[this.code] || 'Error';
  }
}


/**
 * Erros específicos para diferentes cenários com mapeamento RFC 7807
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      400,
      'VALIDATION_ERROR',
      true,
      details,
      'https://api.baixada-vacinada.com/errors/validation'
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(
      `${resource} not found`,
      404,
      'NOT_FOUND',
      true,
      { resource },
      'https://api.baixada-vacinada.com/errors/not-found'
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(
      message,
      401,
      'UNAUTHORIZED',
      true,
      undefined,
      'https://api.baixada-vacinada.com/errors/unauthorized'
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(
      message,
      403,
      'FORBIDDEN',
      true,
      undefined,
      'https://api.baixada-vacinada.com/errors/forbidden'
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      409,
      'CONFLICT',
      true,
      details,
      'https://api.baixada-vacinada.com/errors/conflict'
    );
  }
}


/**
 * Coleta contexto estruturado de requisição para logging
 */
const getRequestContext = (req: Request) => ({
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
  timestamp: new Date().toISOString()
});

/**
 * Enriquece contexto com detalhes do erro para logging estruturado
 */
const enrichErrorContext = (
  baseContext: any,
  error: Error | AppError,
  errorType: string,
  additionalInfo?: Record<string, any>
) => ({
  ...baseContext,
  error: {
    type: errorType,
    name: error.name,
    code: (error as AppError).code || 'UNKNOWN',
    message: error.message,
    stack: process.env.NODE_ENV === 'development' 
      ? error.stack?.split('\n').slice(0, 10)
      : undefined,
    ...additionalInfo
  }
});

/**
 * Middleware global de tratamento de erros seguindo RFC 7807
 * Centraliza todo o handling com logs estruturados e respostas padronizadas
 */
export const errorHandlingMiddleware = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger = Logger.getInstance();
  const correlationId = req.correlationId || 'unknown';
  const requestContext = getRequestContext(req);

  if (error instanceof AppError) {
    const enrichedContext = enrichErrorContext(
      { ...requestContext, correlationId },
      error,
      'OPERATIONAL',
      {
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        details: error.details
      }
    );

    // Log apropriado baseado no status code
    if (error.statusCode >= 500) {
      logger.error(`[${error.code}] Server Error: ${error.message}`, error, enrichedContext);
    } else if (error.statusCode >= 400) {
      logger.warn(`[${error.code}] Client Error: ${error.message}`, enrichedContext);
    }

    const problemDetails = error.toProblemDetails(correlationId, req.path);
    res.status(error.statusCode).set('Content-Type', 'application/problem+json').json(problemDetails);
    return;
  }

  // Erro de validação MongoDB
  if (error.name === 'ValidationError') {
    const mongoError = error as any;
    const validationErrors: Record<string, string> = {};

    for (const field in mongoError.errors) {
      validationErrors[field] = mongoError.errors[field].message;
    }

    const enrichedContext = enrichErrorContext(
      { ...requestContext, correlationId },
      error,
      'VALIDATION',
      {
        validationErrors,
        errorCount: Object.keys(validationErrors).length
      }
    );

    logger.warn(`[VALIDATION_ERROR] Invalid request data`, enrichedContext);

    const problemDetails: ProblemDetails = {
      type: 'https://api.baixada-vacinada.com/errors/validation',
      title: 'Validation Failed',
      status: 400,
      detail: 'The request contains invalid data',
      instance: correlationId,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path,
      fields: validationErrors
    };

    res.status(400).set('Content-Type', 'application/problem+json').json(problemDetails);
    return;
  }

  // Erro de chave duplicada MongoDB
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    const duplicateError = error as any;
    const field = Object.keys(duplicateError.keyPattern)[0];
    const value = duplicateError.keyValue[field];

    const enrichedContext = enrichErrorContext(
      { ...requestContext, correlationId },
      error,
      'DUPLICATE_KEY',
      {
        field,
        value: typeof value === 'string' ? value.substring(0, 50) : value,
        mongoCode: duplicateError.code
      }
    );

    logger.warn(`[DUPLICATE_KEY] Resource already exists`, enrichedContext);

    const problemDetails: ProblemDetails = {
      type: 'https://api.baixada-vacinada.com/errors/conflict',
      title: 'Resource Already Exists',
      status: 409,
      detail: `Resource with ${field} already exists in database`,
      instance: correlationId,
      code: 'DUPLICATE_KEY',
      timestamp: new Date().toISOString(),
      path: req.path,
      conflictField: field
    };

    res.status(409).set('Content-Type', 'application/problem+json').json(problemDetails);
    return;
  }

  // Erro de token JWT inválido
  if (error.name === 'JsonWebTokenError') {
    const enrichedContext = enrichErrorContext(
      { ...requestContext, correlationId },
      error,
      'JWT_ERROR',
      {
        statusCode: 401
      }
    );

    logger.warn(`[INVALID_TOKEN] Invalid JWT token`, enrichedContext);

    const problemDetails: ProblemDetails = {
      type: 'https://api.baixada-vacinada.com/errors/unauthorized',
      title: 'Authentication Required',
      status: 401,
      detail: 'The provided authentication token is invalid',
      instance: correlationId,
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString(),
      path: req.path
    };

    res.status(401).set('Content-Type', 'application/problem+json').json(problemDetails);
    return;
  }

  // Erro de token expirado
  if (error.name === 'TokenExpiredError') {
    const expiredAt = (error as any).expiredAt;
    const enrichedContext = enrichErrorContext(
      { ...requestContext, correlationId },
      error,
      'JWT_EXPIRED',
      {
        statusCode: 401,
        expiredAt
      }
    );

    logger.warn(`[TOKEN_EXPIRED] JWT token has expired`, enrichedContext);

    const problemDetails: ProblemDetails = {
      type: 'https://api.baixada-vacinada.com/errors/unauthorized',
      title: 'Token Expired',
      status: 401,
      detail: 'The authentication token has expired',
      instance: correlationId,
      code: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString(),
      path: req.path,
      expiredAt
    };

    res.status(401).set('Content-Type', 'application/problem+json').json(problemDetails);
    return;
  }

  // Erro crítico não tratado
  const enrichedContext = enrichErrorContext(
    { ...requestContext, correlationId },
    error,
    'UNHANDLED',
    {
      statusCode: 500,
      constructor: error.constructor.name,
      requestBody: req.body ? JSON.stringify(req.body).substring(0, 1000) : undefined,
      requestParams: req.params
    }
  );

  logger.error(`[INTERNAL_ERROR] Unhandled critical error: ${error.message}`, error, enrichedContext);

  if (process.env.NODE_ENV === 'production') {
    logger.error(`[ALERT] Production error requires immediate investigation`, error, {
      severity: 'CRITICAL',
      requiresInvestigation: true,
      ...enrichedContext
    });
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  const problemDetails: ProblemDetails = {
    type: 'https://api.baixada-vacinada.com/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: isDevelopment 
      ? error.message 
      : 'An unexpected error occurred. Please contact support if the problem persists.',
    instance: correlationId,
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(isDevelopment && {
      debugInfo: {
        errorName: error.name,
        stack: error.stack?.split('\n').slice(0, 5)
      }
    })
  };

  res.status(500).set('Content-Type', 'application/problem+json').json(problemDetails);
};

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
    correlationId
  };

  logger.warn(`[ROUTE_NOT_FOUND] Requested route does not exist: ${req.method} ${req.originalUrl}`, notFoundContext);

  const problemDetails: ProblemDetails = {
    type: 'https://api.baixada-vacinada.com/errors/not-found',
    title: 'Endpoint Not Found',
    status: 404,
    detail: `The endpoint ${req.method} ${req.originalUrl} does not exist. Check the API documentation at /api-docs for available routes.`,
    instance: correlationId,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  res.status(404).set('Content-Type', 'application/problem+json').json(problemDetails);
};


export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};


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
        message: error.message
      }
    };

    logger.warn(`[INVALID_JSON] Malformed JSON in request body`, jsonErrorContext);

    const problemDetails: ProblemDetails = {
      type: 'https://api.baixada-vacinada.com/errors/validation',
      title: 'Invalid JSON Format',
      status: 400,
      detail: 'The request body contains invalid JSON',
      instance: correlationId,
      code: 'INVALID_JSON',
      timestamp: new Date().toISOString(),
      path: req.path,
      hint: 'Verify the JSON syntax and Content-Type header is application/json'
    };

    return res.status(400).set('Content-Type', 'application/problem+json').json(problemDetails);
  }
  next(error);
};