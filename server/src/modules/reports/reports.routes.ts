import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import * as reportsController from './reports.controller';

const router = Router();
router.post('/', reportsController.createReport); // anonymous allowed
router.get('/', requireAuth, requireAdmin, reportsController.getAllReports);
export default router;
