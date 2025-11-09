import { Request, Response } from "express";
import { getFirebaseAuth } from "../../../config/firebase";
import { MongoUserRepository } from '../../../infrastructure/database/implementations/MongoUserRepository';

const userRepository = new MongoUserRepository();

export async function updateUserProfileController(req: Request, res: Response) {
  try {
    const { uid } = req.params;
    const { displayName, personalData } = req.body;

    if (!displayName && !personalData) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'At least displayName or personalData is required for update'
        }
      });
    }

    const auth = getFirebaseAuth();
    const firebaseUpdateData: any = {};
    const mongoUpdateData: any = {};

    // Preparar dados para Firebase
    if (displayName) {
      firebaseUpdateData.displayName = displayName;
    }

    // Preparar dados para MongoDB
    if (personalData) {
      if (personalData.name) mongoUpdateData.name = personalData.name;
      if (personalData.phone) mongoUpdateData.phone = personalData.phone;
      if (personalData.cpf) mongoUpdateData.cpf = personalData.cpf;
      if (personalData.email) mongoUpdateData.email = personalData.email;
      if (personalData.address) mongoUpdateData.address = personalData.address;
    }

    mongoUpdateData.updatedAt = new Date();

    // Atualizar Firebase se houver dados
    if (Object.keys(firebaseUpdateData).length > 0) {
      try {
        const userRecord = await auth.getUser(uid);
        await auth.updateUser(uid, firebaseUpdateData);
      } catch (firebaseError: any) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: `Firebase user with UID ${uid} not found`
          }
        });
      }
    }

    // Atualizar MongoDB
    const updatedUser = await userRepository.updateProfile(uid, mongoUpdateData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: `User with UID ${uid} not found in database`
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Error updating user profile'
      }
    });
  }
}
