import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import type {
  AIProvider,
  DocumentAnalysisResult,
  TrustSignals,
  TrustScoreResult,
  AnalysisInput,
  AIAnalysisResult,
} from '../types';
import {
  computeTrustScoreFromSignals,
  applyScoreCeilings,
  scoreToStatus,
  parseLandVerificationResponse,
} from '../utils';

const DEFAULT_URL = 'https://ailandcheck-production.up.railway.app';

interface AILandCheckResponse {
  verification_id: string;
  overall_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trust_score: number;
  squad_action: string;
  processing_time_seconds: number;
  report: string;
  ai_explanation?: string;
}

function extractFindingsFromReport(report: string): string[] {
  const findings: string[] = [];
  const lines = report.split('\n');
  let inFindings = false;
  for (const line of lines) {
    if (line.includes('## FINDINGS')) { inFindings = true; continue; }
    if (inFindings && line.startsWith('## ')) break;
    if (inFindings && line.trim().startsWith('-')) {
      const text = line.trim().replace(/^-\s*/, '').replace(/^[\s\W]+/, '').trim();
      if (text) findings.push(text);
    }
  }
  return findings.length > 0 ? findings : ['No specific findings noted'];
}

function buildHybridPrompt(
  landRecord: unknown | null,
  submittedData: { parcelNumber: string; ownerName: string; location: string },
  documents: Array<{ documentType?: string; aiLandCheck: AILandCheckResponse | null; findings: string[] }>,
): string {
  const docSection = documents.map((d, i) => {
    const lc = d.aiLandCheck;
    if (!lc) return `Document ${i + 1}: Extraction failed — no data available.`;
    return `Document ${i + 1}${d.documentType ? ` (${d.documentType})` : ''}:
  - AI LandCheck Extraction ID: ${lc.verification_id}
  - Overall Risk (from OCR forensics): ${lc.overall_risk}
  - Document Trust Score (from OCR forensics): ${lc.trust_score}/100
  - Recommended Squad Action: ${lc.squad_action}${lc.ai_explanation ? `\n  - AI Explanation: ${lc.ai_explanation}` : ''}
  - Full Forensic Report:
${lc.report}`;
  }).join('\n\n');

  return `You are a Nigerian land fraud detection system with access to structured document extraction results provided by AI LandCheck, an OCR and forensics tool that has already analyzed the physical documents. Your job is to use those extraction results — along with the government registry record and the buyer's submitted data — to make a final fraud risk determination.

AI LANDCHECK EXTRACTION RESULTS:
AI LandCheck is an offline OCR + forensics engine. It extracts fields (parcel numbers, owner names, stamps, signatures) and runs visual forgery detection. Its trust score and risk level reflect document authenticity only — it does NOT cross-reference registry data. Use its outputs as structured evidence, not as the final verdict.

${docSection}

GOVERNMENT REGISTRY RECORD:
${landRecord ? JSON.stringify(landRecord, null, 2) : 'NOT IN REGISTRY — no government record found for this parcel number'}

USER SUBMITTED DATA:
- Parcel Number: ${submittedData.parcelNumber}
- Owner Name: ${submittedData.ownerName}
- Location: ${submittedData.location}

INSTRUCTIONS:
1. Cross-reference the AI LandCheck extracted fields against the submitted data AND the government registry record.
2. If AI LandCheck extracted a parcel number, owner name, or location from the document, compare these extracted values to both the submitted data and registry record. Flag discrepancies.
3. If the government record is NOT IN REGISTRY, treat this as a strong fraud signal — trust score must not exceed 40.
4. If AI LandCheck flagged HIGH or CRITICAL risk, weight this heavily in your scoring.
5. Compare each submitted field against the government record EXACTLY. Partial matches should be marked false.
6. Return ONLY valid JSON — no markdown, no text outside the JSON object.

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
  "summary": "<2-3 sentence plain English summary integrating AI LandCheck findings and registry comparison>",
  "signals": {
    "aiLandCheckRisk": "<overall risk from AI LandCheck>",
    "aiLandCheckScore": <number>,
    "squadAction": "<recommended squad action>",
    <any other fraud signals>
  }
}`;
}

export function createAILandCheckProvider(claudeApiKey: string): AIProvider {
  const claude = new Anthropic({ apiKey: claudeApiKey });
  const baseUrl = process.env.AI_LANDCHECK_URL ?? DEFAULT_URL;

  return {
    async analyzeDocument(filePath: string, documentType: string): Promise<DocumentAnalysisResult> {
      const fileBuffer = await fs.readFile(path.resolve(filePath));
      const fileName = path.basename(filePath);

      const formData = new FormData();
      formData.append('file', new Blob([fileBuffer]), fileName);

      let rawResponse = '';
      try {
        const res = await fetch(`${baseUrl}/verify`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error(`AILandCheck returned ${res.status} ${res.statusText}`);

        const data = (await res.json()) as AILandCheckResponse;
        rawResponse = JSON.stringify(data);

        const findings = extractFindingsFromReport(data.report);

        return {
          authenticityScore: Math.max(0, Math.min(100, data.trust_score)),
          findings,
          isSuspicious: data.overall_risk === 'HIGH' || data.overall_risk === 'CRITICAL',
          rawResponse,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          authenticityScore: 50,
          findings: [`AI LandCheck extraction failed: ${msg}`],
          isSuspicious: false,
          rawResponse,
        };
      }
    },

    async computeTrustScore(verificationId: string, signals: TrustSignals): Promise<TrustScoreResult> {
      return computeTrustScoreFromSignals(verificationId, signals);
    },

    async analyzeLandVerification(input: AnalysisInput): Promise<AIAnalysisResult> {
      const { landRecord, submittedData, documents } = input;

      // Parse AI LandCheck raw data stored in each document's rawResponse
      const enrichedDocs = documents.map((doc, i) => {
        let aiLandCheck: AILandCheckResponse | null = null;
        try {
          if (doc.rawResponse) aiLandCheck = JSON.parse(doc.rawResponse) as AILandCheckResponse;
        } catch {
          // rawResponse may be non-JSON (e.g. from Claude fallback) — leave null
        }
        return { documentType: `Document ${i + 1}`, aiLandCheck, findings: doc.findings };
      });

      const prompt = buildHybridPrompt(landRecord, submittedData, enrichedDocs);

      const response = await claude.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        system: 'You are a Nigerian land fraud detection expert. You receive structured document extraction results from AI LandCheck (an OCR forensics tool) and cross-reference them with government registry data and buyer-submitted information to produce a final fraud risk verdict. Be strict and precise. Never infer or assume matches.',
        messages: [{ role: 'user', content: prompt }],
      });

      const rawResponse = response.content[0].type === 'text' ? response.content[0].text : '';

      try {
        const parsed = parseLandVerificationResponse(rawResponse);
        const finalScore = applyScoreCeilings(parsed.trustScore, parsed.registryStatus, parsed.matchReport);
        const status = scoreToStatus(finalScore);
        return {
          trustScore: finalScore,
          status,
          matchReport: parsed.matchReport,
          registryStatus: parsed.registryStatus,
          summary: parsed.summary,
          signals: parsed.signals,
        };
      } catch (err) {
        console.error('analyzeLandVerification (ailandcheck) parse error:', err);
        return {
          trustScore: 0,
          status: 'HIGH_RISK',
          matchReport: null,
          registryStatus: 'PENDING',
          summary: 'Could not parse Claude response after AI LandCheck extraction',
          signals: {},
        };
      }
    },
  };
}
