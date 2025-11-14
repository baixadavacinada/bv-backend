import { Request, Response } from 'express';
import mongoose from 'mongoose';
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

export interface UserVaccine {
  vaccineId: string;
  vaccineName: string;
  manufacturer?: string;
  dose?: string;
  batchNumber?: string;
  applicationDate?: Date;
  healthUnitName?: string;
  city?: string;
  state?: string;
  addedAt: Date;
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

export const addUserVaccine = async (req: Request, res: Response) => {
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

    const vaccine: UserVaccine = req.body;

    if (!vaccine.vaccineName || !vaccine.dose) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Vaccine name and dose are required'
        }
      });
    }

    let user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (!user.profile) {
      user.profile = {};
    }

    if (!user.profile.vaccines) {
      user.profile.vaccines = [];
    }

    const newVaccine: UserVaccine = {
      ...vaccine,
      addedAt: new Date()
    };

    user.profile.vaccines.push(newVaccine);

    // Usar updateProfile com operador $ do MongoDB para atualizar apenas o array de vacinas
    await userRepository.updateProfile(req.user.id, {
      'profile.vaccines': user.profile.vaccines,
      updatedAt: new Date()
    } as any);

    logger.info('Vaccine added to user', {
      uid: req.user.id,
      vaccineName: vaccine.vaccineName
    });

    res.status(201).json({
      success: true,
      message: 'Vaccine added successfully',
      data: newVaccine
    });
  } catch (error) {
    logger.error('Error adding vaccine to user', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to add vaccine'
      }
    });
  }
};

export const getUserVaccines = async (req: Request, res: Response) => {
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

    const user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const vaccines = user.profile?.vaccines || [];

    logger.info('User vaccines retrieved', {
      uid: req.user.id,
      count: vaccines.length
    });

    res.json({
      success: true,
      data: vaccines,
      total: vaccines.length
    });
  } catch (error) {
    logger.error('Error retrieving user vaccines', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve vaccines'
      }
    });
  }
};

export const removeUserVaccine = async (req: Request, res: Response) => {
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

    const { vaccineId } = req.params;

    if (!vaccineId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Vaccine ID is required'
        }
      });
    }

    let user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (!user.profile?.vaccines) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VACCINE_NOT_FOUND',
          message: 'Vaccine not found'
        }
      });
    }

    const vaccineIndex = user.profile.vaccines.findIndex(v => v.vaccineId === vaccineId);
    if (vaccineIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VACCINE_NOT_FOUND',
          message: 'Vaccine not found'
        }
      });
    }

    user.profile.vaccines.splice(vaccineIndex, 1);

    // Usar updateProfile com operador $ do MongoDB para atualizar apenas o array de vacinas
    await userRepository.updateProfile(req.user.id, {
      'profile.vaccines': user.profile.vaccines,
      updatedAt: new Date()
    } as any);

    logger.info('Vaccine removed from user', {
      uid: req.user.id,
      vaccineId: vaccineId
    });

    res.json({
      success: true,
      message: 'Vaccine removed successfully'
    });
  } catch (error) {
    logger.error('Error removing vaccine from user', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to remove vaccine'
      }
    });
  }
};

export const toggleFavoriteHealthUnit = async (req: Request, res: Response) => {
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

    const { healthUnitId } = req.body;

    if (!healthUnitId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'healthUnitId is required'
        }
      });
    }

    // Converter string para ObjectId
    let healthUnitObjectId;
    try {
      healthUnitObjectId = new mongoose.Types.ObjectId(healthUnitId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid healthUnitId format'
        }
      });
    }

    const user = await userRepository.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (!user.profile) {
      user.profile = {} as any;
    }

    if (!user.profile!.favoritesHealthUnit) {
      user.profile!.favoritesHealthUnit = [];
    }

    // Verificar se já é favorito (comparar como strings para evitar problemas de ObjectId)
    const favoriteIndex = user.profile!.favoritesHealthUnit!.findIndex(
      (fav) => fav.healthUnitId === healthUnitObjectId.toString()
    );

    if (favoriteIndex > -1) {
      // Remover do array de favoritos
      user.profile!.favoritesHealthUnit!.splice(favoriteIndex, 1);
    } else {
      // Adicionar ao array de favoritos
      user.profile!.favoritesHealthUnit!.push({
        healthUnitId: healthUnitObjectId.toString(),
        isFavorite: true,
        addedAt: new Date()
      });
    }

    // Atualizar no banco de dados
    await userRepository.updateProfile(req.user.id, {
      'profile.favoritesHealthUnit': user.profile!.favoritesHealthUnit,
      updatedAt: new Date()
    } as any);

    logger.info('Health unit favorite toggled', {
      uid: req.user.id,
      healthUnitId: healthUnitId,
      isFavorite: favoriteIndex === -1
    });

    res.json({
      success: true,
      data: user.profile!.favoritesHealthUnit,
      message: 'Health unit favorite toggled successfully'
    });
  } catch (error) {
    logger.error('Error toggling health unit favorite', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to toggle health unit favorite'
      }
    });
  }
};

