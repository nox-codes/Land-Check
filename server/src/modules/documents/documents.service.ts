import { TriggeredBy } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { getAIProvider } from '../../ai';
import { getStorageAdapter } from '../../storage';
import { pubsub, TRUST_SCORE_UPDATED } from '../../lib/pubsub';
import { createError } from '../../middleware/error.middleware';
import { runCrossReference } from '../../ai/cross-reference';
import { publishVerificationUpdate } from '../../graphql/pubsub';
import type { MulterFile } from '../../storage/types';

type DocumentType = 'C_OF_O' | 'DEED' | 'SURVEY_PLAN' | 'POWER_OF_ATTORNEY';

export async function uploadDocument(verificationId: string, userId: string, file: MulterFile, documentType: DocumentType) {
  const verification = await prisma.landVerification.findFirst({ where: { id: verificationId, userId } });
  if (!verification) throw createError('Verification not found', 404);

  // Analyse before storage.save so file.path is guaranteed on disk (cloud adapters may remove temp file during save)
  const ai = await getAIProvider();
  let analysisResult = null;
  let authenticityScore = null;
  try {
    const analysis = await ai.analyzeDocument(file.path, documentType);
    analysisResult = analysis;
    authenticityScore = analysis.authenticityScore ?? null;
  } catch (err) {
    console.error('AI document analysis failed:', err);
  }

  const storage = await getStorageAdapter();
  const filePath = await storage.save(file);

  const document = await prisma.document.create({
    data: { verificationId, type: documentType, filePath, analysisResult: analysisResult as object, authenticityScore },
  });

  await recomputeTrustScore(verificationId, userId);

  // Re-run cross-reference with all documents now available
  // Fetch with land included to avoid a separate prisma.land.findUnique call
  try {
    const parentVerification = await prisma.landVerification.findUnique({
      where: { id: document.verificationId },
      include: { documents: true, land: true },
    });
    if (parentVerification) {
      const landRecord = parentVerification.land ?? null;
      const aiResult = await runCrossReference(parentVerification, landRecord, parentVerification.documents);
      await prisma.landVerification.update({
        where: { id: parentVerification.id },
        data: {
          trustScore: aiResult.trustScore,
          status: aiResult.status,
          registryStatus: landRecord ? 'FOUND' : 'NOT_FOUND',
          landId: landRecord?.id ?? null,
          matchReport: aiResult.matchReport ? JSON.parse(JSON.stringify(aiResult.matchReport)) : undefined,
        },
      });
      publishVerificationUpdate({
        ...parentVerification,
        trustScore: aiResult.trustScore,
        status: aiResult.status,
      }).catch(console.error);
    }
  } catch (err) {
    console.error('AI cross-reference re-run failed after document upload:', err);
    // document is already saved — don't fail the upload
  }

  return document;
}

export async function recomputeTrustScore(verificationId: string, userId: string) {
  const verification = await prisma.landVerification.findFirst({ where: { id: verificationId, userId }, include: { documents: true } });
  if (!verification) throw createError('Verification not found', 404);

  const ai = await getAIProvider();
  const signals = {
    documents: verification.documents.map(d => ({
      authenticityScore: d.authenticityScore ?? 50,
      findings: (d.analysisResult as { findings?: string[] })?.findings ?? [],
      isSuspicious: (d.analysisResult as { isSuspicious?: boolean })?.isSuspicious ?? false,
      rawResponse: '',
    })),
    parcelNumber: verification.parcelNumber,
    ownerName: verification.ownerName,
    location: verification.location,
  };

  const result = await ai.computeTrustScore(verificationId, signals);

  await prisma.trustScoreEvent.create({
    data: { verificationId, previousScore: verification.trustScore, newScore: result.score, reason: result.reason, triggeredBy: TriggeredBy.AI },
  });

  const updated = await prisma.landVerification.update({ where: { id: verificationId }, data: { trustScore: result.score, status: result.status } });

  pubsub.publish(TRUST_SCORE_UPDATED, {
    trustScoreUpdated: { ...result, id: verificationId, createdAt: new Date().toISOString() },
  });

  return updated;
}

export async function getDocument(id: string, userId: string) {
  const doc = await prisma.document.findFirst({ where: { id, verification: { userId } }, include: { verification: true } });
  if (!doc) throw createError('Document not found', 404);
  return doc;
}

export async function deleteDocument(id: string, userId: string) {
  const doc = await prisma.document.findFirst({ where: { id, verification: { userId } } });
  if (!doc) throw createError('Document not found', 404);
  const storage = await getStorageAdapter();
  await storage.delete(doc.filePath);
  await prisma.document.deleteMany({ where: { id, verification: { userId } } });
}
