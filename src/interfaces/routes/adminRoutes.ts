import { Router } from "express";
import { createUserController } from "../controllers/admin/userController";
import { updateUserProfileController } from "../controllers/admin/profileController";
import { 
  createVaccineController, 
  listVaccinesController, 
  getVaccineController, 
  updateVaccineController, 
  deleteVaccineController 
} from "../controllers/admin/vaccineController";
import { VaccinationRecordController } from "../controllers/admin/vaccinationRecordController";
import { FeedbackController } from "../controllers/admin/feedbackController";
import { AdminNotificationController } from "../controllers/admin/notificationController";
import { AdminHealthUnitsController } from "../controllers/admin/healthUnitsController";
import { DashboardController } from "../controllers/admin/dashboardController";
import { ReportsController } from "../controllers/admin/reportsController";
import { listHealthUnitsController } from "../controllers/healthUnitsController";
import { 
  createFirebaseUser, 
  getFirebaseUser, 
  updateUserClaims, 
  toggleUserStatus, 
  deleteFirebaseUser,
  getCurrentUser 
} from "../controllers/admin/firebaseUserController";
import { 
  listAllAppointmentsController,
  updateAppointmentStatusController,
  getAppointmentStatsController,
  completeAppointmentWithVaccinationController
} from "../controllers/appointmentController";

import { firebaseAuthAdvanced } from "../../middlewares/firebaseAuthAdvanced";
import { 
  updateUserClaims as updateClaimsAdvanced, 
  getUserClaims as getClaimsAdvanced, 
  updateUserRole as updateRoleAdvanced, 
  deactivateUser, 
  reactivateUser, 
  bulkUpdateClaims 
} from "../controllers/admin/claimsController";
import { validateBody, validateQuery, ValidationSchemas } from "../../middlewares/validation";
import { asyncHandler } from "../../middlewares/errorHandling";
import { adminRateLimit } from "../../middlewares/security";

const router = Router();

router.use(firebaseAuthAdvanced({ roles: ['admin'] }));
router.use(adminRateLimit);

const vaccinationRecordController = new VaccinationRecordController();
const feedbackController = new FeedbackController();
const adminNotificationController = new AdminNotificationController();
const adminHealthUnitsController = new AdminHealthUnitsController();
const dashboardController = new DashboardController();
const reportsController = new ReportsController();

router.post("/users",
  validateBody(ValidationSchemas.user),
  asyncHandler(createUserController)
);

router.post("/vaccines",
  validateBody(ValidationSchemas.vaccine),
  asyncHandler(createVaccineController)
);

router.get("/vaccines",
  asyncHandler(listVaccinesController)
);

router.get("/vaccines/:id",
  asyncHandler(getVaccineController)
);

router.put("/vaccines/:id",
  validateBody(ValidationSchemas.vaccine),
  asyncHandler(updateVaccineController)
);

router.delete("/vaccines/:id",
  asyncHandler(deleteVaccineController)
);

router.post("/vaccination-records",
  validateBody({
    residentId: { required: true, type: 'string' as const },
    vaccineId: { required: true, type: 'string' as const },
    healthUnitId: { required: true, type: 'string' as const },
    appliedBy: { required: true, type: 'string' as const },
    dose: { required: true, type: 'string' as const, enum: ['1ª dose', '2ª dose', '3ª dose', 'dose única', 'reforço'] as any[] },
    date: { required: true, type: 'string' as const },
    notes: { required: false, type: 'string' as const, maxLength: 500 }
  }),
  asyncHandler(vaccinationRecordController.create.bind(vaccinationRecordController))
);

router.get("/vaccination-records",
  validateQuery({
    healthUnitId: { required: false, type: 'string' as const },
    startDate: { required: false, type: 'string' as const },
    endDate: { required: false, type: 'string' as const },
    residentId: { required: false, type: 'string' as const },
    vaccineId: { required: false, type: 'string' as const }
  }),
  asyncHandler(vaccinationRecordController.list.bind(vaccinationRecordController))
);

router.get("/vaccination-records/:id",
  asyncHandler(vaccinationRecordController.getById.bind(vaccinationRecordController))
);

router.put("/vaccination-records/:id",
  validateBody({
    notes: { required: false, type: 'string' as const, maxLength: 500 },
    dose: { required: false, type: 'string' as const, enum: ['1ª dose', '2ª dose', '3ª dose', 'dose única', 'reforço'] as any[] },
    date: { required: false, type: 'string' as const }
  }),
  asyncHandler(vaccinationRecordController.update.bind(vaccinationRecordController))
);

router.delete("/vaccination-records/:id",
  asyncHandler(vaccinationRecordController.delete.bind(vaccinationRecordController))
);

