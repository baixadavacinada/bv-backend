import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase';
import { Logger } from './logging';
import { claimsService, UserRole, Permission, UserClaims } from '../services/claimsService';

const logger = Logger.getInstance();

declare global {
  namespace Express {
    interface Request {
      userClaims?: UserClaims; // Nova propriedade para claims avançadas
    }
  }
}

export interface AuthOptions {
  required?: boolean;
  roles?: UserRole[];
  permissions?: Permission[];
  allowInactive?: boolean;
}

/**
 * Middleware avançado de autenticação Firebase com sistema de claims
 */
export function firebaseAuthAdvanced(options: AuthOptions = { required: true }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      // Verifica se token está presente
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.required) {
          logger.warn('Firebase auth failed: Missing authorization header', {
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

      // Verifica token Firebase
      const auth = getFirebaseAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Busca claims atualizadas do usuário
      const userClaims = await claimsService.getUserClaims(decodedToken.uid);
      
      // Verifica se usuário está ativo
      if (!userClaims.isActive && !options.allowInactive) {
        logger.warn('Inactive user attempted access', {
          uid: decodedToken.uid,
          email: decodedToken.email,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'Account is deactivated'
          }
        });
      }

      // Verifica roles se especificadas
      if (options.roles && options.roles.length > 0) {
        const hasValidRole = await claimsService.hasRole(decodedToken.uid, options.roles[0]);
        
        if (!hasValidRole) {
          logger.warn('Insufficient role access', {
            uid: decodedToken.uid,
            currentRole: userClaims.role,
            requiredRoles: options.roles,
            path: req.path
          });
          
          return res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_ROLE',
              message: `Access denied. Required roles: ${options.roles.join(', ')}`
            }
          });
        }
      }

      // Verifica permissões se especificadas
      if (options.permissions && options.permissions.length > 0) {
        const hasAllPermissions = options.permissions.every(
          permission => userClaims.permissions.includes(permission)
        );
        
        if (!hasAllPermissions) {
          logger.warn('Insufficient permissions', {
            uid: decodedToken.uid,
            currentPermissions: userClaims.permissions,
            requiredPermissions: options.permissions,
            path: req.path
          });
          
          return res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: `Missing required permissions: ${options.permissions.join(', ')}`
            }
          });
        }
      }

      // Anexa dados do usuário na requisição (mantém compatibilidade com interface existente)
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email || '',
        role: userClaims.role,
        firebaseUid: decodedToken.uid
      };

      // Anexa claims avançadas em propriedade separada
      req.userClaims = userClaims;

      logger.info('Firebase authentication successful', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userClaims.role,
        permissionsCount: userClaims.permissions.length,
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

/**
 * Middlewares pré-configurados para casos comuns
 */

// Autenticação obrigatória
export const requireAuth = firebaseAuthAdvanced({ required: true });

// Apenas admins
export const requireAdmin = firebaseAuthAdvanced({ 
  required: true, 
  roles: ['admin'] 
});

// Admin ou agente
export const requireAdminOrAgent = firebaseAuthAdvanced({ 
  required: true, 
  roles: ['admin', 'agent'] 
});

// Autenticação opcional
export const optionalAuth = firebaseAuthAdvanced({ required: false });

// Verificação de permissão específica
export const requirePermission = (...permissions: Permission[]) => 
  firebaseAuthAdvanced({ 
    required: true, 
    permissions 
  });

// Gerenciamento de usuários
export const requireUserManagement = firebaseAuthAdvanced({ 
  required: true, 
  permissions: ['write_users'] 
});

// Gerenciamento de UBS
export const requireHealthUnitManagement = firebaseAuthAdvanced({ 
  required: true, 
  permissions: ['write_health_units'] 
});

// Edição de vacinas
export const requireVaccineManagement = firebaseAuthAdvanced({ 
  required: true, 
  permissions: ['write_vaccines'] 
});

// Visualização de relatórios
export const requireReportsAccess = firebaseAuthAdvanced({ 
  required: true, 
  permissions: ['read_appointments'] 
});