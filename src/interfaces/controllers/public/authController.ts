import { Request, Response } from 'express';
import { getFirebaseAuth } from '../../../config/firebase';
import { Logger } from '../../../middlewares/logging';

const logger = Logger.getInstance();

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