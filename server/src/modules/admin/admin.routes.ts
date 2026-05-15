import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import * as adminController from './admin.controller';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/config', adminController.getConfig);
router.patch('/config', adminController.updateConfig);
router.post('/scraper/run', adminController.runScraperNow);
export default router;
