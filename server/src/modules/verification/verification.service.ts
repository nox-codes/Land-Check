import { prisma } from '../../lib/prisma';
import { createError } from '../../middleware/error.middleware';
import { publishVerificationUpdate } from '../../graphql/pubsub';
import { runCrossReference } from '../../ai/cross-reference';
import { scrapeParcel } from '../../scraper/index';
import type { AIAnalysisResult } from '../../ai/types';

export async function createVerification(userId: string, data: { parcelNumber: string; location: string; ownerName: string }) {
  // 1. Create the verification
  const verification = await prisma.landVerification.create({
    data: { userId, ...data },
    include: { documents: true, payment: true },
  });

  // 2. Check Land registry — trigger on-demand scrape if not already cached
  let landRecord = await prisma.land.findUnique({ where: { parcelNumber: data.parcelNumber } });
  if (!landRecord) {
    console.log(`Registry cache miss for ${data.parcelNumber} — running on-demand scrape`);
    try {
      await scrapeParcel(data.parcelNumber);
      landRecord = await prisma.land.findUnique({ where: { parcelNumber: data.parcelNumber } });
    } catch (err) {
      console.error('On-demand scrape failed:', err);
    }
  }

  // 3. Run AI cross-reference (no documents yet -- pass empty array)
  let aiResult: AIAnalysisResult;
  try {
    aiResult = await runCrossReference(verification, landRecord, []);
  } catch (err) {
    console.error('AI cross-reference failed during createVerification:', err);
    aiResult = {
      trustScore: 0,
      status: 'HIGH_RISK',
      matchReport: null,
      registryStatus: landRecord ? 'FOUND' : 'NOT_FOUND',
      summary: 'AI analysis unavailable',
      signals: {},
    };
  }

  // 4. Update verification with registry result
  const updated = await prisma.landVerification.update({
    where: { id: verification.id },
    data: {
      trustScore: aiResult.trustScore,
      status: aiResult.status,
      registryStatus: landRecord ? 'FOUND' : 'NOT_FOUND',
      landId: landRecord?.id ?? null,
      matchReport: aiResult.matchReport ? JSON.parse(JSON.stringify(aiResult.matchReport)) : undefined,
    },
    include: { documents: true, payment: true },
  });

  publishVerificationUpdate(updated).catch(console.error);
  return {
    verification: updated,
    registryMessage: landRecord
      ? null
      : 'This parcel number was not found in the Lagos Land Registry. Proceed with extreme caution.',
  };
}

export async function getUserVerifications(userId: string) {
  return prisma.landVerification.findMany({ where: { userId }, include: { documents: true, payment: true }, orderBy: { createdAt: 'desc' } });
}

export async function getVerificationById(id: string, userId: string) {
  const v = await prisma.landVerification.findFirst({ where: { id, userId }, include: { documents: true, payment: true, scoreHistory: { orderBy: { createdAt: 'desc' } } } });
  if (!v) throw createError('Verification not found', 404);
  return v;
}

export async function updateVerification(id: string, userId: string, data: Partial<{ parcelNumber: string; location: string; ownerName: string }>) {
  const existing = await prisma.landVerification.findFirst({ where: { id, userId } });
  if (!existing) throw createError('Verification not found', 404);
  const updated = await prisma.landVerification.update({ where: { id }, data, include: { documents: true, payment: true } });
  publishVerificationUpdate(updated).catch(console.error);
  return updated;
}
