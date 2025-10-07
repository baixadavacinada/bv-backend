import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate Limiting seguindo OWASP guidelines
 * Protege contra ataques de força bruta e DDoS
 */
export const createRateLimiter = (windowMs: number, max: number, message: string) => {
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

  });
};

export const authRateLimit = createRateLimiter(
  15 * 60 * 1000,
  5,
  'Muitas tentativas de login. Tente novamente em 15 minutos.'
);

export const generalRateLimit = createRateLimiter(
  15 * 60 * 1000,
  100,
  'Limite de requisições excedido. Tente novamente em alguns minutos.'
);

export const adminRateLimit = createRateLimiter(
  5 * 60 * 1000,
  20,
  'Limite de operações administrativas excedido.'
);

/**
 * Helmet configuration seguindo OWASP Security Headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Request sanitization middleware
 * Remove potenciais payloads maliciosos
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {

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