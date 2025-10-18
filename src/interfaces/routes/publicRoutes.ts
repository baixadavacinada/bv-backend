import { Router } from 'express';
import { loginController } from '../controllers/public/loginController';
import { listHealthUnitsController } from '../controllers/healthUnitsController';
import { listVaccinesController } from '../controllers/admin/vaccineController';
import { PublicVaccinationRecordController } from '../controllers/public/vaccinationRecordController';
import { PublicFeedbackController } from '../controllers/public/feedbackController';
import { NotificationController } from '../controllers/public/notificationController';
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

// Initialize controllers
const publicVaccinationRecordController = new PublicVaccinationRecordController();
const publicFeedbackController = new PublicFeedbackController();
const notificationController = new NotificationController();

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
router.get('/vaccines', asyncHandler(listVaccinesController));

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

// Vaccination Record endpoints (protected)
router.get('/vaccination-records/my',
  requireAuth,
  asyncHandler(publicVaccinationRecordController.getMyVaccinationRecords.bind(publicVaccinationRecordController))
);

router.get('/vaccination-records/user/:userId',
  requireAuth,
  asyncHandler(publicVaccinationRecordController.getVaccinationRecordsByUserId.bind(publicVaccinationRecordController))
);

// Feedback endpoints
router.post('/feedback',
  requireAuth,
  validateBody({
    healthUnitId: { required: true, type: 'string' as const },
    comment: { required: true, type: 'string' as const, minLength: 10, maxLength: 1000 },
    rating: { required: true, type: 'number' as const, min: 1, max: 5 },
    isAnonymous: { required: false, type: 'boolean' as const }
  }),
  asyncHandler(publicFeedbackController.create.bind(publicFeedbackController))
);

router.get('/feedback/health-unit/:healthUnitId',
  asyncHandler(publicFeedbackController.listByHealthUnit.bind(publicFeedbackController))
);

// Notification endpoints
router.get('/notifications',
  requireAuth,
  asyncHandler(notificationController.listUserNotifications.bind(notificationController))
);

router.patch('/notifications/:id/read',
  requireAuth,
  asyncHandler(notificationController.markAsRead.bind(notificationController))
);

router.patch('/notifications/mark-all-read',
  requireAuth,
  asyncHandler(notificationController.markAllAsRead.bind(notificationController))
);

export default router;
