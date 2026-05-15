import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import { getWalletWithHistory, adminCreditWallet, adminDebitWallet, getOrCreateWallet } from './wallet.service';
import { initiateWalletTopup, verifyTransaction, initiateWithdrawal } from '../../payments/squad';
import { prisma } from '../../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// Get my wallet + history
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const wallet = await getWalletWithHistory(userId);
    res.json({ success: true, wallet });
  } catch (err) {
    next(err);
  }
});

// Ensure wallet exists (called on dashboard load)
router.post('/ensure', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const wallet = await getOrCreateWallet(userId);
    res.json({ success: true, wallet });
  } catch (err) {
    next(err);
  }
});

// Initiate a real Squad top-up for the logged-in user's wallet
router.post('/topup', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as { id: string; email: string };
    const { amount, callbackUrl } = req.body as { amount: number; callbackUrl?: string };
    if (!amount || amount < 100) {
      res.status(400).json({ success: false, message: 'Minimum top-up is ₦100' });
      return;
    }
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
    const result = await initiateWalletTopup({
      userId: user.id,
      email: user.email,
      amount,
      callbackUrl: callbackUrl ?? `${clientUrl}/app/wallet?topup=success`,
    });
    res.json({ success: true, checkoutUrl: result.checkoutUrl, reference: result.reference });
  } catch (err) {
    next(err);
  }
});

// Manually verify a Squad payment reference and credit the wallet
// Used in local dev where Squad can't fire webhooks to localhost
router.post('/topup/verify/:reference', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const reference = req.params['reference'] as string;

    // Idempotency check
    const existing = await prisma.walletTransaction.findUnique({ where: { reference } });
    if (existing) {
      res.json({ success: true, message: 'Already processed', alreadyCredited: true });
      return;
    }

    const tx = await verifyTransaction(reference);
    // Squad returns "Success" (capital S) — normalise before comparing
    if (!tx.status.toLowerCase().includes('success')) {
      res.status(400).json({ success: false, message: `Transaction not successful (status: ${tx.status})` });
      return;
    }
    // Squad does not reliably preserve our metadata, so we verify ownership via
    // reference prefix: WALLET-{userId8}-{timestamp}
    const parts = reference.split('-');
    if (parts[0] !== 'WALLET' || parts[1] !== userId.slice(0, 8)) {
      res.status(400).json({ success: false, message: 'Reference does not belong to this wallet' });
      return;
    }

    const amountNgn = tx.amount;
    await prisma.wallet.upsert({ where: { userId }, update: {}, create: { userId, balance: 0 } });
    try {
      await prisma.$transaction([
        prisma.wallet.update({ where: { userId }, data: { balance: { increment: new Decimal(amountNgn) } } }),
        prisma.walletTransaction.create({
          data: { toWallet: { connect: { userId } }, amount: amountNgn, type: 'FUND', reference, note: `Squad top-up verified manually (ref: ${reference})` },
        }),
      ]);
    } catch (txErr: unknown) {
      // P2002 = unique constraint violation — reference already recorded (race / double-call)
      if ((txErr as { code?: string }).code === 'P2002') {
        res.json({ success: true, message: 'Already processed', alreadyCredited: true });
        return;
      }
      throw txErr;
    }
    res.json({ success: true, amountCredited: amountNgn });
  } catch (err) {
    next(err);
  }
});

// Withdraw to bank account via Squad
router.post('/withdraw', requireAuth, async (req, res, next) => {
  try {
    const userId = (req.user as { id: string }).id;
    const { amount, accountNumber, bankCode, accountName } = req.body as {
      amount: number; accountNumber: string; bankCode: string; accountName: string;
    };
    if (!amount || amount < 100) {
      res.status(400).json({ success: false, message: 'Minimum withdrawal is ₦100' });
      return;
    }
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance.lessThan(amount)) {
      res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      return;
    }

    // Generate reference first so we can record it even if Squad call fails
    const ref = `WD-${userId.slice(0, 8)}-${Date.now()}`;

    // Deduct from wallet first — if Squad payout fails (e.g. sandbox limits)
    // the debit is still recorded and support can reconcile. In production,
    // Squad webhooks confirm actual bank delivery.
    await prisma.$transaction([
      prisma.wallet.update({ where: { userId }, data: { balance: { decrement: new Decimal(amount) } } }),
      prisma.walletTransaction.create({
        data: { fromWallet: { connect: { userId } }, amount, type: 'ADMIN_DEBIT', reference: ref, note: `Withdrawal to ${accountName} (${accountNumber})` },
      }),
    ]);

    // Best-effort Squad payout — log error but don't fail the response
    try {
      await initiateWithdrawal({ userId, amount, accountNumber, bankCode, accountName, ref });
    } catch (squadErr) {
      console.error('[Withdrawal] Squad payout error (wallet already debited):', (squadErr as Error).message);
    }

    res.json({ success: true, reference: ref });
  } catch (err) {
    next(err);
  }
});

// Admin: credit any wallet
router.post('/admin/credit', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { userId, amount, note } = req.body as { userId: string; amount: number; note?: string };
    const result = await adminCreditWallet(userId, amount, note);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Admin: debit any wallet
router.post('/admin/debit', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { userId, amount, note } = req.body as { userId: string; amount: number; note?: string };
    const result = await adminDebitWallet(userId, amount, note);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Admin: list all wallets
router.get('/admin/all', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { prisma } = await import('../../lib/prisma');
    const wallets = await prisma.wallet.findMany({
      include: { user: { select: { id: true, email: true } } },
      orderBy: { balance: 'desc' },
    });
    res.json({ success: true, wallets });
  } catch (err) {
    next(err);
  }
});

export default router;
