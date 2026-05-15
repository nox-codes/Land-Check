import { prisma } from '../lib/prisma';
import { createClaudeProvider } from './providers/claude';
import { createGeminiProvider } from './providers/gemini';
import type { AIProvider } from './types';

export async function getAIProvider(): Promise<AIProvider> {
  const [providerRow, claudeRow, geminiRow] = await Promise.all([
    prisma.adminConfig.findUnique({ where: { key: 'active_ai_provider' } }),
    prisma.adminConfig.findUnique({ where: { key: 'claude_api_key' } }),
    prisma.adminConfig.findUnique({ where: { key: 'gemini_api_key' } }),
  ]);

  const provider = providerRow?.value ?? 'claude';
  const claudeKey = claudeRow?.value ?? process.env.CLAUDE_API_KEY ?? 'PLACEHOLDER';
  const geminiKey = geminiRow?.value ?? process.env.GEMINI_API_KEY ?? 'PLACEHOLDER';

  switch (provider) {
    case 'claude': return createClaudeProvider(claudeKey);
    case 'gemini': return createGeminiProvider(geminiKey);
    default: throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export type { AIProvider, AIAnalysisResult, AnalysisInput, LandRegistryRecord, MatchReport, FieldMatch } from './types';
