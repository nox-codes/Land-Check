import { Request, Response, NextFunction } from 'express';
import * as verificationService from './verification.service';

export async function createVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const { parcelNumber, location, ownerName } = req.body;
    if (!parcelNumber || !location || !ownerName) { res.status(400).json({ success: false, message: 'parcelNumber, location, and ownerName are required' }); return; }
    const result = await verificationService.createVerification(userId, { parcelNumber, location, ownerName });
    res.status(201).json({ success: true, verification: result.verification, registryMessage: result.registryMessage });
  } catch (err) { next(err); }
}

export async function getVerifications(req: Request, res: Response, next: NextFunction) {
  try {
    const verifications = await verificationService.getUserVerifications((req.user as { id: string }).id);
    res.json({ success: true, verifications });
  } catch (err) { next(err); }
}

export async function getVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const verification = await verificationService.getVerificationById(req.params['id'] as string, (req.user as { id: string }).id);
    res.json({ success: true, verification });
  } catch (err) { next(err); }
}

export async function updateVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const { parcelNumber, location, ownerName } = req.body as Record<string, unknown>;
    const data: Partial<{ parcelNumber: string; location: string; ownerName: string }> = {};
    if (parcelNumber !== undefined) data.parcelNumber = String(parcelNumber);
    if (location !== undefined) data.location = String(location);
    if (ownerName !== undefined) data.ownerName = String(ownerName);
    if (Object.keys(data).length === 0) {
      res.status(400).json({ success: false, message: 'At least one of parcelNumber, location, ownerName is required' });
      return;
    }
    const verification = await verificationService.updateVerification(req.params.id as string, (req.user as { id: string }).id, data);
    res.json({ success: true, verification });
  } catch (err) { next(err); }
}
