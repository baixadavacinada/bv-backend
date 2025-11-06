import { Router } from 'express';
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
  sendPasswordReset,
  syncFirebaseUser
} from '../controllers/public/authController';
import { createAdminUser } from '../controllers/admin/adminAuthController';
import { 
  getProfile as getProfileFromController,
  updateUserRole,
  listUsers
} from '../controllers/public/profileController';
import { firebaseAuthAdvanced } from '../../middlewares/firebaseAuthAdvanced';
import { validateBody, validateQuery, ValidationSchemas } from '../../middlewares/validation';
import { asyncHandler } from '../../middlewares/errorHandling';

const router = Router();

const publicVaccinationRecordController = new PublicVaccinationRecordController();
const publicFeedbackController = new PublicFeedbackController();
const notificationController = new NotificationController();

router.post('/auth/register', 
  validateBody(ValidationSchemas.firebaseRegistration), 
  asyncHandler(registerWithEmail)
);

router.post('/auth/sync', 
  firebaseAuthAdvanced(),
  validateBody({
    email: { required: false, type: 'email' as const },
    displayName: { required: false, type: 'string' as const }
  }),
  asyncHandler(syncFirebaseUser)
);

router.post('/auth/verify-token', 
  validateBody(ValidationSchemas.firebaseTokenVerify), 
  asyncHandler(verifyToken)
);

router.post('/auth/password-reset', 
  validateBody({ email: { required: true, type: 'email' as const } }), 
  asyncHandler(sendPasswordReset)
);

router.post('/auth/admin/create',
  validateBody({
    email: { required: true, type: 'string' as const },
    password: { required: true, type: 'string' as const, minLength: 6 },
    displayName: { required: false, type: 'string' as const },
    role: { required: true, type: 'string' as const, enum: ['admin', 'agent'] as any[] }
  }),
  asyncHandler(createAdminUser)
);

router.get('/health-units', asyncHandler(listHealthUnitsController));
router.get('/vaccines', asyncHandler(listVaccinesController));

router.post('/appointments',
  firebaseAuthAdvanced(),
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
  firebaseAuthAdvanced(),
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
  firebaseAuthAdvanced(),
  validateBody({
    reason: { required: false, type: 'string' as const, maxLength: 500 }
  }),
  asyncHandler(cancelAppointmentController)
);

router.get('/vaccination-records/my',
  firebaseAuthAdvanced(),
  asyncHandler(publicVaccinationRecordController.getMyVaccinationRecords.bind(publicVaccinationRecordController))
);

router.get('/vaccination-records/user/:userId',
  firebaseAuthAdvanced(),
  asyncHandler(publicVaccinationRecordController.getVaccinationRecordsByUserId.bind(publicVaccinationRecordController))
);

router.post('/feedback',
  firebaseAuthAdvanced(),
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

router.get('/notifications',
  firebaseAuthAdvanced(),
  asyncHandler(notificationController.listUserNotifications.bind(notificationController))
);

router.patch('/notifications/:id/read',
  firebaseAuthAdvanced(),
  asyncHandler(notificationController.markAsRead.bind(notificationController))
);

router.patch('/notifications/mark-all-read',
  firebaseAuthAdvanced(),
  asyncHandler(notificationController.markAllAsRead.bind(notificationController))
);

router.get('/profile',
  firebaseAuthAdvanced(),
  asyncHandler(getProfileFromController)
);

router.put('/users/:uid/role',
  firebaseAuthAdvanced({ required: true, roles: ['admin'] }), 
  validateBody({
    role: { required: true, type: 'string' as const, enum: ['admin', 'agent', 'public'] },
    permissions: { required: false, type: 'array' as const },
    reason: { required: false, type: 'string' as const }
  }),
  asyncHandler(updateUserRole)
);

router.get('/users',
  firebaseAuthAdvanced({ required: true, roles: ['admin'] }),
  validateQuery({
    page: { required: false, type: 'string' as const },
    limit: { required: false, type: 'string' as const },
    role: { required: false, type: 'string' as const }
  }),
  asyncHandler(listUsers)
);

export default router;
