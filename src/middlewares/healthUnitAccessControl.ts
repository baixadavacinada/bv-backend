import { Request, Response, NextFunction } from 'express';
import { MongoUserRepository } from '../../infrastructure/database/implementations/MongoUserRepository';

const userRepository = new MongoUserRepository();

/**
 * Valida se o usuário tem permissão para acessar a UBS especificada
 * - Admins com escopo 'global' podem acessar qualquer UBS
 * - Agents/Profissionais devem estar vinculados à UBS
 */
export async function validateHealthUnitAccess(
  userId: string,
  userRole: string,
  healthUnitId: string,
  ubsIdField: string = 'assignedUnitsIds'
): Promise<boolean> {
  try {
    // Se for admin, verificar scope
    if (userRole === 'admin') {
      const user = await userRepository.findById(userId);
      // Admins com escopo 'global' têm acesso total
      if (!user?.adminScope || user.adminScope === 'global') {
        return true;
      }
      // Admins com escopo 'unit_scoped' também devem estar vinculados
    }

    // Se for agent ou admin unit_scoped, verificar vinculação
    if (userRole === 'agent' || (userRole === 'admin')) {
      const user = await userRepository.findById(userId);
      
      if (!user?.profile?.assignedUnitsIds || user.profile.assignedUnitsIds.length === 0) {
        return false;
      }

      // Verificar se a UBS está na lista de UBSs vinculadas
      const hasAccess = user.profile.assignedUnitsIds.some(
        (unitId) => unitId.toString() === healthUnitId
      );

      return hasAccess;
    }

    // Public users não têm acesso
    return false;
  } catch (error) {
    console.error('Error validating health unit access:', error);
    return false;
  }
}

/**
 * Middleware para proteger endpoints de UBS por permissão
 */
export function healthUnitAccessMiddleware(ubsIdParam: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      const ubsId = req.params[ubsIdParam];
      if (!ubsId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `UBS ID (${ubsIdParam}) is required`
          }
        });
      }

      const hasAccess = await validateHealthUnitAccess(
        req.user.id,
        req.user.role,
        ubsId
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this health unit'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Error in healthUnitAccessMiddleware:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to validate access'
        }
      });
    }
  };
}
