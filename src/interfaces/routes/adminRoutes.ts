import { Router } from "express";
import { createUserController } from "../controllers/admin/userController";
import { createVaccineController } from "../controllers/admin/vaccineController";
import { listHealthUnitsController } from "../controllers/healthUnitsController";
import { 
  createFirebaseUser, 
  getFirebaseUser, 
  updateUserClaims, 
  toggleUserStatus, 
  deleteFirebaseUser,
  getCurrentUser 
} from "../controllers/admin/firebaseUserController";

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
