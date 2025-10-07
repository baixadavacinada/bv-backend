import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../domain/entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        firebaseUid?: string;
      };
    }
  }
}

/**
 * Interface para payload do JWT
 */
interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  firebaseUid?: string;
  iat: number;
  exp: number;
}

/**
 * Middleware de autenticação flexível
 * Suporta JWT tradicional e Firebase (futuro)
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Token de autenticação não fornecido'
      });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        error: 'Invalid authentication format',
        message: 'Formato de autenticação inválido. Use: Bearer <token>'
      });
    }

    const decoded = jwt.verify(token, env.jwtSecret) as JWTPayload;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      firebaseUid: decoded.firebaseUid
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Token expirado. Faça login novamente.'
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token inválido.'
      });
    }

    return res.status(500).json({
      error: 'Authentication error',
      message: 'Erro interno de autenticação.'
    });
  }
};

/**
 * Middleware de autorização baseado em roles (RBAC)
 * Segue o princípio Open/Closed (SOLID)
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Usuário não autenticado.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Acesso negado. Roles permitidas: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se usuário está ativo
 */
export const requireActiveUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Usuário não autenticado.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Authorization error',
      message: 'Erro ao verificar status do usuário.'
    });
  }
};

/**
 * Middleware para verificar ownership de recursos
 * Útil para endpoints como /users/:id onde user só pode acessar próprios dados
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Usuário não autenticado.'
      });
    }

    const resourceId = req.params[resourceIdParam];

    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.id !== resourceId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Você só pode acessar seus próprios recursos.'
      });
    }

    next();
  };
};