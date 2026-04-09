import { Request, Response } from 'express';
import { getFirebaseAuth } from '../../../config/firebase';
import { Logger } from '../../../middlewares/logging';
import { MongoUserRepository } from '../../../infrastructure/database/implementations/MongoUserRepository';
import { claimsService } from '../../../services/claimsService';
import { NotificationGateway } from '../../../services/notificationGateway';
import { notificationTemplatesService } from '../../../services/notificationTemplatesDbService';

const logger = Logger.getInstance();
const userRepository = new MongoUserRepository();


function normalizePhoneNumber(phone: string): string | null {
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  cleaned = cleaned.replace('+', '');
  
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  if (!/^55\d{10,11}$/.test(cleaned)) {
    return null;
  }
  
  return '+' + cleaned;
}

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
    
    // Buscar dados adicionais do MongoDB
    let mongoUser = null;
    try {
      mongoUser = await userRepository.findById(req.user.id);
    } catch (mongoError) {
      logger.warn('Failed to fetch MongoDB user data', mongoError instanceof Error ? mongoError : new Error(String(mongoError)));
    }

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
        creationTime: userRecord.metadata.creationTime,
        // Dados do MongoDB
        name: mongoUser?.name,
        phone: mongoUser?.phone,
        acceptWhatsAppNotifications: mongoUser?.acceptWhatsAppNotifications,
        favoritesHealthUnit: mongoUser?.profile?.favoritesHealthUnit
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

    const { displayName, photoURL, name, phone, favoritesHealthUnit, acceptWhatsAppNotifications } = req.body;

    if (!displayName && !photoURL && !name && !phone && !favoritesHealthUnit && acceptWhatsAppNotifications === undefined) {
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
    if (phone) {
      // Validar formato do telefone - aceita com ou sem máscara
      // Formatos aceitos: (XX) 99999-9999, +55 (XX) 99999-9999, etc
      const phoneRegex = /^[\d\s\-\(\)+]*$/;
      if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PHONE',
            message: 'Phone number must be valid (minimum 10 digits)'
          }
        });
      }
      mongoUpdateData.phone = phone;
    }

    // Adicionar dados de WhatsApp
    if (acceptWhatsAppNotifications !== undefined) {
      mongoUpdateData.acceptWhatsAppNotifications = acceptWhatsAppNotifications;
    }

    // Adicionar favoritos se fornecidos
    if (favoritesHealthUnit) {
      mongoUpdateData['profile.favoritesHealthUnit'] = favoritesHealthUnit;
    }

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

    // Enviar mensagem de confirmação por WhatsApp se telefone foi atualizado e notificações estão ativas
    if (phone && acceptWhatsAppNotifications) {
      try {
        const notificationGateway = new NotificationGateway();

        const normalizedPhone = normalizePhoneNumber(phone);

        if (!normalizedPhone) {
          throw new Error('Invalid phone number format for WhatsApp');
        }

        // Buscar e renderizar template do banco de dados
        const template = await notificationTemplatesService.getTemplate('whatsapp_opt_in_confirmation');

        if (!template) {
          throw new Error('Template whatsapp_opt_in_confirmation not found');
        }

        const rendered = await notificationTemplatesService.render('whatsapp_opt_in_confirmation', {
          userName: displayName || name || req.user.email?.split('@')[0] || 'Usuário',
          phone: phone
        });

        if (!rendered) {
          throw new Error('Failed to render template');
        }

        await notificationGateway.send({
          to: normalizedPhone,
          channel: 'whatsapp',
          title: rendered.subject,
          message: rendered.body
        });
      } catch (whatsappError) {
        // Não falha a requisição se não conseguir enviar WhatsApp
      }
    }

    res.json({
      success: true,
      data: {
        uid: req.user.id,
        email: req.user.email,
        displayName: displayName || (userRecord?.displayName),
        photoURL: photoURL || (userRecord?.photoURL),
        name,
        phone,
        acceptWhatsAppNotifications,
        favoritesHealthUnit
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

    logger.info('Starting Firebase user sync', {
      uid: firebaseUid,
      email: email || req.user.email,
      displayName,
      method: req.query.method || 'unknown'
    });

    let userRole = 'public';
    let existingUser = null;

    /**
     * Step 1: Check Firebase custom claims (for admin/agent roles)
     */
    try {
      const auth = getFirebaseAuth();
      const userRecord = await auth.getUser(firebaseUid);
      const firebaseCustomClaims = userRecord.customClaims as any;

      logger.debug('Firebase user record retrieved', {
        uid: firebaseUid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        hasCustomClaims: !!firebaseCustomClaims
      });

      if (firebaseCustomClaims && firebaseCustomClaims.role && firebaseCustomClaims.role !== 'public') {
        userRole = firebaseCustomClaims.role;
        logger.info('Admin/agent user synced with custom role', {
          uid: firebaseUid,
          role: userRole,
          email: userRecord.email
        });
      } else {
        try {
          await claimsService.setDefaultClaimsForNewUser(firebaseUid);
          logger.info('Default claims set for public user', { 
            uid: firebaseUid,
            email: userRecord.email
          });
        } catch (claimsError) {
          logger.warn('Could not set default claims', {
            uid: firebaseUid,
            email: userRecord.email,
            error: claimsError instanceof Error ? claimsError.message : String(claimsError)
          });
        }
      }
    } catch (error) {
      logger.warn('Error checking Firebase claims', {
        uid: firebaseUid,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    /**
     * Step 2: Check if user exists in MongoDB
     */
    try {
      existingUser = await userRepository.findById(firebaseUid);
      
      if (existingUser) {
        logger.info('Existing MongoDB user found', {
          uid: firebaseUid,
          email: existingUser.email,
          role: existingUser.role,
          isActive: existingUser.isActive
        });

        /**
         * Step 2a: Reactivate if inactive
         */
        if (!existingUser.isActive) {
          await userRepository.updateProfile(firebaseUid, { 
            isActive: true,
            lastLoginAt: new Date()
          });
          logger.info('Inactive user reactivated on sync', {
            uid: firebaseUid,
            email: existingUser.email,
            previousRole: existingUser.role,
            newRole: userRole
          });
        } else {
          logger.debug('User already active, updating lastLogin', {
            uid: firebaseUid,
            email: existingUser.email
          });
          /**
           * Update lastLoginAt even if active
           */
          await userRepository.updateProfile(firebaseUid, {
            lastLoginAt: new Date()
          });
        }
      }
    } catch (dbError) {
      logger.warn('Error checking existing user in MongoDB', {
        uid: firebaseUid,
        error: dbError instanceof Error ? dbError.message : String(dbError)
      });
    }

    /**
     * Step 3: Create or update user in MongoDB
     */
    try {
      const userData = {
        _id: firebaseUid,
        uid: firebaseUid,
        name: displayName || email?.split('@')[0] || req.user.email?.split('@')[0] || 'User',
        email: email || req.user.email,
        role: userRole as any,
        isActive: true,
        lastLoginAt: new Date()
      };

      await userRepository.create(userData);
      
      logger.info('Firebase user successfully synced to MongoDB', {
        uid: firebaseUid,
        email: userData.email,
        name: userData.name,
        role: userRole,
        isActive: true
      });
    } catch (mongoError) {
      /**
       * If user already exists, update instead of create
       */
      if (mongoError instanceof Error && mongoError.message.includes('duplicate')) {
        try {
          await userRepository.updateProfile(firebaseUid, {
            name: displayName || email?.split('@')[0] || req.user.email?.split('@')[0] || 'User',
            email: email || req.user.email,
            role: userRole as any,
            isActive: true,
            lastLoginAt: new Date()
          });
          
          logger.info('Existing Firebase user updated in MongoDB', {
            uid: firebaseUid,
            email: email || req.user.email,
            role: userRole
          });
        } catch (updateError) {
          console.error('Failed to update existing user', {
            uid: firebaseUid,
            message: updateError instanceof Error ? updateError.message : String(updateError)
          });
          throw updateError;
        }
      } else {
        logger.warn('Could not create user in MongoDB', {
          uid: firebaseUid,
          email: email || req.user.email,
          error: mongoError instanceof Error ? mongoError.message : String(mongoError)
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        uid: firebaseUid,
        email: email || req.user.email,
        displayName: displayName || email?.split('@')[0],
        role: userRole,
        isActive: true,
        message: 'User synced to backend successfully'
      }
    });
  } catch (error: any) {
    console.error('Fatal error during Firebase user sync', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

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

export const checkEmailExists = async (req: Request, res: Response) => {
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

    // Check if email exists in MongoDB
    const existingUser = await userRepository.findByEmail(email);
    const exists = !!existingUser;

    logger.info('Email existence check', {
      email,
      exists
    });

    res.json({
      success: true,
      data: {
        email,
        exists
      }
    });
  } catch (error) {
    logger.error('Error checking email existence', error instanceof Error ? error : new Error(String(error)));

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to check email existence'
      }
    });
  }
};
