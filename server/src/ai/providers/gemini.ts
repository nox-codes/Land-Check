import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import type { AIProvider, DocumentAnalysisResult, TrustSignals, TrustScoreResult, AnalysisInput, AIAnalysisResult } from '../types';
import { parseAIJsonResponse, computeTrustScoreFromSignals, parseLandVerificationResponse, applyScoreCeilings, scoreToStatus, buildLandVerificationPrompt } from '../utils';

export function createGeminiProvider(apiKey: string): AIProvider {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-1.5-flash' });

  return {
    async analyzeDocument(filePath: string, documentType: string): Promise<DocumentAnalysisResult> {
      const base64 = (await fs.readFile(path.resolve(filePath))).toString('base64');
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg';

      const result = await model.generateContent([
        { inlineData: { data: base64, mimeType } },
        `You are a Nigerian land document fraud detection expert. Analyze this ${documentType} document. Return ONLY a JSON object with: authenticityScore (0-100), findings (string[]), isSuspicious (boolean).`,
      ]);

      const rawResponse = result.response.text();
      try {
        return { ...parseAIJsonResponse(rawResponse), rawResponse };
      } catch {
        return { authenticityScore: 50, findings: ['Could not parse AI response'], isSuspicious: false, rawResponse };
      }
    },

    async computeTrustScore(verificationId: string, signals: TrustSignals): Promise<TrustScoreResult> {
      return computeTrustScoreFromSignals(verificationId, signals);
    },

    async analyzeLandVerification(input: AnalysisInput): Promise<AIAnalysisResult> {
      const { landRecord, submittedData, documents } = input;
      const prompt = buildLandVerificationPrompt(landRecord, submittedData, documents);

      const result = await model.generateContent([prompt]);
      const rawResponse = result.response.text();

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
        console.error('analyzeLandVerification parse error:', err);
        return {
          trustScore: 0,
          status: 'HIGH_RISK',
          matchReport: null,
          registryStatus: 'PENDING',
          summary: 'Could not parse AI response',
          signals: {},
        };
      }
    },
  };
}
