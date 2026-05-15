import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { prisma } from '../../lib/prisma';

const router = Router();

// Get notifications for logged-in user (most recent 50)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ success: true, notifications, unreadCount });
  } catch (err) { next(err); }
});

// Mark one as read
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    await prisma.notification.updateMany({
      where: { id: req.params['id'] as string, userId },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Mark all as read
router.post('/read-all', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
