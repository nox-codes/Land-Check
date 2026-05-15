import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import * as paymentsController from './payments.controller';

const router = Router();
router.post('/webhook', paymentsController.webhook); // Public — Squad calls this
router.use(requireAuth);
router.post('/initiate', paymentsController.initiatePayment);
router.get('/:verificationId', paymentsController.getPaymentStatus);
export default router;