router.get("/appointments",
  validateQuery({
    healthUnitId: { required: false, type: 'string' as const },
    startDate: { required: false, type: 'string' as const },
    endDate: { required: false, type: 'string' as const }
  }),
  asyncHandler(listAllAppointmentsController)
);

router.patch("/appointments/:id/status",
  validateBody({
    status: { 
      required: true, 
      type: 'string' as const, 
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] as any[]
    },
    notes: { required: false, type: 'string' as const, maxLength: 500 }
  }),
  asyncHandler(updateAppointmentStatusController)
);

router.get("/appointments/stats",
  validateQuery({
    startDate: { required: false, type: 'string' as const },
    endDate: { required: false, type: 'string' as const }
  }),
  asyncHandler(getAppointmentStatsController)
);

router.patch("/appointments/:id/complete-vaccination",
  validateBody({
    appliedBy: { required: true, type: 'string' as const },
    vaccinationNotes: { required: false, type: 'string' as const, maxLength: 1000 },
    reactions: { required: false, type: 'string' as const, maxLength: 500 },
    nextDoseDate: { required: false, type: 'string' as const }
  }),
  asyncHandler(completeAppointmentWithVaccinationController)
);

router.get("/health-units",
  validateQuery({
    isActive: { required: false, type: 'boolean' as const },
    isFavorite: { required: false, type: 'boolean' as const },
    neighborhood: { required: false, type: 'string' as const },
    city: { required: false, type: 'string' as const },
    state: { required: false, type: 'string' as const }
  }),
  asyncHandler(adminHealthUnitsController.listAll.bind(adminHealthUnitsController))
);

router.post("/health-units",
  validateBody({
    name: { required: true, type: 'string' as const, minLength: 3, maxLength: 200 },
    address: { required: true, type: 'string' as const, minLength: 10, maxLength: 500 },
    neighborhood: { required: true, type: 'string' as const },
    city: { required: true, type: 'string' as const },
    state: { required: true, type: 'string' as const },
    zipCode: { required: true, type: 'string' as const },
    phone: { required: false, type: 'string' as const },
    operatingHours: { required: false, type: 'object' as const },
    availableVaccines: { required: false, type: 'array' as const },
    geolocation: { required: false, type: 'object' as const },
    isActive: { required: false, type: 'boolean' as const },
    isFavorite: { required: false, type: 'boolean' as const }
  }),
  asyncHandler(adminHealthUnitsController.create.bind(adminHealthUnitsController))
);

router.get("/health-units/:id",
  asyncHandler(adminHealthUnitsController.getById.bind(adminHealthUnitsController))
);

router.put("/health-units/:id",
  validateBody({
    name: { required: false, type: 'string' as const, minLength: 3, maxLength: 200 },
    address: { required: false, type: 'string' as const, minLength: 10, maxLength: 500 },
    neighborhood: { required: false, type: 'string' as const },
    city: { required: false, type: 'string' as const },
    state: { required: false, type: 'string' as const },
    zipCode: { required: false, type: 'string' as const },
    phone: { required: false, type: 'string' as const },
    operatingHours: { required: false, type: 'object' as const },
    availableVaccines: { required: false, type: 'array' as const },
    geolocation: { required: false, type: 'object' as const },
    isActive: { required: false, type: 'boolean' as const },
    isFavorite: { required: false, type: 'boolean' as const }
  }),
  asyncHandler(adminHealthUnitsController.update.bind(adminHealthUnitsController))
);

router.delete("/health-units/:id",
  asyncHandler(adminHealthUnitsController.delete.bind(adminHealthUnitsController))
);

router.get("/feedback",
  validateQuery({
    healthUnitId: { required: false, type: 'string' as const }
  }),
  asyncHandler(feedbackController.listAll.bind(feedbackController))
);

router.get("/feedback/health-unit",
  validateQuery({
    healthUnitId: { required: true, type: 'string' as const }
  }),
  asyncHandler(feedbackController.listByHealthUnit.bind(feedbackController))
);

router.get("/feedback/:id",
  asyncHandler(feedbackController.getById.bind(feedbackController))
);

router.patch("/feedback/:id/moderate",
  validateBody({
    isActive: { required: true, type: 'boolean' as const }
  }),
  asyncHandler(feedbackController.moderate.bind(feedbackController))
);

