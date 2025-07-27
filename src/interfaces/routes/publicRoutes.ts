import { Router } from 'express';
import { loginController } from '../controllers/public/loginController';
import { listUbsController } from '../controllers/public/ubsController';

const router = Router();

router.post('/auth/login', loginController);
router.get('/ubs', listUbsController);

export default router;
