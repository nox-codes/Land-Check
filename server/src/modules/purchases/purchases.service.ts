import { prisma } from '../../lib/prisma';
import { createError } from '../../middleware/error.middleware';
import { createVerification } from '../verification/verification.service';
import { holdEscrow, releaseEscrow, getOrCreateWallet } from '../wallet/wallet.service';

async function notify(userId: string, type: Parameters<typeof prisma.notification.create>[0]['data']['type'], title: string, body: string, purchaseId?: string) {
  await prisma.notification.create({ data: { userId, type, title, body, purchaseId: purchaseId ?? null } });
}

export async function initiatePurchase(
  buyerId: string,
  data: { parcelNumber: string; location: string; ownerName: string; sellerId: string; agreedAmount: number }
) {
  await getOrCreateWallet(buyerId);
  await getOrCreateWallet(data.sellerId);

  const { verification } = await createVerification(buyerId, {
    parcelNumber: data.parcelNumber,
    location: data.location,
    ownerName: data.ownerName,
  });

  const purchase = await prisma.landPurchase.create({
    data: {
      buyerId,
      sellerId: data.sellerId,
      verificationId: verification.id,
      agreedAmount: data.agreedAmount,
      status: 'PENDING_SELLER',
    },
    include: {
      buyer: { select: { id: true, email: true } },
      seller: { select: { id: true, email: true } },
      verification: { include: { documents: true } },
    },
  });

  // Notify seller of the incoming offer
  const buyer = purchase.buyer;
  await notify(
    data.sellerId,
    'OFFER_RECEIVED',
    'New Purchase Offer',
    `${buyer.email} wants to buy ${data.parcelNumber} for ₦${data.agreedAmount.toLocaleString()}`,
    purchase.id
  );

  return purchase;
}

export async function acceptPurchase(purchaseId: string, sellerId: string) {
  const purchase = await prisma.landPurchase.findFirst({ where: { id: purchaseId, sellerId } });
  if (!purchase) throw createError('Purchase not found', 404);
  if (purchase.status !== 'PENDING_SELLER') throw createError('Purchase cannot be accepted in its current state', 400);

  const updated = await prisma.landPurchase.update({
    where: { id: purchaseId },
    data: { status: 'INITIATED' },
    include: {
      buyer: { select: { id: true, email: true } },
      seller: { select: { id: true, email: true } },
      verification: { include: { documents: true } },
    },
  });

  await notify(
    purchase.buyerId,
    'OFFER_ACCEPTED',
    'Purchase Offer Accepted!',
    `${updated.seller.email} accepted your purchase offer for parcel ${updated.verification?.id}.`,
    purchaseId
  );

  return updated;
}

export async function declinePurchase(purchaseId: string, sellerId: string) {
  const purchase = await prisma.landPurchase.findFirst({ where: { id: purchaseId, sellerId } });
  if (!purchase) throw createError('Purchase not found', 404);
  if (purchase.status !== 'PENDING_SELLER') throw createError('Purchase cannot be declined in its current state', 400);

  const updated = await prisma.landPurchase.update({
    where: { id: purchaseId },
    data: { status: 'DECLINED' },
    include: {
      buyer: { select: { id: true, email: true } },
      seller: { select: { id: true, email: true } },
      verification: { include: { documents: true } },
    },
  });

  await notify(
    purchase.buyerId,
    'OFFER_DECLINED',
    'Purchase Offer Declined',
    `${updated.seller.email} declined your purchase offer.`,
    purchaseId
  );

  return updated;
}

export async function cancelPurchase(purchaseId: string, userId: string) {
  const purchase = await prisma.landPurchase.findFirst({
    where: { id: purchaseId, OR: [{ buyerId: userId }, { sellerId: userId }] },
  });
  if (!purchase) throw createError('Purchase not found', 404);
  if (['COMPLETED', 'CANCELLED', 'DECLINED'].includes(purchase.status)) {
    throw createError('Purchase cannot be cancelled in its current state', 400);
  }
  // If in escrow, we don't auto-refund here — admin must handle manually for safety
  if (purchase.status === 'IN_ESCROW') {
    throw createError('Purchase is in escrow — contact support to cancel', 400);
  }

  return prisma.landPurchase.update({
    where: { id: purchaseId },
    data: { status: 'CANCELLED' },
    include: {
      buyer: { select: { id: true, email: true } },
      seller: { select: { id: true, email: true } },
      verification: { include: { documents: true } },
    },
  });
}

