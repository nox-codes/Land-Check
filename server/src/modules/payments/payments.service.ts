import { prisma } from '../../lib/prisma';
import * as squad from '../../payments/squad';
import { createError } from '../../middleware/error.middleware';

export async function initiatePayment(params: { verificationId: string; userId: string; amount: number; customerEmail: string; callbackUrl: string }) {
  const verification = await prisma.landVerification.findFirst({ where: { id: params.verificationId, userId: params.userId } });
  if (!verification) throw createError('Verification not found', 404);
  if (!verification.trustScore) throw createError('Verification not yet scored', 400);

  if (verification.status === 'HIGH_RISK') {
    const payment = await prisma.payment.upsert({
      where: { verificationId: params.verificationId },
      update: { status: 'BLOCKED' },
      create: { verificationId: params.verificationId, userId: params.userId, amount: params.amount, status: 'BLOCKED', metadata: { reason: 'HIGH_RISK' } },
    });
    return { status: 'BLOCKED', message: 'Payment blocked due to high fraud risk', payment };
  }

  if (verification.status === 'CAUTION') {
    const user = await prisma.user.findUnique({ where: { id: params.userId } });
    const virtualAccount = await squad.createVirtualAccount({
      verificationId: params.verificationId,
      amount: params.amount,
      customerEmail: params.customerEmail,
      // Use email local-part as customer name so squad.ts gets a clean name without @ character
      customerName: (user?.email ?? params.customerEmail).split('@')[0] ?? 'Customer',
    });
    const payment = await prisma.payment.upsert({
      where: { verificationId: params.verificationId },
      update: { squadVirtualAccountId: virtualAccount.virtualAccountNumber, squadReference: virtualAccount.reference, status: 'HELD' },
      create: { verificationId: params.verificationId, userId: params.userId, amount: params.amount, status: 'HELD', squadVirtualAccountId: virtualAccount.virtualAccountNumber, squadReference: virtualAccount.reference, metadata: { virtualAccount } },
    });
    return { status: 'HELD', virtualAccount, payment };
  }

  // VERIFIED — direct charge
  const charge = await squad.initiateCharge({ verificationId: params.verificationId, amount: params.amount, customerEmail: params.customerEmail, callbackUrl: params.callbackUrl });
  const payment = await prisma.payment.upsert({
    where: { verificationId: params.verificationId },
    update: { squadReference: charge.reference, status: 'PENDING' },
    create: { verificationId: params.verificationId, userId: params.userId, amount: params.amount, status: 'PENDING', squadReference: charge.reference },
  });
  return { status: 'PENDING', checkoutUrl: charge.checkoutUrl, payment };
}

export async function getPaymentStatus(verificationId: string, userId: string) {
  const payment = await prisma.payment.findFirst({ where: { verificationId, userId } });
  if (!payment) throw createError('Payment not found', 404);
  return payment;
}

export async function handleWebhook(payload: string, signature: string) {
  if (!(await squad.verifyWebhookSignature(payload, signature))) throw createError('Invalid webhook signature', 401);

  // Squad webhook shape (card payments):
  // { Event: "charge_successful", TransactionRef: "...", Body: { transaction_ref, amount, transaction_status, ... } }
  // Also handle legacy lowercase shape just in case.
  const raw = JSON.parse(payload) as Record<string, unknown>;

  const eventName = (raw['Event'] ?? raw['event'] ?? '') as string;
  // Accept both Squad event name formats
  if (!eventName.toLowerCase().includes('charge') || !eventName.toLowerCase().includes('success')) return;

  const body = (raw['Body'] ?? raw['data'] ?? {}) as Record<string, unknown>;
  const ref = (body['transaction_ref'] ?? raw['TransactionRef'] ?? '') as string;
  if (!ref) return;

  // Amount from Squad is in kobo
  const amountNgn = (Number(body['amount'] ?? body['transaction_amount'] ?? 0)) / 100;

  // ── Wallet top-up ──────────────────────────────────────────────────────────
  // Identify wallet top-ups by reference prefix: WALLET-{userId8}-{timestamp}
  if (ref.startsWith('WALLET-')) {
    const userId8 = ref.split('-')[1] ?? '';

    // Idempotency: skip if already processed
    const alreadyProcessed = await prisma.walletTransaction.findUnique({ where: { reference: ref } });
    if (alreadyProcessed) return;
    if (amountNgn <= 0) return;

    // Look up user by first-8-chars of UUID (embedded in our reference)
    const user = await prisma.user.findFirst({ where: { id: { startsWith: userId8 } } });
    if (!user) {
      console.error(`[Webhook] WALLET ref but no user found for prefix ${userId8}`);
      return;
    }
    const userId = user.id;

    await prisma.wallet.upsert({ where: { userId }, update: {}, create: { userId, balance: 0 } });
    await prisma.$transaction([
      prisma.wallet.update({ where: { userId }, data: { balance: { increment: amountNgn } } }),
      prisma.walletTransaction.create({
        data: {
          toWallet: { connect: { userId } },
          amount: amountNgn,
          type: 'FUND',
          reference: ref,
          note: `Squad top-up via webhook (ref: ${ref})`,
        },
      }),
    ]);
    console.log(`[Webhook] Wallet credited: userId=${userId} amount=₦${amountNgn} ref=${ref}`);
    return;
  }

  // ── Verification payment ───────────────────────────────────────────────────
  const payment = await prisma.payment.findFirst({ where: { squadReference: ref }, include: { verification: true } });
  if (payment && payment.verification.status === 'VERIFIED') {
    const updated = await prisma.payment.updateMany({ where: { id: payment.id, status: 'HELD' }, data: { status: 'RELEASED' } });
    if (updated.count > 0 && payment.squadVirtualAccountId) {
      await squad.releaseEscrow(payment.squadVirtualAccountId);
    }
  }
}
