import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * Generate a simple UUID v4
 */
const generateUUID = (): string => {
  return crypto.randomUUID();
};

/**
 * Estrutura padronizada de logs seguindo padrões de observabilidade e RFC 5424
 */
export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE';
  correlationId: string;
  service: string;
  environment: string;
  version: string;
  userId?: string;
  userRole?: string;
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip: string;
  message: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Logger com padrões estruturados seguindo observabilidade moderna
 * Implementa structured logging com contexto rico para debugging e monitoramento
 */
class Logger {
  private static instance: Logger;
  private readonly serviceName = 'baixada-vacinada-api';
  private readonly environment = process.env.NODE_ENV || 'development';
  private readonly version = process.env.npm_package_version || '1.0.0';

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createBaseLogEntry(correlationId?: string): Partial<LogEntry> {
    return {
      timestamp: new Date().toISOString(),
      correlationId: correlationId || 'unknown',
      service: this.serviceName,
      environment: this.environment,
      version: this.version,
      method: '',
      url: '',
      ip: ''
    };
  }

  private log(entry: LogEntry): void {
    // Em produção, aqui seria integrado com sistemas como ELK, Datadog, CloudWatch, etc.
    console.log(JSON.stringify(entry));
  }

  public info(message: string, metadata?: Record<string, any>, correlationId?: string, tags?: string[]): void {
    this.log({
      ...this.createBaseLogEntry(correlationId),
      level: 'INFO',
      message,
      metadata,
      tags: tags || ['info']
    } as LogEntry);
  }

  public error(message: string, error?: Error, metadata?: Record<string, any>, correlationId?: string, tags?: string[]): void {
    this.log({
      ...this.createBaseLogEntry(correlationId),
      level: 'ERROR',
      message,
      metadata: {
        ...metadata,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: (error as any).cause
        } : undefined
      },
      tags: tags || ['error', 'alert']
    } as LogEntry);
  }

  public warn(message: string, metadata?: Record<string, any>, correlationId?: string, tags?: string[]): void {
    this.log({
      ...this.createBaseLogEntry(correlationId),
      level: 'WARN',
      message,
      metadata,
      tags: tags || ['warning']
    } as LogEntry);
  }

  public debug(message: string, metadata?: Record<string, any>, correlationId?: string, tags?: string[]): void {
    // Debug logs apenas em desenvolvimento
    if (this.environment === 'development') {
      this.log({
        ...this.createBaseLogEntry(correlationId),
        level: 'DEBUG',
        message,
        metadata,
        tags: tags || ['debug']
      } as LogEntry);
    }
  }

  public trace(message: string, metadata?: Record<string, any>, correlationId?: string, tags?: string[]): void {
    // Trace logs apenas em desenvolvimento com flag específica
    if (this.environment === 'development' && process.env.LOG_LEVEL === 'trace') {
      this.log({
        ...this.createBaseLogEntry(correlationId),
        level: 'TRACE',
        message,
        metadata,
        tags: tags || ['trace']
      } as LogEntry);
    }
  }
}

