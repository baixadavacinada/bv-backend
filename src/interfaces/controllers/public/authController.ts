import { Request, Response } from 'express';
import { getFirebaseAuth } from '../../../config/firebase';
import { Logger } from '../../../middlewares/logging';
import { User, UserRole } from '../../../domain/entities/User';
import { MongoUserRepository } from '../../../infrastructure/database/implementations/MongoUserRepository';
import { claimsService } from '../../../services/claimsService';

const logger = Logger.getInstance();
const userRepository = new MongoUserRepository();

export interface UserRegistration {
  email: string;
  password: string;
  displayName?: string;
}

export interface GoogleLogin {
  idToken: string;
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

    const { displayName, photoURL } = req.body;

    if (!displayName && !photoURL) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'At least one field (displayName or photoURL) is required'
        }
      });
    }

    const auth = getFirebaseAuth();
    const updateData: any = {};

    if (displayName) updateData.displayName = displayName;
    if (photoURL) updateData.photoURL = photoURL;

    const userRecord = await auth.updateUser(req.user.id, updateData);

    logger.info('User profile updated', {
      uid: req.user.id,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL
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

export const loginWithEmail = async (req: Request, res: Response) => {
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

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }
      throw error;
    }

    if (userRecord.disabled) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_DISABLED',
          message: 'This account has been disabled'
        }
      });
    }

    const customToken = await auth.createCustomToken(userRecord.uid);

    if (!userRecord.customClaims || !userRecord.customClaims.role) {
      await claimsService.setDefaultClaimsForNewUser(userRecord.uid);
      userRecord = await auth.getUser(userRecord.uid);
    }

    // 🔥 NOVO: Buscar/criar usuário no MongoDB
    let mongoUser = await userRepository.findById(userRecord.uid);

    if (!mongoUser) {
      try {
        mongoUser = await userRepository.create({
          _id: userRecord.uid,
          uid: userRecord.uid,
          name: userRecord.displayName || userRecord.email?.split('@')[0] || 'User',
          email: userRecord.email!,
          role: 'public',
          isActive: true,
          createdAt: new Date(),
          lastLoginAt: new Date()
        });

        logger.info('User created in MongoDB during email login', {
          uid: userRecord.uid,
          email: userRecord.email
        });
      } catch (mongoError) {
        logger.warn('Failed to create user in MongoDB', {
          uid: userRecord.uid,
          email: userRecord.email,
          error: mongoError
        });
      }
    } else {
      // Atualizar lastLoginAt
      try {
        await userRepository.updateProfile(userRecord.uid, {
          lastLoginAt: new Date()
        });

        logger.info('User login updated', {
          uid: userRecord.uid,
          email: userRecord.email
        });
      } catch (updateError) {
        logger.warn('Failed to update lastLoginAt', {
          uid: userRecord.uid,
          error: updateError
        });
      }
    }

    logger.info('Custom token generated for email login', {
      uid: userRecord.uid,
      email: userRecord.email,
      method: 'email_password_custom_token'
    });

    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        role: userRecord.customClaims?.role || 'public',
        provider: 'email',
        customToken,
      },
      message: 'User found. Use the customToken with Firebase Client SDK to complete authentication.',
      instructions: {
        frontend: 'Use signInWithCustomToken(auth, customToken) on the frontend to get the ID token',
        note: 'For production, implement proper email/password authentication using Firebase Client SDK'
      }
    });
  } catch (error: any) {
    logger.error('Error with email/password login', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to process login request'
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

    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Password is required'
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

    try {
      await claimsService.setDefaultClaimsForNewUser(firebaseUid);
    } catch (claimsError) {
      logger.warn('Claims already exist for user', {
        uid: firebaseUid,
        error: claimsError
      });
    }

    try {
      await userRepository.create({
        _id: firebaseUid,
        uid: firebaseUid,
        name: displayName || email?.split('@')[0] || 'User',
        email: email || req.user.email,
        role: 'public',
        isActive: true
      });
      
      logger.info('Firebase user synced to MongoDB', {
        uid: firebaseUid,
        email: email || req.user.email
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

export const loginWithGoogle = async (req: Request, res: Response) => {
  try {
    const { idToken }: GoogleLogin = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Google ID token is required'
        }
      });
    }

    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const userRecord = await auth.getUser(decodedToken.uid);

    if (!userRecord.customClaims || !userRecord.customClaims.role) {
      await claimsService.setDefaultClaimsForNewUser(userRecord.uid);
    }

    let mongoUser = await userRepository.findById(userRecord.uid);
    let isNewUser = false;

    if (!mongoUser) {
      try {
        mongoUser = await userRepository.create({
          _id: userRecord.uid,
          uid: userRecord.uid,
          name: userRecord.displayName || userRecord.email?.split('@')[0] || 'User',
          email: userRecord.email!,
          role: 'public',
          isActive: true,
          createdAt: new Date(),
          lastLoginAt: new Date()
        });

        isNewUser = true;

        logger.info('New Google user created in MongoDB', {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        });
      } catch (mongoError) {
        logger.warn('Failed to create user in MongoDB', {
          uid: userRecord.uid,
          email: userRecord.email,
          error: mongoError
        });
      }
    } else {
      try {
        await userRepository.updateProfile(userRecord.uid, {
          lastLoginAt: new Date()
        });

        logger.info('Existing Google user login updated', {
          uid: userRecord.uid,
          email: userRecord.email
        });
      } catch (updateError) {
        logger.warn('Failed to update lastLoginAt', {
          uid: userRecord.uid,
          error: updateError
        });
      }
    }

    logger.info('Google login successful', {
      uid: userRecord.uid,
      email: userRecord.email,
      method: 'google',
      isNewUser,
      mongoUserCreated: !!mongoUser
    });

    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || mongoUser?.name,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        role: userRecord.customClaims?.role || 'public',
        provider: 'google',
        token: idToken,
        isNewUser,
        user: mongoUser ? {
          _id: mongoUser._id,
          uid: mongoUser.uid,
          name: mongoUser.name,
          email: mongoUser.email,
          role: mongoUser.role,
          isActive: mongoUser.isActive,
          createdAt: mongoUser.createdAt,
          lastLoginAt: mongoUser.lastLoginAt
        } : undefined
      }
    });
  } catch (error: any) {
    logger.error('Error with Google login', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Google token has expired'
        }
      });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid Google token'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to authenticate with Google'
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
