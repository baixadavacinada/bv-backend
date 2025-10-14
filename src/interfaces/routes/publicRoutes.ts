import { Router } from 'express';
import { loginController } from '../controllers/public/loginController';
import { listHealthUnitsController } from '../controllers/healthUnitsController';
import { verifyToken, getProfile, updateProfile } from '../controllers/public/authController';
import { requireAuth, optionalAuth } from '../../middlewares/firebaseAuth';
import { validateBody, ValidationSchemas } from '../../middlewares/validation';
import { asyncHandler } from '../../middlewares/errorHandling';

const router = Router();

// Traditional JWT authentication
router.post('/auth/login', loginController);

// Firebase authentication endpoints
router.post('/auth/verify-token', 
  validateBody(ValidationSchemas.firebaseTokenVerify), 
  asyncHandler(verifyToken)
);
router.get('/auth/profile', requireAuth, asyncHandler(getProfile));
router.put('/auth/profile', 
  requireAuth, 
  validateBody(ValidationSchemas.profileUpdate), 
  asyncHandler(updateProfile)
);

// Public endpoints
router.get('/health-unit', asyncHandler(listHealthUnitsController));

export default router;
