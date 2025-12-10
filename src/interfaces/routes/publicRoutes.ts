import { Router, Request, Response } from 'express';
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
  syncFirebaseUser,
  checkEmailExists
} from '../controllers/public/authController';
import { createAdminUser } from '../controllers/admin/adminAuthController';
import { 
  getProfile as getProfileFromController,
  updateUserRole,
  listUsers,
  addUserVaccine,
  getUserVaccines,
  removeUserVaccine,
  toggleFavoriteHealthUnit,
  getFavoriteHealthUnits,
  toggleFavoriteMaterial,
  getFavoriteEducationalMaterials,
  saveSecondDoseConfiguration,
  getSecondDoseConfiguration,
  removeSecondDoseConfiguration
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

router.post('/users/check-email',
  firebaseAuthAdvanced(),
  validateBody({ email: { required: true, type: 'email' as const } }),
  asyncHandler(checkEmailExists)
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
  validateBody({
    healthUnitId: { required: true, type: 'string' as const },
    comment: { required: false, type: 'string' as const, minLength: 10, maxLength: 1000 },
    rating: { required: true, type: 'number' as const, min: 1, max: 5 },
    vaccineSuccess: { required: false, type: 'string' as const },
    waitTime: { required: false, type: 'string' as const },
    respectfulService: { required: false, type: 'string' as const },
    cleanLocation: { required: false, type: 'string' as const },
    recommendation: { required: false, type: 'string' as const },
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

router.post('/user/vaccines',
  firebaseAuthAdvanced({ required: true }),
  validateBody({
    vaccineId: { required: true, type: 'string' as const },
    vaccineName: { required: true, type: 'string' as const },
    manufacturer: { required: false, type: 'string' as const },
    dose: { required: true, type: 'string' as const },
    batchNumber: { required: false, type: 'string' as const },
    applicationDate: { required: false, type: 'string' as const },
    healthUnitName: { required: false, type: 'string' as const },
    city: { required: false, type: 'string' as const },
    state: { required: false, type: 'string' as const }
  }),
  asyncHandler(addUserVaccine)
);

router.get('/user/vaccines',
  firebaseAuthAdvanced({ required: true }),
  asyncHandler(getUserVaccines)
);

router.delete('/user/vaccines/:vaccineId',
  firebaseAuthAdvanced({ required: true }),
  asyncHandler(removeUserVaccine)
);

router.post('/user/favorite-health-units/toggle',
  firebaseAuthAdvanced({ required: true }),
  validateBody({
    healthUnitId: { required: true, type: 'string' as const }
  }),
  asyncHandler(toggleFavoriteHealthUnit)
);

router.get('/user/favorite-health-units',
  firebaseAuthAdvanced({ required: true }),
  asyncHandler(getFavoriteHealthUnits)
);

router.post('/user/favorite-materials/toggle',
  firebaseAuthAdvanced({ required: true }),
  validateBody({
    materialId: { required: true, type: 'string' as const }
  }),
  asyncHandler(toggleFavoriteMaterial)
);

router.get('/user/favorite-materials',
  firebaseAuthAdvanced({ required: true }),
  asyncHandler(getFavoriteEducationalMaterials)
);

router.post('/user/second-dose-config',
  firebaseAuthAdvanced({ required: true }),
  validateBody({
    selectedVaccines: { required: true, type: 'array' as const },
    createdBy: { required: true, type: 'string' as const }
  }),
  asyncHandler(saveSecondDoseConfiguration)
);

router.get('/user/second-dose-config',
  firebaseAuthAdvanced({ required: true }),
  asyncHandler(getSecondDoseConfiguration)
);

router.delete('/user/second-dose-config',
  firebaseAuthAdvanced({ required: true }),
  asyncHandler(removeSecondDoseConfiguration)
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

// Educational Materials Favorites Routes (for authenticated users)
router.patch('/users/favorites/educational-materials',
  firebaseAuthAdvanced({ required: true }),
  validateBody({
    materialId: { required: true, type: 'string' as const }
  }),
  asyncHandler(async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = (req as any).user?.uid || (req as any).user?.id
      const { materialId } = (req as any).body

      if (!userId || !materialId) {
        return res.status(400).json({
          error: "userId and materialId are required",
        });
      }

      const { toggleFavoriteEducationalMaterialController } = await import('../controllers/admin/userController');
      
      const modifiedReq = {
        ...req,
        params: { ...req.params, userId }
      }

      return await toggleFavoriteEducationalMaterialController(modifiedReq as any, res as any);
    } catch (error) {
      console.error("Erro ao atualizar material favorito:", error);
      return res.status(500).json({
        error: "Erro ao atualizar material educativo favorito",
      });
    }
  })
);

router.get('/users/favorites/educational-materials',
  firebaseAuthAdvanced({ required: true }),
  asyncHandler(async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = (req as any).user?.uid || (req as any).user?.id

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const { getUserFavoriteEducationalMaterialsController } = await import('../controllers/admin/userController');
      
      const modifiedReq = {
        ...req,
        params: { ...req.params, userId }
      }

      return await getUserFavoriteEducationalMaterialsController(modifiedReq as any, res as any);
    } catch (error) {
      console.error("Erro ao obter materiais favoritos:", error);
      return res.status(500).json({
        error: "Erro ao obter materiais educativos favoritos",
      });
    }
  })
);

// Webhook routes for external services
import { WebhookController } from '../controllers/webhooks/webhookController';

const webhookController = new WebhookController();

// Z-API WhatsApp status webhook
router.post('/webhooks/whatsapp/status',
  asyncHandler(webhookController.handleWhatsAppStatusUpdate.bind(webhookController))
);

// Webhook health check
router.get('/webhooks/health',
  asyncHandler(webhookController.healthCheck.bind(webhookController))
);

export default router;
