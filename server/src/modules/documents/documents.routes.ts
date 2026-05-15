import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../../middleware/auth.middleware';
import * as documentsController from './documents.controller';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, JPEG, and PNG files are allowed'));
  },
});

const router = Router();
router.use(requireAuth);
router.post('/upload', upload.single('file'), documentsController.uploadDocument);
router.get('/:id', documentsController.getDocument);
router.delete('/:id', documentsController.deleteDocument);
export default router;
