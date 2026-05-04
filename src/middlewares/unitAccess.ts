import { Request, Response, NextFunction } from 'express';
import { Logger } from './logging';
import { MongoUserRepository } from '../infrastructure/database/implementations/MongoUserRepository';

const logger = Logger.getInstance();
const userRepository = new MongoUserRepository();

export interface UnitAccessOptions {
  /**
   * The request parameter name containing the unit ID (e.g., 'unitId', 'id')
   */
  unitIdParam: string;
  
  /**
   * If true, allows admin role to bypass unit scope check
   * Default: true
   */
  allowAdminBypass?: boolean;
  
  /**
   * Optional list of admin scopes that bypass unit check
   * Example: ['global_admin', 'system_admin']
   */
  bypassScopes?: string[];
}

/**
 * Middleware de controle de acesso por unidade de saúde.
 *
 * Três perfis de acesso:
 * 1. Admin geral (adminScope: 'global') → acessa qualquer UBS
 * 2. Admin de UBS (adminScope: 'unit_scoped') → acessa apenas as UBSs em assignedUnitsIds
 * 3. Profissional de saúde (role: 'agent') → acessa apenas as UBSs em assignedUnitsIds
 * 4. Usuário público (role: 'public') → acesso negado (403)
 *
 * O vínculo entre admin/profissional e UBS é feito pelo admin geral
 * ao definir adminScope e assignedUnitsIds no perfil do usuário.
 *
 * @param options Configuração do parâmetro de ID da unidade
 * @returns Middleware Express
 */
