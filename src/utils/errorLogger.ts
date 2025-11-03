/**
 * Utilitário para logging estruturado de erros seguindo padrões RESTful
 * Garante consistência e rastreabilidade de todos os erros da aplicação
 */

import { Logger } from '../middlewares/logging';
import { Request } from 'express';

export interface ErrorLogPayload {
  correlationId: string;
  errorCode: string;
  errorType: 'VALIDATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL' | 'EXTERNAL';
  statusCode: number;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  userRole?: string;
  endpoint: string;
  method: string;
  duration?: number;
  requestBody?: any;
  stackTrace?: string[];
}

export class ErrorLogger {
  private static logger = Logger.getInstance();

  /**
   * Log de erro de validação (400)
   */
  static logValidationError(
    correlationId: string,
    message: string,
    details: Record<string, any>,
    req?: Request
  ): void {
    const payload: ErrorLogPayload = {
      correlationId,
      errorCode: 'VALIDATION_ERROR',
      errorType: 'VALIDATION',
      statusCode: 400,
      message,
      details,
      userId: req?.user?.id,
      userRole: req?.user?.role,
      endpoint: req?.path || 'unknown',
      method: req?.method || 'unknown'
    };

    this.logger.warn(`[VALIDATION_ERROR] ${message}`, payload, correlationId, [
      'validation',
      'client-error',
      'fields'
    ]);
  }

  /**
   * Log de erro de autenticação (401)
   */
  static logAuthenticationError(
    correlationId: string,
    message: string,
    reason: string,
    req?: Request
  ): void {
    const payload: ErrorLogPayload = {
      correlationId,
      errorCode: 'AUTHENTICATION_ERROR',
      errorType: 'AUTHENTICATION',
      statusCode: 401,
      message,
      details: { reason },
      userId: req?.user?.id,
      endpoint: req?.path || 'unknown',
      method: req?.method || 'unknown'
    };

    this.logger.warn(`[AUTHENTICATION_ERROR] ${message}`, payload, correlationId, [
      'authentication',
      'security',
      'client-error'
    ]);
  }

  /**
   * Log de erro de autorização (403)
   */
  static logAuthorizationError(
    correlationId: string,
    message: string,
    requiredRole: string,
    userRole: string,
    req?: Request
  ): void {
    const payload: ErrorLogPayload = {
      correlationId,
      errorCode: 'AUTHORIZATION_ERROR',
      errorType: 'AUTHORIZATION',
      statusCode: 403,
      message,
      details: {
        requiredRole,
        userRole,
        resource: req?.path
      },
      userId: req?.user?.id,
      userRole: userRole,
      endpoint: req?.path || 'unknown',
      method: req?.method || 'unknown'
    };

    this.logger.warn(`[AUTHORIZATION_ERROR] ${message}`, payload, correlationId, [
      'authorization',
      'security',
      'access-denied'
    ]);
  }

  /**
   * Log de recurso não encontrado (404)
   */
  static logNotFoundError(
    correlationId: string,
    resourceType: string,
    resourceId: string,
    req?: Request
  ): void {
    const payload: ErrorLogPayload = {
      correlationId,
      errorCode: 'NOT_FOUND',
      errorType: 'NOT_FOUND',
      statusCode: 404,
      message: `${resourceType} with ID ${resourceId} not found`,
      details: {
        resourceType,
        resourceId,
        searchedIn: req?.path
      },
      userId: req?.user?.id,
      endpoint: req?.path || 'unknown',
      method: req?.method || 'unknown'
    };

    this.logger.warn(`[NOT_FOUND] ${resourceType} not found: ${resourceId}`, payload, correlationId, [
      'not-found',
      'client-error',
      'resource'
    ]);
  }

  /**
   * Log de conflito (409) - ex: recurso duplicado
   */
  static logConflictError(
    correlationId: string,
    message: string,
    conflictField: string,
    conflictValue: any,
    req?: Request
  ): void {
    const payload: ErrorLogPayload = {
      correlationId,
      errorCode: 'CONFLICT_ERROR',
      errorType: 'CONFLICT',
      statusCode: 409,
      message,
      details: {
        conflictField,
        conflictValue: typeof conflictValue === 'string' ? conflictValue.substring(0, 100) : conflictValue
      },
      userId: req?.user?.id,
      endpoint: req?.path || 'unknown',
      method: req?.method || 'unknown'
    };

    this.logger.warn(`[CONFLICT_ERROR] ${message}`, payload, correlationId, [
      'conflict',
      'client-error',
      'duplicate'
    ]);
  }

  /**
   * Log de erro externo (500, 502, 503, 504) - chamadas para serviços externos
   */
  static logExternalServiceError(
    correlationId: string,
    serviceName: string,
    statusCode: number,
    message: string,
    details?: Record<string, any>,
    req?: Request
  ): void {
    const payload: ErrorLogPayload = {
      correlationId,
      errorCode: `EXTERNAL_SERVICE_ERROR_${statusCode}`,
      errorType: 'EXTERNAL',
      statusCode,
      message: `Error calling external service: ${serviceName}`,
      details: {
        serviceName,
        originalStatusCode: statusCode,
        error: message,
        ...details
      },
      userId: req?.user?.id,
      endpoint: req?.path || 'unknown',
      method: req?.method || 'unknown'
    };

    this.logger.error(`[EXTERNAL_SERVICE_ERROR] ${serviceName} error (${statusCode})`, new Error(message), payload, correlationId, [
      'external-service',
      'integration',
      'third-party'
    ]);
  }

