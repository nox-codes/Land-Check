import type { TrustSignals, TrustScoreResult, MatchReport } from './types';

export function scoreToStatus(score: number): 'VERIFIED' | 'CAUTION' | 'HIGH_RISK' {
  if (score >= 75) return 'VERIFIED';
  if (score >= 40) return 'CAUTION';
  return 'HIGH_RISK';
}

export function computeTrustScoreFromSignals(verificationId: string, signals: TrustSignals): TrustScoreResult {
  const avg = signals.documents.length > 0
    ? signals.documents.reduce((s, d) => s + d.authenticityScore, 0) / signals.documents.length
    : 50;
  const penalty = signals.documents.filter(d => d.isSuspicious).length * 15;
  const score = Math.max(0, Math.min(100, Math.round(avg - penalty)));
  const reason = signals.documents.flatMap(d => d.findings).join('; ') || 'Analysis complete';
  return { verificationId, score, status: scoreToStatus(score), reason, triggeredBy: 'AI' };
}

export function parseAIJsonResponse(raw: string): { authenticityScore: number; findings: string[]; isSuspicious: boolean } {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  return {
    authenticityScore: Math.max(0, Math.min(100, Number(parsed.authenticityScore) || 50)),
    findings: Array.isArray(parsed.findings) ? (parsed.findings as string[]) : [],
    isSuspicious: Boolean(parsed.isSuspicious),
  };
}

export function parseLandVerificationResponse(raw: string): {
  trustScore: number;
  matchReport: MatchReport | null;
  registryStatus: 'FOUND' | 'NOT_FOUND' | 'PENDING';
  summary: string;
  signals: Record<string, unknown>;
} {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  const trustScore = Math.max(0, Math.min(100, Number(parsed.trustScore) || 0));

  let matchReport: MatchReport | null = null;
  if (parsed.matchReport && typeof parsed.matchReport === 'object') {
    const mr = parsed.matchReport as Record<string, unknown>;
    matchReport = {
      parcelNumber: parseFieldMatch(mr.parcelNumber),
      ownerName: parseFieldMatch(mr.ownerName),
      location: parseFieldMatch(mr.location),
      documentType: parseFieldMatch(mr.documentType),
    };
  }

  const registryStatus = (parsed.registryStatus === 'FOUND' || parsed.registryStatus === 'NOT_FOUND' || parsed.registryStatus === 'PENDING')
    ? parsed.registryStatus
    : 'PENDING';

  const summary = typeof parsed.summary === 'string' ? parsed.summary : '';
  const signals = (parsed.signals && typeof parsed.signals === 'object') ? parsed.signals as Record<string, unknown> : {};

  return { trustScore, matchReport, registryStatus, summary, signals };
}

function parseFieldMatch(value: unknown): { match: boolean; note: string } {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return {
      match: Boolean(v.match),
      note: typeof v.note === 'string' ? v.note : '',
    };
  }
  return { match: false, note: '' };
}

export function applyScoreCeilings(
  score: number,
  registryStatus: 'FOUND' | 'NOT_FOUND' | 'PENDING',
  matchReport: MatchReport | null,
): number {
  if (registryStatus === 'NOT_FOUND') return Math.min(score, 40);
  if (registryStatus === 'FOUND') {
    if (!matchReport) return Math.min(score, 60); // no field evidence — treat as partial
    const allMatch = Object.values(matchReport).every(f => f.match);
    if (!allMatch) return Math.min(score, 60);
  }
  return score;
}

export function buildLandVerificationPrompt(
  landRecord: unknown | null,
  submittedData: { parcelNumber: string; ownerName: string; location: string },
  documentAnalyses: unknown[],
): string {
  return `You are a Nigerian land fraud detection system. Be strict and precise. Do not infer or assume matches — only mark a field as matching if it is explicitly confirmed by the government record.

GOVERNMENT REGISTRY RECORD:
${landRecord ? JSON.stringify(landRecord, null, 2) : 'NOT IN REGISTRY — no government record found for this parcel number'}

USER SUBMITTED DATA:
- Parcel Number: ${submittedData.parcelNumber}
- Owner Name: ${submittedData.ownerName}
- Location: ${submittedData.location}

DOCUMENT ANALYSIS RESULTS:
${JSON.stringify(documentAnalyses, null, 2)}

INSTRUCTIONS:
1. Compare each submitted field against the government record EXACTLY. Do not treat abbreviations, shortened names, or partial matches as matches. If the submitted value is not a verbatim or near-verbatim match for the registry value, set match to false. When in doubt, set match to false.
2. If the government record is NOT IN REGISTRY, treat this as a STRONG fraud signal. The trust score must not exceed 40.
3. Return a trust score from 0-100.
4. Return a field-level match report.
5. Return only valid JSON — no markdown, no explanation outside JSON.

REQUIRED JSON FORMAT:
{
  "trustScore": <number 0-100>,
  "matchReport": {
    "parcelNumber": { "match": <boolean>, "note": "<explanation>" },
    "ownerName":    { "match": <boolean>, "note": "<explanation>" },
    "location":     { "match": <boolean>, "note": "<explanation>" },
    "documentType": { "match": <boolean>, "note": "<explanation or 'No document type in registry' if absent>" }
  },
  "registryStatus": "<FOUND|NOT_FOUND>",
  "summary": "<2-3 sentence plain English summary of findings>",
  "signals": { <any additional fraud signals as key-value pairs> }
}`;
}
