import { Router } from 'express';
import { loginController } from '../controllers/public/loginController';
import { listHealthUnitsController } from '../controllers/healthUnitsController';
import { 
  verifyToken, 
  getProfile, 
  updateProfile, 
  registerWithEmail,
  loginWithEmail, 
  loginWithGoogle, 
  sendPasswordReset 
} from '../controllers/public/authController';
import { requireAuth, optionalAuth } from '../../middlewares/firebaseAuth';
import { validateBody, ValidationSchemas } from '../../middlewares/validation';
import { asyncHandler } from '../../middlewares/errorHandling';

const router = Router();

// Firebase authentication endpoints
router.post('/auth/register', 
  validateBody(ValidationSchemas.firebaseRegistration), 
  asyncHandler(registerWithEmail)
);

router.post('/auth/login', 
  validateBody(ValidationSchemas.firebaseEmailLogin), 
  asyncHandler(loginWithEmail)
);

router.post('/auth/login/google', 
  validateBody(ValidationSchemas.firebaseTokenVerify), 
  asyncHandler(loginWithGoogle)
);

router.post('/auth/verify-token', 
  validateBody(ValidationSchemas.firebaseTokenVerify), 
  asyncHandler(verifyToken)
);

router.post('/auth/password-reset', 
  validateBody({ email: { required: true, type: 'email' as const } }), 
  asyncHandler(sendPasswordReset)
);

// Public endpoints
router.get('/health-units', asyncHandler(listHealthUnitsController));

export default router;
