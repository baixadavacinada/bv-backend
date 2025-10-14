import { Request, Response } from 'express';
import { getFirebaseAuth } from '../../../config/firebase';
import { Logger } from '../../../middlewares/logging';
import { UserRole } from '../../../domain/entities/User';

const logger = Logger.getInstance();

/**
 * Interface for user registration with Firebase
 */
export interface FirebaseUserRegistration {
  email: string;
  password: string;
  displayName?: string;
  role?: UserRole;
}

/**
 * Interface for custom claims update
 */
export interface CustomClaimsUpdate {
  uid: string;
  claims: {
    admin?: boolean;
    role?: UserRole;
    [key: string]: any;
  };
}

/**
 * Create a new Firebase user with custom claims
 * Admin endpoint for user management
 */
export const createFirebaseUser = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role = 'public' }: FirebaseUserRegistration = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email and password are required'
        }
      });
    }

    const auth = getFirebaseAuth();

    // Create Firebase user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });

    // Set custom claims for role-based access
    const customClaims = {
      role,
      admin: role === 'admin'
    };

    await auth.setCustomUserClaims(userRecord.uid, customClaims);

    logger.info('Firebase user created successfully', {
      adminId: req.user?.id,
      createdUserId: userRecord.uid,
      email: userRecord.email,
      role
    });

    res.status(201).json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role,
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata.creationTime
      }
    });
  } catch (error: any) {
    logger.error('Error creating Firebase user', error);

    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      });
    }

    if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password should be at least 6 characters'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create user'
      }
    });
  }
};

/**
 * Get Firebase user information
 */
export const getFirebaseUser = async (req: Request, res: Response) => {
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

    const auth = getFirebaseAuth();
    const userRecord = await auth.getUser(uid);

    logger.info('Firebase user retrieved', {
      requesterId: req.user?.id,
      targetUserId: uid
    });

    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        customClaims: userRecord.customClaims,
        createdAt: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime
      }
    });
  } catch (error: any) {
    logger.error('Error retrieving Firebase user', error);

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
        message: 'Failed to retrieve user'
      }
    });
  }
};

/**
 * Update user custom claims (role management)
 */
export const updateUserClaims = async (req: Request, res: Response) => {
  try {
    const { uid, claims }: CustomClaimsUpdate = req.body;

    if (!uid || !claims) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'UID and claims are required'
        }
      });
    }

    const auth = getFirebaseAuth();

    // Ensure admin claim is consistent with role
    if (claims.role) {
      claims.admin = claims.role === 'admin';
    }

    await auth.setCustomUserClaims(uid, claims);

    logger.info('Firebase user claims updated', {
      adminId: req.user?.id,
      targetUserId: uid,
      newClaims: claims
    });

    res.json({
      success: true,
      data: {
        uid,
        claims
      }
    });
  } catch (error: any) {
    logger.error('Error updating user claims', error);

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
        message: 'Failed to update user claims'
      }
    });
  }
};

/**
 * Disable/Enable Firebase user
 */
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { disabled } = req.body;

    if (!uid || typeof disabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'UID and disabled status are required'
        }
      });
    }

    const auth = getFirebaseAuth();
    const userRecord = await auth.updateUser(uid, { disabled });

    logger.info('Firebase user status updated', {
      adminId: req.user?.id,
      targetUserId: uid,
      disabled
    });

    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        disabled: userRecord.disabled
      }
    });
  } catch (error: any) {
    logger.error('Error updating user status', error);

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
        message: 'Failed to update user status'
      }
    });
  }
};

/**
 * Delete Firebase user
 */
export const deleteFirebaseUser = async (req: Request, res: Response) => {
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

    const auth = getFirebaseAuth();
    await auth.deleteUser(uid);

    logger.info('Firebase user deleted', {
      adminId: req.user?.id,
      deletedUserId: uid
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting Firebase user', error);

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
        message: 'Failed to delete user'
      }
    });
  }
};

/**
 * Get current user profile from Firebase token
 */
export const getCurrentUser = async (req: Request, res: Response) => {
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

    const auth = getFirebaseAuth();
    const userRecord = await auth.getUser(req.user.id);

    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        role: req.user.role,
        customClaims: userRecord.customClaims
      }
    });
  } catch (error) {
    logger.error('Error getting current user', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get user profile'
      }
    });
  }
};