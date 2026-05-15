import { Router } from 'express';
import passport from '../../lib/passport';
import { authLimiter } from '../../lib/rate-limiters';
import { requireAuth } from '../../middleware/auth.middleware';
import { issueTokenForOAuthUser } from './auth.service';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', requireAuth, authController.logout);

router.get('/me', requireAuth, (req, res) => {
  const user = req.user as { id: string; email: string; role: string };
  res.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/v1/auth/google/failure' }),
  (req, res) => {
    const user = req.user as { id: string; role: string };
    const token = issueTokenForOAuthUser(user.id, user.role);
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
    res.redirect(`${clientUrl}#token=${token}`);
  }
);

router.get('/google/failure', (_req, res) => {
  res.status(401).json({ success: false, message: 'Google authentication failed' });
});

export default router;
