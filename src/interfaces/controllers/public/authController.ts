import { Request, Response } from 'express';
import { getFirebaseAuth } from '../../../config/firebase';
import { Logger } from '../../../middlewares/logging';
import { MongoUserRepository } from '../../../infrastructure/database/implementations/MongoUserRepository';
import { claimsService } from '../../../services/claimsService';

const logger = Logger.getInstance();
const userRepository = new MongoUserRepository();

export interface UserRegistration {
  email: string;
  password: string;
  displayName?: string;
}

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'ID token is required'
        }
      });
    }

    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    logger.info('Token verification successful', {
      uid: decodedToken.uid,
      email: decodedToken.email
    });

    res.json({
      success: true,
      data: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        customClaims: decodedToken.customClaims || {}
      }
    });
  } catch (error: any) {
    logger.error('Token verification failed', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'ID token has expired'
        }
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'ID token has been revoked'
        }
      });
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid ID token'
      }
    });
  }
};

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

    const auth = getFirebaseAuth();
    const userRecord = await auth.getUser(req.user.id);

    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        photoURL: userRecord.photoURL,
        role: req.user.role,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        creationTime: userRecord.metadata.creationTime
      }
    });
  } catch (error) {
    logger.error('Error getting user profile', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get user profile'
      }
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
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

    const { displayName, photoURL, name, phone, cpf, notifications } = req.body;

    if (!displayName && !photoURL && !name && !phone && !cpf && !notifications) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'At least one field is required for update'
        }
      });
    }

    const auth = getFirebaseAuth();
    const firebaseUpdateData: any = {};
    const mongoUpdateData: any = {};

    // Preparar dados para Firebase
    if (displayName) firebaseUpdateData.displayName = displayName;
    if (photoURL) firebaseUpdateData.photoURL = photoURL;

    // Preparar dados para MongoDB
    if (name) mongoUpdateData.name = name;
    if (phone) mongoUpdateData.phone = phone;
    if (cpf) mongoUpdateData.cpf = cpf;
    if (notifications) mongoUpdateData.notifications = notifications;
    mongoUpdateData.updatedAt = new Date();

    // Atualizar Firebase se houver dados
    let userRecord;
    if (Object.keys(firebaseUpdateData).length > 0) {
      userRecord = await auth.updateUser(req.user.id, firebaseUpdateData);
    }

    // Atualizar MongoDB se houver dados
    if (Object.keys(mongoUpdateData).length > 0) {
      await userRepository.updateProfile(req.user.id, mongoUpdateData);
    }

    logger.info('User profile updated', {
      uid: req.user.id,
      updatedFields: Object.keys({ ...firebaseUpdateData, ...mongoUpdateData })
    });

    res.json({
      success: true,
      data: {
        uid: req.user.id,
        email: req.user.email,
        displayName: displayName || (userRecord?.displayName),
        photoURL: photoURL || (userRecord?.photoURL),
        name,
        phone,
        cpf,
        notifications
      }
    });
  } catch (error) {
    logger.error('Error updating user profile', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update user profile'
      }
    });
  }
};

export const registerWithEmail = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName }: UserRegistration = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email is required'
        }
      });
    }

    const auth = getFirebaseAuth();

    try {
      await auth.getUserByEmail(email);
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists'
        }
      });
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });

    await claimsService.setDefaultClaimsForNewUser(userRecord.uid);

    try {
      await userRepository.create({
        _id: userRecord.uid,
        uid: userRecord.uid,
        name: displayName || userRecord.email?.split('@')[0] || 'User',
        email: userRecord.email!,
        role: 'public',
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
      
      logger.info('User saved to MongoDB during registration', {
        uid: userRecord.uid,
        email: userRecord.email
      });
    } catch (mongoError) {
      logger.warn('Failed to save user to MongoDB', {
        uid: userRecord.uid,
        email: userRecord.email,
        error: mongoError
      });
    }

    logger.info('User registered successfully', {
      uid: userRecord.uid,
      email: userRecord.email,
      method: 'email_password'
    });

    res.status(201).json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        message: 'Account created successfully. Please verify your email before logging in.'
      }
    });
  } catch (error: any) {
    logger.error('Error registering user', error);

    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists'
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
        message: 'Failed to create account'
      }
    });
  }
};

export const syncFirebaseUser = async (req: Request, res: Response) => {
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

    const { email, displayName } = req.body;
    const firebaseUid = req.user.id;

    let userRole = 'public';

    try {
      const auth = getFirebaseAuth();
      const userRecord = await auth.getUser(firebaseUid);
      const firebaseCustomClaims = userRecord.customClaims as any;

      if (firebaseCustomClaims && firebaseCustomClaims.role && firebaseCustomClaims.role !== 'public') {
        userRole = firebaseCustomClaims.role;
        logger.info('Admin/agent user synced with custom role', {
          uid: firebaseUid,
          role: userRole
        });
      } else {
        try {
          await claimsService.setDefaultClaimsForNewUser(firebaseUid);
          logger.info('Default claims set for public user', { uid: firebaseUid });
        } catch (claimsError) {
          logger.warn('Could not set default claims', {
            uid: firebaseUid,
            error: claimsError
          });
        }
      }
    } catch (error) {
      logger.warn('Error checking Firebase claims', {
        uid: firebaseUid,
        error
      });
    }

    try {
      await userRepository.create({
        _id: firebaseUid,
        uid: firebaseUid,
        name: displayName || email?.split('@')[0] || 'User',
        email: email || req.user.email,
        role: userRole as any,
        isActive: true
      });
      
      logger.info('Firebase user synced to MongoDB', {
        uid: firebaseUid,
        email: email || req.user.email,
        role: userRole
      });
    } catch (mongoError) {
      logger.warn('User might already exist in MongoDB', {
        uid: firebaseUid,
        email: email || req.user.email,
        error: mongoError
      });
    }

    res.status(201).json({
      success: true,
      data: {
        uid: firebaseUid,
        email: email || req.user.email,
        displayName: displayName,
        role: userRole,
        message: 'User synced to backend successfully'
      }
    });
  } catch (error: any) {
    logger.error('Error syncing Firebase user', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to sync user to backend'
      }
    });
  }
};

export const sendPasswordReset = async (req: Request, res: Response) => {
  try {
    const email = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email is required'
        }
      });
    }

    const auth = getFirebaseAuth();
    const link = await auth.generatePasswordResetLink(email);

    logger.info('Password reset link generated', {
      email
    });

    res.json({
      success: true,
      message: 'Password reset email sent',
      resetLink: link
    });
  } catch (error: any) {
    logger.error('Error sending password reset', error);

    if (error.code === 'auth/user-not-found') {
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent'
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to send password reset email'
      }
    });
  }
};
