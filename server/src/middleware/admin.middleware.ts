import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as { role: string } | undefined;
  if (!user || user.role !== 'ADMIN') { res.status(403).json({ success: false, message: 'Forbidden' }); return; }
  next();
}
