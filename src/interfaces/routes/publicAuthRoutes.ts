import { Router } from "express";
import { 
  registerWithEmail, 
  syncFirebaseUser, 
  verifyToken,
  sendPasswordReset
} from "../controllers/public/authController";
import { createAdminUser } from "../controllers/admin/adminAuthController";
import { validateBody } from "../../middlewares/validation";
import { asyncHandler } from "../../middlewares/errorHandling";
import { firebaseAuthAdvanced } from "../../middlewares/firebaseAuthAdvanced";

const router = Router();

// Public routes (no authentication required)
router.post("/register",
  validateBody({
    email: { required: true, type: 'string' as const },
    password: { required: true, type: 'string' as const, minLength: 6 },
    displayName: { required: false, type: 'string' as const }
  }),
  asyncHandler(registerWithEmail)
);

router.post("/verify-token",
  validateBody({
    idToken: { required: true, type: 'string' as const }
  }),
  asyncHandler(verifyToken)
);

router.post("/password-reset",
  validateBody({
    email: { required: true, type: 'string' as const }
  }),
  asyncHandler(sendPasswordReset)
);

// Protected routes (require Firebase authentication)
router.post("/sync",
  firebaseAuthAdvanced({ required: true }),
  validateBody({
    email: { required: false, type: 'string' as const },
    displayName: { required: false, type: 'string' as const }
  }),
  asyncHandler(syncFirebaseUser)
);

// Admin/Agent creation routes (no authentication required)
router.post("/admin/create",
  validateBody({
    email: { required: true, type: 'string' as const },
    password: { required: true, type: 'string' as const, minLength: 6 },
    displayName: { required: false, type: 'string' as const },
    role: { required: true, type: 'string' as const, enum: ['admin', 'agent'] as any[] }
  }),
  asyncHandler(createAdminUser)
);

export default router;
