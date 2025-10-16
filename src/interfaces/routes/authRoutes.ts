import { Router } from 'express';
import { 
  getProfile, 
  updateProfile 
} from '../controllers/public/authController';
import { requireAuth } from '../../middlewares/firebaseAuth';
import { validateBody, ValidationSchemas } from '../../middlewares/validation';
import { asyncHandler } from '../../middlewares/errorHandling';

const router = Router();

// All routes in this file require authentication
router.use(requireAuth);

// User profile management
router.get('/profile', asyncHandler(getProfile));

router.put('/profile', 
  validateBody(ValidationSchemas.profileUpdate), 
  asyncHandler(updateProfile)
);

export default router;