  /**
   * Log de erro crítico não tratado (500)
   */
  static logCriticalError(
    correlationId: string,
    message: string,
    error: Error,
    context?: Record<string, any>,
    req?: Request,
    duration?: number
  ): void {
    const stackTrace = error.stack?.split('\n').slice(0, 15);

    const payload: ErrorLogPayload = {
      correlationId,
      errorCode: 'INTERNAL_SERVER_ERROR',
      errorType: 'INTERNAL',
      statusCode: 500,
      message,
      details: {
        errorName: error.name,
        errorMessage: error.message,
        ...context
      },
      userId: req?.user?.id,
      endpoint: req?.path || 'unknown',
      method: req?.method || 'unknown',
      duration,
      stackTrace
    };

    this.logger.error(`[INTERNAL_SERVER_ERROR] ${message}`, error, payload, correlationId, [
      'critical',
      'server-error',
      'requires-investigation'
    ]);

    // Em produção, log adicional para monitoramento
    if (process.env.NODE_ENV === 'production') {
      this.logger.error(`[ALERT] PRODUCTION CRITICAL ERROR - REQUIRES IMMEDIATE ATTENTION`, error, {
        ...payload,
        severity: 'CRITICAL',
        timestamp: new Date().toISOString(),
        hostname: process.env.HOSTNAME || 'unknown'
      }, correlationId, ['production-alert', 'critical']);
    }
  }

  /**
   * Log de timeout
   */
  static logTimeoutError(
    correlationId: string,
    endpoint: string,
    timeoutMs: number,
    req?: Request
  ): void {
    const payload: ErrorLogPayload = {
      correlationId,
      errorCode: 'REQUEST_TIMEOUT',
      errorType: 'INTERNAL',
      statusCode: 504,
      message: `Request timeout after ${timeoutMs}ms`,
      details: {
        endpoint,
        timeoutMs
      },
      userId: req?.user?.id,
      endpoint: req?.path || endpoint,
      method: req?.method || 'unknown',
      duration: timeoutMs
    };

    this.logger.warn(`[REQUEST_TIMEOUT] ${endpoint} timeout after ${timeoutMs}ms`, payload, correlationId, [
      'timeout',
      'performance',
      'monitoring'
    ]);
  }

  /**
   * Log de uso excessivo de recursos (rate limit, etc)
   */
  static logRateLimitError(
    correlationId: string,
    userId: string | undefined,
    endpoint: string,
    limit: number,
    windowMs: number,
    req?: Request
  ): void {
    const payload: ErrorLogPayload = {
      correlationId,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      errorType: 'AUTHENTICATION',
      statusCode: 429,
      message: `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      details: {
        endpoint,
        limit,
        windowMs
      },
      userId,
      endpoint: req?.path || endpoint,
      method: req?.method || 'unknown'
    };

    this.logger.warn(`[RATE_LIMIT_EXCEEDED] User ${userId || 'anonymous'} exceeded rate limit`, payload, correlationId, [
      'rate-limit',
      'security',
      'dos-protection'
    ]);
  }

  /**
   * Log de erro de banco de dados
   */
  static logDatabaseError(
    correlationId: string,
    operation: string,
    error: Error,
    query?: Record<string, any>,
    req?: Request
  ): void {
    const payload: ErrorLogPayload = {
      correlationId,
      errorCode: 'DATABASE_ERROR',
      errorType: 'INTERNAL',
      statusCode: 500,
      message: `Database error during ${operation}`,
      details: {
        operation,
        errorName: error.name,
        errorMessage: error.message,
        query: query ? JSON.stringify(query).substring(0, 200) : undefined
      },
      userId: req?.user?.id,
      endpoint: req?.path || 'unknown',
      method: req?.method || 'unknown',
      stackTrace: process.env.NODE_ENV === 'development' 
        ? error.stack?.split('\n').slice(0, 10)
        : undefined
    };

    this.logger.error(`[DATABASE_ERROR] Error during ${operation}`, error, payload, correlationId, [
      'database',
      'persistence',
      'critical'
    ]);
  }

  /**
   * Log de erro de Firebase
   */
  static logFirebaseError(
    correlationId: string,
    operation: string,
    error: Error,
    req?: Request
  ): void {
    const firebaseError = error as any;
    const payload: ErrorLogPayload = {
      correlationId,
      errorCode: `FIREBASE_ERROR_${firebaseError.code || 'UNKNOWN'}`,
      errorType: 'EXTERNAL',
      statusCode: 500,
      message: `Firebase error during ${operation}`,
      details: {
        operation,
        firebaseCode: firebaseError.code,
        firebaseMessage: firebaseError.message,
        errorName: error.name
      },
      userId: req?.user?.id,
      endpoint: req?.path || 'unknown',
      method: req?.method || 'unknown'
    };

    this.logger.error(`[FIREBASE_ERROR] ${operation} failed`, error, payload, correlationId, [
      'firebase',
      'authentication',
      'third-party'
    ]);
  }
}
