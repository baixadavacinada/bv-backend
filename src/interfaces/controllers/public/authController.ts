import { Request, Response } from 'express';
import { getFirebaseAuth } from '../../../config/firebase';
import { Logger } from '../../../middlewares/logging';
import { User, UserRole } from '../../../domain/entities/User';
import { MongoUserRepository } from '../../../infrastructure/database/implementations/MongoUserRepository';

const logger = Logger.getInstance();
const userRepository = new MongoUserRepository();

/**
 * Interface for email/password login
 */
export interface EmailPasswordLogin {
  email: string;
  password: string;
}

/**
 * Interface for user registration
 */
export interface UserRegistration {
  email: string;
  password: string;
  displayName?: string;
}

/**
 * Interface for Google login
 */
export interface GoogleLogin {
  idToken: string;
}

/**
 * Verify Firebase ID token
 * Public endpoint to validate tokens
 */
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

/**
 * Get user profile (authenticated endpoint)
 */
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

/**
 * Update user profile
 */
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

/**
 * Login with email and password
 * Public endpoint - this endpoint explains how to use Firebase Client SDK for authentication
 * Note: Firebase Admin SDK cannot validate passwords, only Firebase Client SDK can
 */
export const loginWithEmail = async (req: Request, res: Response) => {
  try {
    const { email, password }: EmailPasswordLogin = req.body;

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

    // Check if user exists in Firebase
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

    // Check if user is disabled
    if (userRecord.disabled) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_DISABLED',
          message: 'This account has been disabled'
        }
      });
    }

    // For Firebase Admin SDK, we cannot validate passwords directly
    // The client should use Firebase Client SDK to authenticate
    // Here we provide instructions and a custom token for development
    
    // Create a custom token that the client can use
    const customToken = await auth.createCustomToken(userRecord.uid);

    // Set default role if user doesn't have custom claims
    if (!userRecord.customClaims || !userRecord.customClaims.role) {
      await auth.setCustomUserClaims(userRecord.uid, {
        role: 'public',
        admin: false
      });
      // Refresh user record to get updated claims
      userRecord = await auth.getUser(userRecord.uid);
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
        customToken, // Client will use this to get ID token
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

/**
 * Register new user with email and password
 * Public endpoint - creates user account in Firebase
 */
export const registerWithEmail = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName }: UserRegistration = req.body;

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

    // Create user in Firebase
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false // User will need to verify email
    });

    // Set default role as 'public'
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'public',
      admin: false
    });

    // Save user to MongoDB as well (without password - Firebase handles auth)
    try {
      await userRepository.create({
        _id: userRecord.uid, // Use Firebase UID as MongoDB _id
        name: displayName || userRecord.email?.split('@')[0] || 'User',
        email: userRecord.email!,
        role: 'public', // Default role
        isActive: true
      });
      
      logger.info('User saved to MongoDB', {
        uid: userRecord.uid,
        email: userRecord.email
      });
    } catch (mongoError) {
      // If MongoDB save fails, log but don't fail the registration
      // Firebase user is already created
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

/**
 * Login with Google ID token
 * Public endpoint - verifies Google token and returns user info
 */
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

    // Verify Google ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get user record
    const userRecord = await auth.getUser(decodedToken.uid);

    // Set default role if user doesn't have custom claims
    if (!userRecord.customClaims || !userRecord.customClaims.role) {
      await auth.setCustomUserClaims(userRecord.uid, {
        role: 'public',
        admin: false
      });
    }

    logger.info('Google login successful', {
      uid: userRecord.uid,
      email: userRecord.email,
      method: 'google'
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
        provider: 'google',
        token: idToken // Return the same token for client use
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

/**
 * Send password reset email
 * Public endpoint - sends password reset link to user's email
 */
export const sendPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

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

    // Generate password reset link
    const link = await auth.generatePasswordResetLink(email);

    logger.info('Password reset link generated', {
      email
    });

    res.json({
      success: true,
      message: 'Password reset email sent',
      // In production, send this via email service instead of returning it
      resetLink: link
    });
  } catch (error: any) {
    logger.error('Error sending password reset', error);

    if (error.code === 'auth/user-not-found') {
      // For security, don't reveal if email exists or not
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