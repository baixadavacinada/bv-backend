import { Router } from 'express';
import { 
  getProfile, 
  updateProfile 
} from '../controllers/public/authController';
import { createProfile } from '../controllers/public/profileController';
import { firebaseAuthAdvanced } from '../../middlewares/firebaseAuthAdvanced';
import { validateBody, ValidationSchemas } from '../../middlewares/validation';
import { asyncHandler } from '../../middlewares/errorHandling';

const router = Router();

router.use(firebaseAuthAdvanced());

router.get('/me', asyncHandler(getProfile));
router.get('/profile', asyncHandler(getProfile));

router.post('/profile',
  validateBody({
    firebaseUid: { required: false, type: 'string' as const },
    email: { required: true, type: 'email' as const },
    name: { required: false, type: 'string' as const },
    phone: { required: false, type: 'string' as const },
    birthDate: { required: false, type: 'string' as const },
    cpf: { required: false, type: 'string' as const },
    address: { required: false, type: 'object' as const },
    emergencyContact: { required: false, type: 'object' as const },
    healthConditions: { required: false, type: 'array' as const }
  }),
  asyncHandler(createProfile)
);

router.put('/profile', 
  validateBody(ValidationSchemas.profileUpdate), 
  asyncHandler(updateProfile)
);

export default router;