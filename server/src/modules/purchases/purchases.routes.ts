import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  initiatePurchase, getPurchase, getUserPurchases,
  initiateEscrow, completePurchase,
  acceptPurchase, declinePurchase, cancelPurchase,
  sendMessage, getMessages,
} from './purchases.service';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const purchases = await getUserPurchases((req.user as { id: string }).id);
    res.json({ success: true, purchases });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const buyerId = (req.user as { id: string }).id;
    const { parcelNumber, location, ownerName, sellerId, agreedAmount } = req.body as {
      parcelNumber: string; location: string; ownerName: string; sellerId: string; agreedAmount: number;
    };
    const purchase = await initiatePurchase(buyerId, { parcelNumber, location, ownerName, sellerId, agreedAmount });
    res.status(201).json({ success: true, purchase });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const purchase = await getPurchase(req.params['id'] as string, (req.user as { id: string }).id);
    res.json({ success: true, purchase });
  } catch (err) { next(err); }
});

router.post('/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const purchase = await acceptPurchase(req.params['id'] as string, (req.user as { id: string }).id);
    res.json({ success: true, purchase });
  } catch (err) { next(err); }
});

router.post('/:id/decline', requireAuth, async (req, res, next) => {
  try {
    const purchase = await declinePurchase(req.params['id'] as string, (req.user as { id: string }).id);
    res.json({ success: true, purchase });
  } catch (err) { next(err); }
});

router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const purchase = await cancelPurchase(req.params['id'] as string, (req.user as { id: string }).id);
    res.json({ success: true, purchase });
  } catch (err) { next(err); }
});

router.post('/:id/escrow', requireAuth, async (req, res, next) => {
  try {
    const purchase = await initiateEscrow(req.params['id'] as string, (req.user as { id: string }).id);
    res.json({ success: true, purchase });
  } catch (err) { next(err); }
});

router.post('/:id/complete', requireAuth, async (req, res, next) => {
  try {
    const purchase = await completePurchase(req.params['id'] as string, (req.user as { id: string }).id);
    res.json({ success: true, purchase });
  } catch (err) { next(err); }
});

router.get('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const messages = await getMessages(req.params['id'] as string, (req.user as { id: string }).id);
    res.json({ success: true, messages });
  } catch (err) { next(err); }
});

router.post('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const { content } = req.body as { content: string };
    const msg = await sendMessage(req.params['id'] as string, (req.user as { id: string }).id, content);
    res.status(201).json({ success: true, message: msg });
  } catch (err) { next(err); }
});

export default router;
