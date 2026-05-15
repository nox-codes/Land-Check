import { Request, Response, NextFunction } from 'express';
import passport from '../lib/passport';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('jwt', { session: false }, (err: Error, user: Express.User) => {
    if (err || !user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    req.user = user;
    next();
  })(req, res, next);
}
