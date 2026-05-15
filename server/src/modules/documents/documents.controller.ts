import { Request, Response, NextFunction } from 'express';
import * as documentsService from './documents.service';
import type { MulterFile } from '../../storage/types';

const VALID_TYPES = ['C_OF_O', 'DEED', 'SURVEY_PLAN', 'POWER_OF_ATTORNEY'] as const;
type DocumentType = typeof VALID_TYPES[number];

export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }
    const userId = (req.user as { id: string }).id;
    const { verificationId, documentType } = req.body;
    if (!verificationId || !documentType) { res.status(400).json({ success: false, message: 'verificationId and documentType are required' }); return; }
    if (!VALID_TYPES.includes(documentType as DocumentType)) { res.status(400).json({ success: false, message: `documentType must be one of: ${VALID_TYPES.join(', ')}` }); return; }
    const document = await documentsService.uploadDocument(verificationId, userId, req.file as unknown as MulterFile, documentType as DocumentType);
    res.status(201).json({ success: true, document });
  } catch (err) { next(err); }
}

export async function getDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await documentsService.getDocument(req.params.id as string, (req.user as { id: string }).id);
    res.json({ success: true, document: doc });
  } catch (err) { next(err); }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    await documentsService.deleteDocument(req.params.id as string, (req.user as { id: string }).id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { next(err); }
}
