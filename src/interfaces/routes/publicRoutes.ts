import { Router } from 'express';
import { loginController } from '../controllers/public/loginController';
import { listHealthUnitsController } from '../controllers/healthUnitsController';
import { 
  scheduleAppointmentController,
  listMyAppointmentsController,
  getAvailableSlotsController,
  cancelAppointmentController
} from '../controllers/appointmentController';
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
import { validateBody, validateQuery, ValidationSchemas } from '../../middlewares/validation';
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

// Appointment endpoints (protected)
router.post('/appointments',
  requireAuth,
  validateBody({
    vaccineId: { required: true, type: 'string' as const },
    healthUnitId: { required: true, type: 'string' as const },
    scheduledDate: { required: true, type: 'string' as const },
    scheduledTime: { required: true, type: 'string' as const },
    dose: { 
      required: true, 
      type: 'string' as const, 
      enum: ['1ª dose', '2ª dose', '3ª dose', 'dose única', 'reforço'] as any[]
    },
    notes: { required: false, type: 'string' as const, maxLength: 500 }
  }),
  asyncHandler(scheduleAppointmentController)
);

router.get('/appointments/my',
  requireAuth,
  asyncHandler(listMyAppointmentsController)
);

router.get('/appointments/available-slots',
  validateQuery({
    healthUnitId: { required: true, type: 'string' as const },
    date: { required: true, type: 'string' as const }
  }),
  asyncHandler(getAvailableSlotsController)
);

router.patch('/appointments/:id/cancel',
  requireAuth,
  validateBody({
    reason: { required: false, type: 'string' as const, maxLength: 500 }
  }),
  asyncHandler(cancelAppointmentController)
);

export default router;
