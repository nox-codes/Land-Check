import { Request, Response, NextFunction } from 'express';
import * as reportsService from './reports.service';

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string } | undefined)?.id;
    const { parcelNumber, description, evidenceUrls } = req.body;
    if (!parcelNumber || !description) { res.status(400).json({ success: false, message: 'parcelNumber and description are required' }); return; }
    const report = await reportsService.createReport({ userId, parcelNumber, description, evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [] });
    res.status(201).json({ success: true, report });
  } catch (err) { next(err); }
}

export async function getAllReports(_req: Request, res: Response, next: NextFunction) {
  try {
    const reports = await reportsService.getAllReports();
    res.json({ success: true, reports });
  } catch (err) { next(err); }
}
