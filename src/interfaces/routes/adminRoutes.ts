import { Router } from "express";
import { createUserController } from "../controllers/admin/userController";
import { createVaccineController } from "../controllers/admin/vaccineController";
import { createHealthUnitController, getHealthUnitByIdController, listHealthUnitsController, toggleActiveController, toggleFavoriteController, toggleVisibilityController, updateHealthUnitController } from "../controllers/healthUnitsController";

import { authMiddleware, requireRole, requireActiveUser } from "../../middlewares/auth";
import { validateBody, validateQuery, ValidationSchemas } from "../../middlewares/validation";
import { asyncHandler } from "../../middlewares/errorHandling";
import { adminRateLimit } from "../../middlewares/security";

const router = Router();

router.use(authMiddleware);
router.use(requireActiveUser);
router.use(adminRateLimit);

router.post("/users",
  requireRole('admin'),
  validateBody(ValidationSchemas.user),
  asyncHandler(createUserController)
);

router.post("/vaccines",
  requireRole('admin', 'agent'),
  validateBody(ValidationSchemas.vaccine),
  asyncHandler(createVaccineController)
);

router.post("/health-units",
  requireRole('admin'),
  validateBody(ValidationSchemas.healthUnit),
  asyncHandler(createHealthUnitController)
);

router.get("/health-units",
  requireRole('admin', 'agent'),
  validateQuery(ValidationSchemas.pagination),
  asyncHandler(listHealthUnitsController)
);

router.get("/health-units/:id",
  requireRole('admin', 'agent'),
  asyncHandler(getHealthUnitByIdController)
);

router.put("/health-units/:id",
  requireRole('admin'),
  validateBody(ValidationSchemas.healthUnit),
  asyncHandler(updateHealthUnitController)
);

router.patch("/health-units/:id/favorite",
  requireRole('admin', 'agent'),
  asyncHandler(toggleFavoriteController)
);

router.patch("/health-units/:id/active",
  requireRole('admin'),
  asyncHandler(toggleActiveController)
);

router.patch("/health-units/:id/visibility",
  requireRole('admin'),
  asyncHandler(toggleVisibilityController)
);

export default router;