export const getFavoriteHealthUnits = async (req: Request, res: Response) => {
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

    const user = await userRepository.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const favoritesHealthUnit = user.profile?.favoritesHealthUnit || [];

    res.json({
      success: true,
      data: favoritesHealthUnit,
      message: 'Favorite health units retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting favorite health units', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get favorite health units'
      }
    });
  }
};

export const toggleFavoriteMaterial = async (req: Request, res: Response) => {
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

    const { materialId, link } = req.body;

    if (!materialId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'materialId is required'
        }
      });
    }

    const user = await userRepository.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (!user.profile) {
      user.profile = {} as any;
    }

    if (!user.profile!.favoriteEducationalMaterials) {
      user.profile!.favoriteEducationalMaterials = [];
    }

    // Verificar se já é favorito
    const favoriteIndex = user.profile!.favoriteEducationalMaterials!.findIndex(
      (fav) => fav.materialId === materialId
    );

    if (favoriteIndex > -1) {
      // Remover do array de favoritos
      user.profile!.favoriteEducationalMaterials!.splice(favoriteIndex, 1);
    } else {
      // Adicionar ao array de favoritos
      user.profile!.favoriteEducationalMaterials!.push({
        materialId,
        link,
        addedAt: new Date()
      });
    }

    // Atualizar no banco de dados
    await userRepository.updateProfile(req.user.id, {
      'profile.favoriteEducationalMaterials': user.profile!.favoriteEducationalMaterials,
      updatedAt: new Date()
    } as any);

    logger.info('Educational material favorite toggled', {
      uid: req.user.id,
      materialId: materialId,
      isFavorite: favoriteIndex === -1
    });

    res.json({
      success: true,
      data: user.profile!.favoriteEducationalMaterials,
      message: 'Educational material favorite toggled successfully'
    });
  } catch (error) {
    logger.error('Error toggling educational material favorite', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to toggle educational material favorite'
      }
    });
  }
};

export const getFavoriteEducationalMaterials = async (req: Request, res: Response) => {
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

    const user = await userRepository.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const favoriteEducationalMaterials = user.profile?.favoriteEducationalMaterials || [];

    res.json({
      success: true,
      data: favoriteEducationalMaterials,
      message: 'Favorite educational materials retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting favorite educational materials', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get favorite educational materials'
      }
    });
  }
};

export const saveSecondDoseConfiguration = async (req: Request, res: Response) => {
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

    const { selectedVaccines, createdBy } = req.body;

    if (!selectedVaccines || !Array.isArray(selectedVaccines)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'selectedVaccines array is required'
        }
      });
    }

    if (!createdBy) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'createdBy is required'
        }
      });
    }

    let user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (!user.profile) {
      user.profile = {};
    }

    const secondDoseConfig = {
      selectedVaccines,
      createdBy,
      createdAt: new Date()
    };

    await userRepository.updateProfile(req.user.id, {
      'profile.secondDoseConfig': secondDoseConfig,
      updatedAt: new Date()
    } as any);

    logger.info('Second dose configuration saved', {
      uid: req.user.id,
      vaccinesCount: selectedVaccines.length,
      createdBy
    });

    res.status(201).json({
      success: true,
      message: 'Second dose configuration saved successfully',
      data: secondDoseConfig
    });
  } catch (error) {
    logger.error('Error saving second dose configuration', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to save second dose configuration'
      }
    });
  }
};

export const getSecondDoseConfiguration = async (req: Request, res: Response) => {
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

    const user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const secondDoseConfig = user.profile?.secondDoseConfig || null;

    logger.info('Second dose configuration retrieved', {
      uid: req.user.id
    });

    res.json({
      success: true,
      data: secondDoseConfig,
      message: 'Second dose configuration retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving second dose configuration', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve second dose configuration'
      }
    });
  }
};

export const removeSecondDoseConfiguration = async (req: Request, res: Response) => {
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

    let user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    await userRepository.updateProfile(req.user.id, {
      'profile.secondDoseConfig': null,
      updatedAt: new Date()
    } as any);

    logger.info('Second dose configuration removed', {
      uid: req.user.id
    });

    res.json({
      success: true,
      message: 'Second dose configuration removed successfully'
    });
  } catch (error) {
    logger.error('Error removing second dose configuration', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to remove second dose configuration'
      }
    });
  }
};
