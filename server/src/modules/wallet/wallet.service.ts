import { prisma } from '../../lib/prisma';
import { createError } from '../../middleware/error.middleware';
import { Decimal } from '@prisma/client/runtime/library';

export async function getOrCreateWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 },
  });
}

export async function getWalletWithHistory(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      sentTxns: { orderBy: { createdAt: 'desc' }, take: 50 },
      receivedTxns: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });
  if (!wallet) {
    return getOrCreateWallet(userId);
  }
  return wallet;
}

export async function adminCreditWallet(targetUserId: string, amount: number, note?: string) {
  if (amount <= 0) throw createError('Amount must be positive', 400);
  await getOrCreateWallet(targetUserId);
  const [wallet, txn] = await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: targetUserId },
      data: { balance: { increment: new Decimal(amount) } },
    }),
    prisma.walletTransaction.create({
      data: {
        toWallet: { connect: { userId: targetUserId } },
        amount: new Decimal(amount),
        type: 'ADMIN_CREDIT',
        note: note ?? 'Admin credit',
      },
    }),
  ]);
  return { wallet, txn };
}

export async function adminDebitWallet(targetUserId: string, amount: number, note?: string) {
  if (amount <= 0) throw createError('Amount must be positive', 400);
  const wallet = await prisma.wallet.findUnique({ where: { userId: targetUserId } });
  if (!wallet) throw createError('Wallet not found', 404);
  if (wallet.balance.lessThan(amount)) throw createError('Insufficient balance', 400);
  const [updated, txn] = await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: targetUserId },
      data: { balance: { decrement: new Decimal(amount) } },
    }),
    prisma.walletTransaction.create({
      data: {
        fromWallet: { connect: { userId: targetUserId } },
        amount: new Decimal(amount),
        type: 'ADMIN_DEBIT',
        note: note ?? 'Admin debit',
      },
    }),
  ]);
  return { wallet: updated, txn };
}

export async function holdEscrow(buyerUserId: string, sellerUserId: string, amount: number, purchaseId: string) {
  const buyerWallet = await prisma.wallet.findUnique({ where: { userId: buyerUserId } });
  if (!buyerWallet) throw createError('Buyer wallet not found', 404);
  if (buyerWallet.balance.lessThan(amount)) throw createError('Insufficient balance', 400);

  await getOrCreateWallet(sellerUserId);

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: buyerUserId },
      data: { balance: { decrement: new Decimal(amount) } },
    }),
    prisma.walletTransaction.create({
      data: {
        fromWallet: { connect: { userId: buyerUserId } },
        amount: new Decimal(amount),
        type: 'ESCROW_HOLD',
        purchase: { connect: { id: purchaseId } },
        note: 'Escrow hold',
      },
    }),
  ]);
}

export async function releaseEscrow(purchaseId: string) {
  const purchase = await prisma.landPurchase.findUnique({
    where: { id: purchaseId },
    include: { buyer: { include: { wallet: true } }, seller: { include: { wallet: true } } },
  });
  if (!purchase) throw createError('Purchase not found', 404);
  if (purchase.status !== 'IN_ESCROW') throw createError('Purchase is not in escrow', 400);

  await getOrCreateWallet(purchase.sellerId);

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: purchase.sellerId },
      data: { balance: { increment: purchase.agreedAmount } },
    }),
    prisma.walletTransaction.create({
      data: {
        toWallet: { connect: { userId: purchase.sellerId } },
        amount: purchase.agreedAmount,
        type: 'ESCROW_RELEASE',
        purchase: { connect: { id: purchaseId } },
        note: 'Escrow released to seller',
      },
    }),
    prisma.landPurchase.update({
      where: { id: purchaseId },
      data: { status: 'COMPLETED' },
    }),
  ]);
}
