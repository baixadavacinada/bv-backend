import { Router } from "express";
import { createUserController } from "../controllers/admin/userController";
import { 
  createVaccineController, 
  listVaccinesController, 
  getVaccineController, 
  updateVaccineController, 
  deleteVaccineController 
} from "../controllers/admin/vaccineController";
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
  updateAppointmentStatusController 
} from "../controllers/appointmentController";

import { authMiddleware, requireRole, requireActiveUser } from "../../middlewares/auth";
import { firebaseAuth, requireAdmin } from "../../middlewares/firebaseAuth";
import { validateBody, validateQuery, ValidationSchemas } from "../../middlewares/validation";
import { asyncHandler } from "../../middlewares/errorHandling";
import { adminRateLimit } from "../../middlewares/security";

const router = Router();

// Use Firebase authentication for admin routes
router.use(requireAdmin);
router.use(adminRateLimit);

// Traditional user endpoints (JWT-based)
router.post("/users",
  validateBody(ValidationSchemas.user),
  asyncHandler(createUserController)
);

// Vaccine endpoints
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

// Appointment endpoints
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

// Health units endpoints
router.get("/health-units",
  validateQuery(ValidationSchemas.pagination),
  asyncHandler(listHealthUnitsController)
);

// Firebase User Management Endpoints
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

export default router;