router.post("/notifications",
  validateBody({
    userId: { required: true, type: 'string' as const },
    title: { required: true, type: 'string' as const, minLength: 3, maxLength: 200 },
    message: { required: true, type: 'string' as const, minLength: 10, maxLength: 1000 },
    type: { 
      required: true, 
      type: 'string' as const, 
      enum: ['appointment_reminder', 'vaccine_available', 'dose_due', 'system_update', 'general'] as any[]
    },
    data: { required: false, type: 'object' as const },
    scheduledFor: { required: false, type: 'string' as const }
  }),
  asyncHandler(adminNotificationController.create.bind(adminNotificationController))
);

router.get("/notifications",
  validateQuery({
    userId: { required: false, type: 'string' as const },
    isRead: { required: false, type: 'boolean' as const },
    type: { required: false, type: 'string' as const },
    startDate: { required: false, type: 'string' as const },
    endDate: { required: false, type: 'string' as const }
  }),
  asyncHandler(adminNotificationController.listAll.bind(adminNotificationController))
);

router.get("/notifications/:id",
  asyncHandler(adminNotificationController.getById.bind(adminNotificationController))
);

router.delete("/notifications/:id",
  asyncHandler(adminNotificationController.delete.bind(adminNotificationController))
);

router.get("/dashboard/stats",
  asyncHandler(dashboardController.getDashboardStats.bind(dashboardController))
);

router.get("/dashboard/quick-stats",
  asyncHandler(dashboardController.getQuickStats.bind(dashboardController))
);

router.get("/reports/vaccination",
  validateQuery({
    startDate: { required: false, type: 'string' as const },
    endDate: { required: false, type: 'string' as const },
    healthUnitId: { required: false, type: 'string' as const },
    vaccineId: { required: false, type: 'string' as const }
  }),
  asyncHandler(dashboardController.getVaccinationReport.bind(dashboardController))
);

router.get("/reports/health-units",
  validateQuery({
    startDate: { required: false, type: 'string' as const },
    endDate: { required: false, type: 'string' as const },
    isActive: { required: false, type: 'boolean' as const },
    city: { required: false, type: 'string' as const },
    state: { required: false, type: 'string' as const }
  }),
  asyncHandler(dashboardController.getHealthUnitReport.bind(dashboardController))
);

router.post("/firebase/users",
  validateBody(ValidationSchemas.firebaseUser),
  asyncHandler(createFirebaseUser)
);

router.get("/firebase/users/:uid",
  asyncHandler(getFirebaseUser)
);

router.put("/firebase/users/claims",
  validateBody(ValidationSchemas.firebaseUserClaims),
  asyncHandler(updateUserClaims)
);

router.patch("/firebase/users/:uid/status",
  validateBody(ValidationSchemas.firebaseUserStatus),
  asyncHandler(toggleUserStatus)
);

router.delete("/firebase/users/:uid",
  asyncHandler(deleteFirebaseUser)
);

router.get("/firebase/me",
  asyncHandler(getCurrentUser)
);

router.get("/claims/:uid",
  asyncHandler(getClaimsAdvanced)
);

router.put("/claims",
  validateBody({
    uid: { required: true, type: 'string' as const },
    role: { required: false, type: 'string' as const, enum: ['admin', 'agent', 'public'] as any[] },
    permissions: { required: false, type: 'array' as const },
    ubsId: { required: false, type: 'string' as const },
    isActive: { required: false, type: 'boolean' as const }
  }),
  asyncHandler(updateClaimsAdvanced)
);

router.patch("/users/:uid/role",
  validateBody({
    role: { required: true, type: 'string' as const, enum: ['admin', 'agent', 'public'] as any[] }
  }),
  asyncHandler(updateRoleAdvanced)
);

router.patch("/users/:uid/profile",
  validateBody({
    displayName: { required: false, type: 'string' as const, minLength: 1, maxLength: 200 },
    personalData: { required: false, type: 'object' as const }
  }),
  asyncHandler(updateUserProfileController)
);

router.patch("/users/:uid/deactivate",
  asyncHandler(deactivateUser)
);

router.patch("/users/:uid/reactivate",
  asyncHandler(reactivateUser)
);

router.post("/claims/bulk-update",
  validateBody({
    updates: { required: true, type: 'array' as const }
  }),
  asyncHandler(bulkUpdateClaims)
);

router.post("/reports/feedbacks",
  validateBody({
    ubsId: { required: false, type: 'string' as const },
    startDate: { required: false, type: 'string' as const },
    endDate: { required: false, type: 'string' as const }
  }),
  asyncHandler(reportsController.generateFeedbackReport.bind(reportsController))
);

router.post("/reports/users",
  validateBody({
    roleFilter: { required: false, type: 'string' as const },
    statusFilter: { required: false, type: 'string' as const, enum: ['active', 'inactive', 'all'] as any[] }
  }),
  asyncHandler(reportsController.generateUserReport.bind(reportsController))
);

export default router;