export async function getPurchase(purchaseId: string, userId: string) {
  const purchase = await prisma.landPurchase.findFirst({
    where: { id: purchaseId, OR: [{ buyerId: userId }, { sellerId: userId }] },
    include: {
      buyer: { select: { id: true, email: true } },
      seller: { select: { id: true, email: true } },
      verification: { include: { documents: true, scoreHistory: { orderBy: { createdAt: 'desc' } } } },
      transactions: { orderBy: { createdAt: 'desc' } },
      messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, email: true } } } },
    },
  });
  if (!purchase) throw createError('Purchase not found', 404);
  return purchase;
}

export async function getUserPurchases(userId: string) {
  return prisma.landPurchase.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    include: {
      buyer: { select: { id: true, email: true } },
      seller: { select: { id: true, email: true } },
      verification: { select: { id: true, parcelNumber: true, location: true, trustScore: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function initiateEscrow(purchaseId: string, buyerId: string) {
  const purchase = await prisma.landPurchase.findFirst({ where: { id: purchaseId, buyerId } });
  if (!purchase) throw createError('Purchase not found', 404);
  if (!['INITIATED', 'DOCS_UPLOADED', 'AI_REVIEWED'].includes(purchase.status)) {
    throw createError('Purchase must be accepted before moving to escrow', 400);
  }

  await holdEscrow(buyerId, purchase.sellerId, Number(purchase.agreedAmount), purchaseId);

  const updated = await prisma.landPurchase.update({
    where: { id: purchaseId },
    data: { status: 'IN_ESCROW' },
    include: {
      buyer: { select: { id: true, email: true } },
      seller: { select: { id: true, email: true } },
      verification: { include: { documents: true } },
      transactions: { orderBy: { createdAt: 'desc' } },
    },
  });

  await notify(purchase.sellerId, 'ESCROW_HELD', 'Funds Held in Escrow', `Buyer has locked ₦${Number(purchase.agreedAmount).toLocaleString()} in escrow.`, purchaseId);

  return updated;
}

export async function completePurchase(purchaseId: string, buyerId: string) {
  const purchase = await prisma.landPurchase.findFirst({ where: { id: purchaseId, buyerId } });
  if (!purchase) throw createError('Purchase not found', 404);
  await releaseEscrow(purchaseId);

  await notify(purchase.sellerId, 'ESCROW_RELEASED', 'Payment Released', `Buyer confirmed — funds released to your wallet.`, purchaseId);

  return getPurchase(purchaseId, buyerId);
}

export async function sendMessage(purchaseId: string, senderId: string, content: string) {
  const purchase = await prisma.landPurchase.findFirst({
    where: { id: purchaseId, OR: [{ buyerId: senderId }, { sellerId: senderId }] },
  });
  if (!purchase) throw createError('Not authorized for this purchase', 403);

  const msg = await prisma.message.create({
    data: { purchaseId, senderId, content },
    include: { sender: { select: { id: true, email: true } } },
  });

  // Notify the other party
  const recipientId = purchase.buyerId === senderId ? purchase.sellerId : purchase.buyerId;
  await notify(recipientId, 'MESSAGE_RECEIVED', 'New Message', content.slice(0, 80), purchaseId);

  return msg;
}

export async function getMessages(purchaseId: string, userId: string) {
  const purchase = await prisma.landPurchase.findFirst({
    where: { id: purchaseId, OR: [{ buyerId: userId }, { sellerId: userId }] },
  });
  if (!purchase) throw createError('Not authorized', 403);

  return prisma.message.findMany({
    where: { purchaseId },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, email: true } } },
  });
}
