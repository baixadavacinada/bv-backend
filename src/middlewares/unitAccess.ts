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
 * Middleware to enforce unit-level access control
 * 
 * Validates that:
 * 1. User with 'admin' role AND scope 'global' → access any unit
 * 2. User with 'admin' role AND scope 'unit_scoped' → access only if unit in assignedUnitsIds
 * 3. User with 'agent' role → access only if unit in assignedUnitsIds
 * 4. User with 'public' role → access DENIED (403)
 * 
 * @param options Configuration for unit access validation
 * @returns Middleware function
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

      /**
       * Admin role validation
       */
      if (req.user.role === 'admin') {
        try {
          /**
           * Fetch user from database to check adminScope
           */
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

          /**
           * Check for global admin scope (new system) or legacy admin with no scope restriction
           */
          const adminScope = (mongoUser as any).adminScope || 'global';

          if (adminScope === 'global' || allowAdminBypass) {
            logger.info('Unit access granted - admin with global scope', {
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

            /**
             * Normalize unit IDs for comparison (handle ObjectId vs string)
             */
            const userCanAccessUnit = assignedUnitIds.some(id => {
              const idString = id.toString();
              return idString === unitId;
            });

            if (!userCanAccessUnit) {
              logger.warn('Unit access denied - unit not in assignedUnitsIds', {
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

            logger.info('Unit access granted - admin with unit scope', {
              uid: req.user.id,
              email: req.user.email,
              role: req.user.role,
              adminScope,
              unitId,
              method: req.method,
              path: req.path
            });

            /**
             * Store unit info in request
             */
            (req as any).unitId = unitId;
            (req as any).adminScope = adminScope;

            return next();
          }

          /**
           * Unknown admin scope
           */
          logger.warn('Unit access check - unknown admin scope', {
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

      /**
       * Agent role validation
       */
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

          /**
           * Agent can only access their assigned units
           */
          const agentCanAccessUnit = assignedUnitIds.some(id => {
            const idString = id.toString();
            return idString === unitId;
          });

          if (!agentCanAccessUnit) {
            logger.warn('Unit access denied - agent unit not in assignedUnitsIds', {
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

          logger.info('Unit access granted - agent with assigned unit', {
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