/**
 * Middleware para correlation ID (rastreamento de requests)
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] as string || generateUUID();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  next();
};

/**
 * Middleware de logging de requests
 * Captura métricas importantes para observabilidade com contexto rico
 */
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const correlationId = req.correlationId || generateUUID();
  const logger = Logger.getInstance();

  // Log detalhado do início da requisição
  const requestStartContext = {
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'accept': req.headers.accept,
      'origin': req.headers.origin,
      'referer': req.headers.referer,
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip']
    },
    ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
    protocol: req.protocol,
    secure: req.secure,
    userId: req.user?.id,
    userRole: req.user?.role,
    bodySize: req.headers['content-length'] ? parseInt(req.headers['content-length']) : undefined
  };

  logger.info(`Request Started`, requestStartContext, correlationId, ['request', 'start']);

  // Interceptar response para log de completion
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseBody: any;
  let responseSize = 0;

  // Override send method
  res.send = function(data) {
    responseBody = data;
    responseSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
    return originalSend.call(this, data);
  };

  // Override json method  
  res.json = function(data) {
    responseBody = data;
    responseSize = JSON.stringify(data).length;
    return originalJson.call(this, data);
  };

  // Log completion quando response finaliza
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    const isServerError = res.statusCode >= 500;

    const requestCompletionContext = {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration,
      durationCategory: duration < 100 ? 'fast' : duration < 500 ? 'normal' : duration < 1000 ? 'slow' : 'very-slow',
      userId: req.user?.id,
      userRole: req.user?.role,
      responseSize,
      responseSizeCategory: responseSize < 1024 ? 'small' : responseSize < 10240 ? 'medium' : 'large',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      headers: {
        'content-type': res.getHeader('content-type'),
        'cache-control': res.getHeader('cache-control'),
        'x-correlation-id': res.getHeader('x-correlation-id')
      },
      performance: {
        duration,
        statusCode: res.statusCode,
        responseSize,
        memoryUsage: process.memoryUsage()
      }
    };

    const tags = ['request', 'complete'];
    if (isError) tags.push('error');
    if (isServerError) tags.push('server-error');
    if (duration > 1000) tags.push('slow-request');

    if (isServerError) {
      logger.error(`Request Failed`, undefined, requestCompletionContext, correlationId, tags);
    } else if (isError) {
      logger.warn(`Request Error`, requestCompletionContext, correlationId, tags);
    } else {
      logger.info(`Request Completed`, requestCompletionContext, correlationId, tags);
    }
  });

  next();
};

/**
 * Middleware de health check com logs estruturados
 */
export const healthCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health' || req.path === '/api/health') {
    const logger = Logger.getInstance();
    const correlationId = req.correlationId || generateUUID();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : undefined,
      pid: process.pid,
      nodeVersion: process.version
    };

    // Log health check access para monitoramento
    logger.info(`Health Check Accessed`, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }, correlationId, ['health', 'monitoring']);

    return res.status(200).json(healthData);
  }
  next();
};

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

/**
 * Middleware especializado para log de eventos de autenticação
 */
export const authLoggingMiddleware = (event: string, success: boolean, userId?: string, details?: Record<string, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const logger = Logger.getInstance();
    const correlationId = req.correlationId || 'unknown';

    const authContext = {
      event,
      success,
      userId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
      url: req.originalUrl || req.url,
      method: req.method,
      details
    };

    if (success) {
      logger.info(`Authentication Event: ${event}`, authContext, correlationId, ['auth', event.toLowerCase(), 'success']);
    } else {
      logger.warn(`Authentication Failed: ${event}`, authContext, correlationId, ['auth', event.toLowerCase(), 'failure', 'security']);
    }

    next();
  };
};

/**
 * Log de eventos de segurança críticos
 */
export const securityEventLogger = {
  logSuspiciousActivity: (req: Request, reason: string, details?: Record<string, any>) => {
    const logger = Logger.getInstance();
    const correlationId = req.correlationId || 'unknown';

    logger.warn(`Security Alert: Suspicious Activity Detected`, {
      reason,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      url: req.originalUrl || req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      details
    }, correlationId, ['security', 'alert', 'suspicious']);
  },

  logRateLimitExceeded: (req: Request, limit: number, window: number) => {
    const logger = Logger.getInstance();
    const correlationId = req.correlationId || 'unknown';

    logger.warn(`Rate Limit Exceeded`, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      url: req.originalUrl || req.url,
      method: req.method,
      limit,
      window,
      timestamp: new Date().toISOString()
    }, correlationId, ['security', 'rate-limit', 'exceeded']);
  },

  logUnauthorizedAccess: (req: Request, reason: string) => {
    const logger = Logger.getInstance();
    const correlationId = req.correlationId || 'unknown';

    logger.warn(`Unauthorized Access Attempt`, {
      reason,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      url: req.originalUrl || req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      headers: {
        authorization: req.headers.authorization ? '[REDACTED]' : 'missing'
      }
    }, correlationId, ['security', 'unauthorized', 'access']);
  }
};

export { Logger };