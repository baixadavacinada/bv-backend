import { Request, Response } from 'express';
import { claimsService } from '../../../services/claimsService';
import { Logger } from '../../../middlewares/logging';
import { MongoUserRepository } from '../../../infrastructure/database/implementations/MongoUserRepository';

const logger = Logger.getInstance();
const userRepository = new MongoUserRepository();

export interface CreateProfileRequest {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: 'admin' | 'agent' | 'public';
}

export interface UpdateRoleRequest {
  uid: string;
  role: 'admin' | 'agent' | 'public';
  ubsId?: string;
  isActive?: boolean;
}

export const getProfile = async (req: Request, res: Response) => {
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

    const claims = await claimsService.getUserClaims(req.user.id);
    
    let mongoUser = null;
    try {
      mongoUser = await userRepository.findById(req.user.id);
    } catch {
    }

    const profile = {
      uid: req.user.id,
      email: req.user.email,
      displayName: mongoUser?.name || req.user.email?.split('@')[0] || 'User',
      role: claims.role,
      permissions: claims.permissions,
      ubsId: claims.ubsId,
      isActive: claims.isActive,
      createdAt: mongoUser?.createdAt?.toISOString() || new Date().toISOString(),
      lastSignIn: mongoUser?.lastLoginAt?.toISOString()
    };

    logger.info('Profile retrieved', {
      uid: req.user.id,
      role: claims.role
    });

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error getting profile', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get user profile'
      }
    });
  }
};

export const createProfile = async (req: Request, res: Response) => {
  try {
    const uid = req.user?.id;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { email, displayName }: any = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email is required'
        }
      });
    }

    const existingUser = await userRepository.findById(uid);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User profile already exists'
        }
      });
    }

    const claims = await claimsService.setDefaultClaimsForNewUser(uid);

    try {
      await userRepository.create({
        _id: uid,
        uid: uid,
        name: displayName || email?.split('@')[0] || 'User',
        email: email || '',
        role: claims.role,
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
    } catch (error) {
      logger.warn('User already exists in MongoDB', { uid });
    }

    const profile = {
      uid,
      email,
      displayName: displayName || email?.split('@')[0] || 'User',
      role: claims.role,
      permissions: claims.permissions,
      ubsId: claims.ubsId,
      isActive: claims.isActive,
      createdAt: new Date().toISOString()
    };

    logger.info('Profile created', {
      uid,
      role: claims.role
    });

    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error creating profile', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create user profile'
      }
    });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
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

    const adminClaims = await claimsService.getUserClaims(req.user.id);
    if (adminClaims.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

    const { uid, role, ubsId, isActive }: UpdateRoleRequest = req.body;

    if (!uid || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User UID and role are required'
        }
      });
    }

    // ✅ NOVO: Validar que usuário existe em MongoDB
    const targetUser = await userRepository.findById(uid);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Target user not found in database'
        }
      });
    }

    const claimsUpdate: any = { role };
    if (ubsId !== undefined) claimsUpdate.ubsId = ubsId;
    if (isActive !== undefined) claimsUpdate.isActive = isActive;

    const updatedClaims = await claimsService.updateUserClaims(
      uid,
      claimsUpdate,
      req.user.id
    );

    try {
      await userRepository.updateProfile(uid, {
        role: updatedClaims.role,
        isActive: updatedClaims.isActive,
        updatedAt: new Date()
      });
    } catch {
    }

    const profile = {
      uid,
      email: targetUser.email,
      displayName: targetUser.name,
      role: updatedClaims.role,
      permissions: updatedClaims.permissions,
      ubsId: updatedClaims.ubsId,
      isActive: updatedClaims.isActive,
      createdAt: targetUser.createdAt?.toISOString() || new Date().toISOString()
    };

    logger.info('User role updated', {
      targetUid: uid,
      adminUid: req.user.id,
      newRole: role
    });

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error updating user role', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update user role'
      }
    });
  }
};

export const listUsers = async (req: Request, res: Response) => {
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

    const adminClaims = await claimsService.getUserClaims(req.user.id);
    if (adminClaims.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const allUsers = await userRepository.findAll();
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const users = allUsers.slice(startIndex, endIndex);
    const total = allUsers.length;

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          const claims = await claimsService.getUserClaims(user._id!);
          return {
            uid: user._id!,
            email: user.email,
            displayName: user.name,
            role: claims.role,
            permissions: claims.permissions,
            ubsId: claims.ubsId,
            isActive: claims.isActive,
            createdAt: user.createdAt?.toISOString(),
            lastSignIn: user.lastLoginAt?.toISOString()
          };
        } catch {
          return {
            uid: user._id,
            email: user.email,
            displayName: user.name,
            role: user.role,
            permissions: [],
            isActive: user.isActive,
            createdAt: user.createdAt?.toISOString(),
            lastSignIn: user.lastLoginAt?.toISOString()
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        users: enrichedUsers,
        total: total,
        page: page,
        limit: limit
      }
    });
  } catch (error) {
    logger.error('Error listing users', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to list users'
      }
    });
  }
};
