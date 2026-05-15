import { getAIProvider } from './index';
import type { LandRegistryRecord, AIAnalysisResult } from './types';

export async function runCrossReference(
  verification: { id: string; parcelNumber: string; ownerName: string; location: string },
  landRecord: {
    parcelNumber: string;
    ownerName: string;
    location: string;
    documentType?: string | null;
    registrationDate?: Date | null;
    size?: string | null;
    encumbrances?: string | null;
    transactionHistory: unknown;
    rawData: unknown;
    sourceUrl: string;
  } | null,
  documents: Array<{ analysisResult: unknown }>,
): Promise<AIAnalysisResult> {
  const provider = await getAIProvider();

  const landRegistryRecord: LandRegistryRecord | null = landRecord
    ? {
        parcelNumber: landRecord.parcelNumber,
        ownerName: landRecord.ownerName,
        location: landRecord.location,
        documentType: landRecord.documentType,
        registrationDate: landRecord.registrationDate,
        size: landRecord.size,
        encumbrances: landRecord.encumbrances,
        transactionHistory: Array.isArray(landRecord.transactionHistory)
          ? landRecord.transactionHistory
          : [],
        rawData: landRecord.rawData,
        sourceUrl: landRecord.sourceUrl,
      }
    : null;

  return provider.analyzeLandVerification({
    verificationId: verification.id,
    landRecord: landRegistryRecord,
    submittedData: {
      parcelNumber: verification.parcelNumber,
      ownerName: verification.ownerName,
      location: verification.location,
    },
    documents: documents.map((d) => {
      const result = d.analysisResult as Record<string, unknown> | null;
      return {
        authenticityScore: Number(result?.authenticityScore) || 50,
        findings: Array.isArray(result?.findings)
          ? (result.findings as string[])
          : [],
        isSuspicious: Boolean(result?.isSuspicious),
        rawResponse: typeof result?.rawResponse === 'string' ? result.rawResponse : '',
      };
    }),
  });
}
