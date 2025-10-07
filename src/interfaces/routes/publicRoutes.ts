import { Router } from 'express';
import { loginController } from '../controllers/public/loginController';
import { listHealthUnitsController } from '../controllers/healthUnitsController';

const router = Router();

router.post('/auth/login', loginController);
router.get('/health-unit', listHealthUnitsController);

export default router;
