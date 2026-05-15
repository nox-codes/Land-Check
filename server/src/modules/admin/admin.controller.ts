import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service';

export async function getConfig(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, config: await adminService.getConfig() });
  } catch (err) { next(err); }
}

export async function updateConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) { res.status(400).json({ success: false, message: 'updates must be an array of { key, value } objects' }); return; }
    const invalid = updates.some(u => typeof u.key !== 'string' || !u.key || typeof u.value !== 'string');
    if (invalid) { res.status(400).json({ success: false, message: 'each entry must have a non-empty string key and a string value' }); return; }
    const result = await adminService.updateConfig(updates);
    res.json({ success: true, updated: result.length });
  } catch (err) { next(err); }
}

export async function runScraperNow(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.triggerScraper();
    res.json({ success: true, upserted: result.upserted, errors: result.errors });
  } catch (err) { next(err); }
}
