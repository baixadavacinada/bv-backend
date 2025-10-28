import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { securityEventLogger } from './logging';

/**
 * Rate Limiting seguindo OWASP guidelines com logs de segurança
 * Protege contra ataques de força bruta e DDoS
 */
export const createRateLimiter = (windowMs: number, max: number, message: string, identifier?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      details: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      securityEventLogger.logRateLimitExceeded(req, max, windowMs);
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          details: {
            limit: max,
            window: windowMs,
            retryAfter: Math.ceil(windowMs / 1000)
          },
          timestamp: new Date().toISOString(),
          correlationId: req.correlationId
        }
      });
    },
    skip: (req: Request) => {
      return req.path === '/api/health';
    }
  });
};

export const authRateLimit = createRateLimiter(
  15 * 60 * 1000,
  5,
  'Too many login attempts. Try again in 15 minutes.'
);

export const generalRateLimit = createRateLimiter(
  15 * 60 * 1000,
  100,
  'Request limit exceeded. Try again in a few minutes.'
);

export const adminRateLimit = createRateLimiter(
  5 * 60 * 1000,
  20,
  'Administrative operations limit exceeded.'
);

export const securityHeaders = helmet({
  contentSecurityPolicy: false, 
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {

        if (typeof key === 'string' && key.startsWith('$')) {
          continue;
        }

        const value = obj[key];
        if (typeof value === 'string') {

          sanitized[key] = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .trim();
        } else if (typeof value === 'object') {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};