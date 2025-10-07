import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Estrutura padronizada de logs seguindo padrões de observabilidade
 */
export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  correlationId: string;
  userId?: string;
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Logger simples (pode ser substituído por Winston/Pino em produção)
 */
class Logger {
  private static instance: Logger;

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(entry: LogEntry): void {

    console.log(JSON.stringify(entry));
  }

  public info(message: string, metadata?: Record<string, any>, correlationId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      correlationId: correlationId || 'unknown',
      method: '',
      url: '',
      ip: '',
      message,
      metadata
    });
  }

  public error(message: string, error?: Error, metadata?: Record<string, any>, correlationId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      correlationId: correlationId || 'unknown',
      method: '',
      url: '',
      ip: '',
      message,
      metadata: {
        ...metadata,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      }
    });
  }

  public warn(message: string, metadata?: Record<string, any>, correlationId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      correlationId: correlationId || 'unknown',
      method: '',
      url: '',
      ip: '',
      message,
      metadata
    });
  }
}

/**
 * Middleware para correlation ID (rastreamento de requests)
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  next();
};

/**
 * Middleware de logging de requests
 * Captura métricas importantes para observabilidade
 */
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const correlationId = req.correlationId || uuidv4();

  Logger.getInstance().info(`Request started`, {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id
  }, correlationId);

  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;

    Logger.getInstance().info(`Request completed`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length
    }, correlationId);

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware de health check
 */
export const healthCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health' || req.path === '/api/health') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
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

export { Logger };