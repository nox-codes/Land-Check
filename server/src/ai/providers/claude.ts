import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import type { AIProvider, DocumentAnalysisResult, TrustSignals, TrustScoreResult, AnalysisInput, AIAnalysisResult } from '../types';
import { parseAIJsonResponse, computeTrustScoreFromSignals, parseLandVerificationResponse, applyScoreCeilings, scoreToStatus, buildLandVerificationPrompt } from '../utils';

export function createClaudeProvider(apiKey: string): AIProvider {
  const client = new Anthropic({ apiKey });

  return {
    async analyzeDocument(filePath: string, documentType: string): Promise<DocumentAnalysisResult> {
      const fileBuffer = await fs.readFile(path.resolve(filePath));
      const base64 = fileBuffer.toString('base64');
      const ext = path.extname(filePath).toLowerCase();

      const prompt = `You are a Nigerian land document fraud detection expert. Analyze this ${documentType} document. Return ONLY a JSON object with: authenticityScore (0-100), findings (string[]), isSuspicious (boolean).`;

      let content: Anthropic.MessageParam['content'];
      if (ext === '.pdf') {
        content = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as Anthropic.DocumentBlockParam,
          { type: 'text', text: prompt },
        ];
      } else {
        const mediaType = ext === '.png' ? 'image/png' : 'image/jpeg';
        content = [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: prompt },
        ];
      }

      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content }],
      });

      const rawResponse = response.content[0].type === 'text' ? response.content[0].text : '';
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

      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
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
