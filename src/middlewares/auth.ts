import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../domain/entities/User';
import { securityEventLogger } from './logging';
import { UnauthorizedError, ForbiddenError } from './errorHandling';

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


interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  firebaseUid?: string;
  iat: number;
  exp: number;
}


export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      securityEventLogger.logUnauthorizedAccess(req, 'Missing authorization header');
      throw new UnauthorizedError('Authentication token not provided');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      securityEventLogger.logUnauthorizedAccess(req, 'Invalid authorization format');
      throw new UnauthorizedError('Invalid authentication format. Use: Bearer <token>');
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
      securityEventLogger.logUnauthorizedAccess(req, 'Token expired');
      throw new UnauthorizedError('Token expired. Please login again.');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      securityEventLogger.logUnauthorizedAccess(req, `Invalid token: ${error.message}`);
      throw new UnauthorizedError('Invalid token');
    }

    throw error;
  }
};


export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      securityEventLogger.logUnauthorizedAccess(req, 'User not authenticated for role check');
      throw new UnauthorizedError('User not authenticated.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      securityEventLogger.logUnauthorizedAccess(req, `Insufficient role: ${req.user.role}, required: ${allowedRoles.join(', ')}`);
      throw new ForbiddenError(`Access denied. Allowed roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};


export const requireActiveUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      securityEventLogger.logUnauthorizedAccess(req, 'User not authenticated for active check');
      throw new UnauthorizedError('User not authenticated.');
    }

    next();
  } catch (error) {
    throw error;
  }
};


export const requireOwnership = (resourceIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated.'
      });
    }

    const resourceId = req.params[resourceIdParam];

    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.id !== resourceId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources.'
      });
    }

    next();
  };
};