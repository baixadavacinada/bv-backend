import { Router } from 'express';
import { 
  getProfile, 
  updateProfile 
} from '../controllers/public/authController';
import { firebaseAuthAdvanced } from '../../middlewares/firebaseAuthAdvanced';
import { validateBody, ValidationSchemas } from '../../middlewares/validation';
import { asyncHandler } from '../../middlewares/errorHandling';

const router = Router();

// All routes in this file require authentication
router.use(firebaseAuthAdvanced());

// User profile management
router.get('/me', asyncHandler(getProfile));
router.get('/profile', asyncHandler(getProfile));

router.put('/profile', 
  validateBody(ValidationSchemas.profileUpdate), 
  asyncHandler(updateProfile)
);

export default router;