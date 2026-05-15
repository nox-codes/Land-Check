import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { prisma } from '../../lib/prisma';

const router = Router();

// Search users by name prefix (email) for seller lookup
router.get('/search', requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q ?? '').trim();
    if (!q || q.length < 2) {
      res.json({ success: true, users: [] });
      return;
    }
    const currentUserId = (req.user as { id: string }).id;
    const users = await prisma.user.findMany({
      where: {
        email: { contains: q, mode: 'insensitive' },
        id: { not: currentUserId },
      },
      select: { id: true, email: true },
      take: 10,
    });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

export default router;
