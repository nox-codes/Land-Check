import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ success: false, message: 'Email and password are required' }); return; }
    if (!email.includes('@')) { res.status(400).json({ success: false, message: 'Invalid email address' }); return; }
    const result = await authService.registerUser(email, password);
    res.status(201).json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ success: false, message: 'Email and password are required' }); return; }
    const result = await authService.loginUser(email, password);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
}

export function logout(_req: Request, res: Response) {
  res.json({ success: true, message: 'Logged out successfully' });
}
