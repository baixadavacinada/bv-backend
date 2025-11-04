import { Request, Response } from 'express';
import { getFirebaseAuth } from '../../../config/firebase';
import { Logger } from '../../../middlewares/logging';
import { MongoUserRepository } from '../../../infrastructure/database/implementations/MongoUserRepository';
import { claimsService } from '../../../services/claimsService';

const logger = Logger.getInstance();
const userRepository = new MongoUserRepository();

export interface AdminUserCreation {
  email: string;
  password: string;
  displayName?: string;
  role?: 'admin' | 'agent';
}

export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role = 'admin' }: AdminUserCreation = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email and password are required'
        }
      });
    }

    if (!['admin', 'agent'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must be either admin or agent'
        }
      });
    }

    const auth = getFirebaseAuth();

    // Check if user already exists
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

    // Create Firebase user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: true
    });

    // Set custom claims
    await claimsService.updateUserClaims(userRecord.uid, {
      role: role as 'admin' | 'agent',
      permissions: role === 'admin' 
        ? ['read_users', 'write_users', 'delete_users', 'read_health_units', 'write_health_units', 'read_vaccines', 'write_vaccines', 'read_appointments', 'write_appointments', 'read_records', 'write_records', 'read_feedback', 'moderate_feedback', 'read_notifications', 'send_notifications']
        : ['read_users', 'read_health_units', 'read_appointments', 'read_records', 'read_feedback', 'read_notifications'],
      isActive: true
    }, 'system');

    // Save to MongoDB
    try {
      await userRepository.create({
        _id: userRecord.uid,
        uid: userRecord.uid,
        name: displayName || userRecord.email?.split('@')[0] || 'Admin',
        email: userRecord.email!,
        role: role as 'admin' | 'agent' | 'public',
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
      
      logger.info('Admin user saved to MongoDB', {
        uid: userRecord.uid,
        email: userRecord.email,
        role
      });
    } catch (mongoError) {
      logger.warn('Failed to save admin user to MongoDB', {
        uid: userRecord.uid,
        email: userRecord.email,
        error: mongoError
      });
    }

    logger.info('Admin user created successfully', {
      uid: userRecord.uid,
      email: userRecord.email,
      role,
      method: 'admin_creation'
    });

    res.status(201).json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role,
        emailVerified: userRecord.emailVerified,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`
      }
    });
  } catch (error: any) {
    logger.error('Error creating admin user', error);

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
        message: 'Failed to create admin account'
      }
    });
  }
};
