import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase';
import { Logger } from './logging';
import { UserRole } from '../domain/entities/User';

const logger = Logger.getInstance();

// Firebase user info interface (extended from existing Express Request user)
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

/**
 * Firebase Authentication Middleware
 * Validates Firebase ID tokens and converts to system user format
 * Compatible with existing JWT authentication interface
 */
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
        
        // If auth is optional, continue without user
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

      // Verify the Firebase ID token
      const auth = getFirebaseAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Get additional user info
      const userRecord = await auth.getUser(decodedToken.uid);
      
      // Determine user role from custom claims
      const isAdmin = decodedToken.admin === true || 
                     (decodedToken.customClaims && decodedToken.customClaims.admin === true);
      
      const userRole: UserRole = isAdmin ? 'admin' : 'public';
      
      // Check if admin access is required
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

      // Convert Firebase user to system user format (compatible with existing interface)
      req.user = {
        id: decodedToken.uid, // Map Firebase UID to system ID
        email: decodedToken.email || '', // Ensure email is always string
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
      
      // If auth is optional, continue without user
      next();
    }
  };
}

/**
 * Require Firebase authentication
 */
export const requireAuth = firebaseAuth({ required: true });

/**
 * Require admin authentication
 */
export const requireAdmin = firebaseAuth({ required: true, adminOnly: true });

/**
 * Optional Firebase authentication
 */
export const optionalAuth = firebaseAuth({ required: false });