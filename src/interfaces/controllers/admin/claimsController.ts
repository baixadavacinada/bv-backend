import { Request, Response } from 'express';
import { claimsService, UserRole, Permission } from '../../../services/claimsService';
import { Logger } from '../../../middlewares/logging';

const logger = Logger.getInstance();

export interface UpdateClaimsRequest {
  uid: string;
  role?: UserRole;
  permissions?: Permission[];
  ubsId?: string;
  isActive?: boolean;
}

export interface BulkUpdateClaimsRequest {
  updates: {
    uid: string;
    role?: UserRole;
    permissions?: Permission[];
    ubsId?: string;
    isActive?: boolean;
  }[];
}

/**
 * Atualiza claims de um usuário específico
 */
export const updateUserClaims = async (req: Request, res: Response) => {
  try {
    const { uid, role, permissions, ubsId, isActive }: UpdateClaimsRequest = req.body;
    
    if (!uid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User UID is required'
        }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const claimsUpdate: any = {};
    
    if (role !== undefined) claimsUpdate.role = role;
    if (permissions !== undefined) claimsUpdate.permissions = permissions;
    if (ubsId !== undefined) claimsUpdate.ubsId = ubsId;
    if (isActive !== undefined) claimsUpdate.isActive = isActive;

    const updatedClaims = await claimsService.updateUserClaims(
      uid,
      claimsUpdate,
      req.user.id
    );

    logger.info('User claims updated via API', {
      targetUid: uid,
      adminUid: req.user.id,
      changes: claimsUpdate
    });

    res.json({
      success: true,
      data: {
        uid,
        claims: updatedClaims,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error updating user claims', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update user claims'
      }
    });
  }
};

/**
 * Busca claims de um usuário específico
 */
export const getUserClaims = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User UID is required'
        }
      });
    }

    const claims = await claimsService.getUserClaims(uid);

    res.json({
      success: true,
      data: {
        uid,
        claims
      }
    });
  } catch (error: any) {
    logger.error('Error getting user claims', error);

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get user claims'
      }
    });
  }
};

/**
 * Atualiza role de um usuário (shortcut para mudança de role)
 */
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { uid, role }: { uid: string; role: UserRole } = req.body;

    if (!uid || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User UID and role are required'
        }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const updatedClaims = await claimsService.updateUserRole(
      uid,
      role,
      req.user.id
    );

    logger.info('User role updated via API', {
      targetUid: uid,
      adminUid: req.user.id,
      newRole: role
    });

    res.json({
      success: true,
      data: {
        uid,
        claims: updatedClaims,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error updating user role', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update user role'
      }
    });
  }
};

/**
 * Desativa um usuário
 */
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User UID is required'
        }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const updatedClaims = await claimsService.deactivateUser(uid, req.user.id);

    logger.info('User deactivated via API', {
      targetUid: uid,
      adminUid: req.user.id
    });

    res.json({
      success: true,
      data: {
        uid,
        claims: updatedClaims,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error deactivating user', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to deactivate user'
      }
    });
  }
};

/**
 * Reativa um usuário
 */
export const reactivateUser = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User UID is required'
        }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const updatedClaims = await claimsService.reactivateUser(uid, req.user.id);

    logger.info('User reactivated via API', {
      targetUid: uid,
      adminUid: req.user.id
    });

    res.json({
      success: true,
      data: {
        uid,
        claims: updatedClaims,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error reactivating user', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to reactivate user'
      }
    });
  }
};

/**
 * Atualização em lote de múltiplos usuários
 */
export const bulkUpdateClaims = async (req: Request, res: Response) => {
  try {
    const { updates }: BulkUpdateClaimsRequest = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Updates array is required and must not be empty'
        }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { uid, ...claimsUpdate } = update;
        
        const updatedClaims = await claimsService.updateUserClaims(
          uid,
          claimsUpdate,
          req.user.id
        );

        results.push({
          uid,
          success: true,
          claims: updatedClaims
        });
      } catch (error) {
        errors.push({
          uid: update.uid,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Bulk claims update completed', {
      adminUid: req.user.id,
      totalUpdates: updates.length,
      successful: results.length,
      failed: errors.length
    });

    res.json({
      success: true,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: updates.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error: any) {
    logger.error('Error in bulk claims update', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to perform bulk update'
      }
    });
  }
};