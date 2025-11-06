import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase';
import { Logger } from './logging';
import { UserRole } from '../domain/entities/User';

const logger = Logger.getInstance();

export interface FirebaseUserInfo {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
  customClaims?: { [key: string]: any };
}

export interface FirebaseAuthOptions {
  required?: boolean;
  adminOnly?: boolean;
}

export function firebaseAuth(options: FirebaseAuthOptions = { required: true }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.required) {
          logger.warn('Firebase auth failed: Missing or invalid authorization header', {
            path: req.path,
            method: req.method,
            ip: req.ip
          });
          
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authorization header with Bearer token is required'
            }
          });
        }
        
        return next();
      }

      const idToken = authHeader.split(' ')[1];
      
      if (!idToken) {
        if (options.required) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Bearer token is required'
            }
          });
        }
        return next();
      }

      // Validate token format (JWT has 3 parts separated by dots)
      if (typeof idToken !== 'string' || idToken.split('.').length !== 3) {
        logger.warn('Invalid token format', {
          path: req.path,
          method: req.method,
          tokenLength: idToken?.length || 0
        });

        if (options.required) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_TOKEN_FORMAT',
              message: 'Token must be a valid JWT'
            }
          });
        }
        return next();
      }

      const auth = getFirebaseAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      
      const userRecord = await auth.getUser(decodedToken.uid);
      
      const isAdmin = decodedToken.admin === true || 
                     (decodedToken.customClaims && decodedToken.customClaims.admin === true);
      
      const userRole: UserRole = isAdmin ? 'admin' : 'public';
      
      if (options.adminOnly && userRole !== 'admin') {
        logger.warn('Firebase auth failed: Admin access required', {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: userRole,
          path: req.path,
          method: req.method
        });
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }
        });
      }

      req.user = {
        id: decodedToken.uid, 
        email: decodedToken.email || '', 
        role: userRole,
        firebaseUid: decodedToken.uid
      };

      logger.info('Firebase authentication successful', {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      logger.error('Firebase authentication error', error instanceof Error ? error : new Error(String(error)));
      
      if (options.required) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token'
          }
        });
      }
      
      next();
    }
  };
}

export const requireAuth = firebaseAuth({ required: true });

export const requireAdmin = firebaseAuth({ required: true, adminOnly: true });

export const optionalAuth = firebaseAuth({ required: false });