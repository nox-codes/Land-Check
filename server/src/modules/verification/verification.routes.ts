import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import * as verificationController from './verification.controller';

const router = Router();
router.use(requireAuth);
router.post('/', verificationController.createVerification);
router.get('/', verificationController.getVerifications);
router.get('/:id', verificationController.getVerification);
router.patch('/:id', verificationController.updateVerification);
export default router;