export function requireUnitAccess(options: UnitAccessOptions) {
  const {
    unitIdParam,
    allowAdminBypass = true,
    bypassScopes = ['global_admin', 'system_admin']
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      /**
       * Verify user is authenticated
       */
      if (!req.user) {
        logger.warn('Unit access check - user not authenticated', {
          path: req.path,
          method: req.method,
          ip: req.ip
        });

        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User must be authenticated to access this resource'
          }
        });
      }

      /**
       * Extract unit ID from request parameters
       */
      const unitId = req.params[unitIdParam];

      if (!unitId) {
        console.error('Unit access check - missing unit ID parameter', {
          userId: req.user.id,
          expectedParam: unitIdParam,
          params: req.params,
          path: req.path
        });

        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: `Missing required parameter: ${unitIdParam}`
          }
        });
      }

      /**
       * Public users cannot access unit management
       */
      if (req.user.role === 'public') {
        logger.warn('Unit access denied - insufficient role', {
          uid: req.user.id,
          email: req.user.email,
          role: req.user.role,
          unitId,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_ROLE',
            message: 'Public users cannot access unit management. Contact an administrator if you need access.'
          }
        });
      }

      if (req.user.role === 'admin') {
        try {
          const mongoUser = await userRepository.findById(req.user.id);

          if (!mongoUser) {
            console.error('Unit access check - admin user not found in database', {
              userId: req.user.id,
              email: req.user.email,
              unitId
            });

            return res.status(500).json({
              success: false,
              error: {
                code: 'SERVER_ERROR',
                message: 'Failed to verify access permissions'
              }
            });
          }

          const adminScope = (mongoUser as any).adminScope || 'global';

          if (adminScope === 'global' || allowAdminBypass) {
            logger.info('Acesso liberado - admin geral', {
              uid: req.user.id,
              email: req.user.email,
              role: req.user.role,
              adminScope,
              unitId,
              method: req.method,
              path: req.path
            });

            /**
             * Store unit info in request for controller
             */
            (req as any).unitId = unitId;
            (req as any).adminScope = adminScope;

            return next();
          }

          /**
           * Check unit_scoped admin
           */
          if (adminScope === 'unit_scoped') {
            const assignedUnitIds = mongoUser.profile?.assignedUnitsIds || [];

            const userCanAccessUnit = assignedUnitIds.some(id => {
              const idString = id.toString();
              return idString === unitId;
            });

            if (!userCanAccessUnit) {
              logger.warn('Acesso negado - admin de UBS sem vínculo com esta unidade', {
                uid: req.user.id,
                email: req.user.email,
                role: req.user.role,
                adminScope,
                requestedUnitId: unitId,
                assignedUnits: assignedUnitIds.map(id => id.toString()),
                method: req.method,
                path: req.path
              });

              return res.status(403).json({
                success: false,
                error: {
                  code: 'UNIT_ACCESS_DENIED',
                  message: 'You do not have permission to access this health unit. Contact your administrator if you need access.'
                }
              });
            }

            logger.info('Acesso liberado - admin de UBS com unidade vínculada', {
              uid: req.user.id,
              email: req.user.email,
              role: req.user.role,
              adminScope,
              unitId,
              method: req.method,
              path: req.path
            });

            (req as any).unitId = unitId;
            (req as any).adminScope = adminScope;

            return next();
          }

          logger.warn('Escopo de admin não reconhecido', {
            uid: req.user.id,
            email: req.user.email,
            adminScope,
            unitId
          });

          return res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'Your access permissions could not be determined. Contact an administrator.'
            }
          });
        } catch (dbError) {
          console.error('Unit access check - database error', {
            userId: req.user.id,
            email: req.user.email,
            unitId,
            message: dbError instanceof Error ? dbError.message : String(dbError)
          });

          return res.status(500).json({
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: 'Failed to verify access permissions'
            }
          });
        }
      }

      if (req.user.role === 'agent') {
        try {
          const mongoUser = await userRepository.findById(req.user.id);

          if (!mongoUser) {
            console.error('Unit access check - agent user not found in database', {
              userId: req.user.id,
              email: req.user.email,
              unitId
            });

            return res.status(500).json({
              success: false,
              error: {
                code: 'SERVER_ERROR',
                message: 'Failed to verify access permissions'
              }
            });
          }

          const assignedUnitIds = mongoUser.profile?.assignedUnitsIds || [];

          const agentCanAccessUnit = assignedUnitIds.some(id => {
            const idString = id.toString();
            return idString === unitId;
          });

          if (!agentCanAccessUnit) {
            logger.warn('Acesso negado - profissional não vinculado a esta UBS', {
              uid: req.user.id,
              email: req.user.email,
              role: req.user.role,
              requestedUnitId: unitId,
              assignedUnits: assignedUnitIds.map(id => id.toString()),
              method: req.method,
              path: req.path
            });

            return res.status(403).json({
              success: false,
              error: {
                code: 'UNIT_ACCESS_DENIED',
                message: 'You do not have permission to access this health unit.'
              }
            });
          }

          logger.info('Acesso liberado - profissional vinculado à UBS', {
            uid: req.user.id,
            email: req.user.email,
            role: req.user.role,
            unitId,
            method: req.method,
            path: req.path
          });

          /**
           * Store unit info in request
           */
          (req as any).unitId = unitId;

          return next();
        } catch (dbError) {
          console.error('Unit access check - database error for agent', {
            userId: req.user.id,
            email: req.user.email,
            unitId,
            message: dbError instanceof Error ? dbError.message : String(dbError)
          });

          return res.status(500).json({
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: 'Failed to verify access permissions'
            }
          });
        }
      }

      /**
       * Unknown role
       */
      logger.warn('Unit access check - unknown role', {
        uid: req.user.id,
        email: req.user.email,
        role: req.user.role,
        unitId
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Your role does not have permission to access this resource'
        }
      });
    } catch (error) {
      console.error('Fatal error in unit access middleware', {
        userId: req.user?.id,
        email: req.user?.email,
        unitIdParam,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process request'
        }
      });
    }
  };
}

/**
 * Export middleware factory for easier use
 */
export const unitAccessMiddleware = requireUnitAccess;
