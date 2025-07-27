import { Router } from 'express';
import { vaccinationController } from '../controllers/admin/vaccinationController';

const router = Router();

router.post('/vaccination-record', vaccinationController);

export default router;
