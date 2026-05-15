import { getAIProvider } from './index';
import { prisma } from '../lib/prisma';
import { applyScoreCeilings, parseLandVerificationResponse, buildLandVerificationPrompt, scoreToStatus } from './utils';
import type { MatchReport, AIAnalysisResult, AnalysisInput, LandRegistryRecord } from './types';

beforeAll(async () => {
  await prisma.adminConfig.upsert({ where: { key: 'active_ai_provider' }, update: { value: 'claude' }, create: { key: 'active_ai_provider', value: 'claude' } });
  await prisma.adminConfig.upsert({ where: { key: 'claude_api_key' }, update: { value: 'test-key' }, create: { key: 'claude_api_key', value: 'test-key' } });
});

afterAll(async () => {
  await prisma.adminConfig.update({ where: { key: 'active_ai_provider' }, data: { value: 'claude' } });
  await prisma.$disconnect();
});

describe('getAIProvider', () => {
  it('returns provider with analyzeDocument, computeTrustScore, and analyzeLandVerification', async () => {
    const provider = await getAIProvider();
    expect(typeof provider.analyzeDocument).toBe('function');
    expect(typeof provider.computeTrustScore).toBe('function');
    expect(typeof provider.analyzeLandVerification).toBe('function');
  });

  it('throws on unknown provider', async () => {
    await prisma.adminConfig.update({ where: { key: 'active_ai_provider' }, data: { value: 'unknown' } });
    await expect(getAIProvider()).rejects.toThrow('Unknown AI provider');
  });
});

describe('applyScoreCeilings', () => {
  it('caps score at 40 when registryStatus is NOT_FOUND', () => {
    const result = applyScoreCeilings(85, 'NOT_FOUND', null);
    expect(result).toBe(40);
  });

  it('caps score at 40 when NOT_FOUND and input score is above 40', () => {
    expect(applyScoreCeilings(75, 'NOT_FOUND', null)).toBe(40);
  });
  it('passes through score below ceiling when NOT_FOUND', () => {
    expect(applyScoreCeilings(20, 'NOT_FOUND', null)).toBe(20);
  });

  it('caps score at 60 when FOUND but not all fields match', () => {
    const matchReport: MatchReport = {
      parcelNumber: { match: true, note: 'Exact match' },
      ownerName: { match: false, note: 'Name mismatch' },
      location: { match: true, note: 'Exact match' },
      documentType: { match: true, note: 'Exact match' },
    };
    const result = applyScoreCeilings(90, 'FOUND', matchReport);
    expect(result).toBe(60);
  });

  it('does not cap score when all fields match', () => {
    const matchReport: MatchReport = {
      parcelNumber: { match: true, note: 'Exact match' },
      ownerName: { match: true, note: 'Exact match' },
      location: { match: true, note: 'Exact match' },
      documentType: { match: true, note: 'Exact match' },
    };
    const result = applyScoreCeilings(95, 'FOUND', matchReport);
    expect(result).toBe(95);
  });

  it('does not cap score when registryStatus is PENDING', () => {
    const result = applyScoreCeilings(80, 'PENDING', null);
    expect(result).toBe(80);
  });
});

describe('parseLandVerificationResponse', () => {
  it('parses a valid AI JSON response', () => {
    const raw = JSON.stringify({
      trustScore: 85,
      matchReport: {
        parcelNumber: { match: true, note: 'Exact match' },
        ownerName: { match: true, note: 'Exact match' },
        location: { match: true, note: 'Exact match' },
        documentType: { match: true, note: 'C of O confirmed' },
      },
      registryStatus: 'FOUND',
      summary: 'All fields verified against government record.',
      signals: { duplicateParcel: false },
    });
    const result = parseLandVerificationResponse(raw);
    expect(result.trustScore).toBe(85);
    expect(result.registryStatus).toBe('FOUND');
    expect(result.matchReport).not.toBeNull();
    expect(result.matchReport!.parcelNumber.match).toBe(true);
    expect(result.summary).toBe('All fields verified against government record.');
  });

  it('handles markdown-wrapped JSON', () => {
    const raw = '```json\n{"trustScore": 30, "matchReport": null, "registryStatus": "NOT_FOUND", "summary": "No record found.", "signals": {}}\n```';
    const result = parseLandVerificationResponse(raw);
    expect(result.trustScore).toBe(30);
    expect(result.registryStatus).toBe('NOT_FOUND');
  });

  it('defaults registryStatus to PENDING for invalid values', () => {
    const raw = JSON.stringify({ trustScore: 50, matchReport: null, registryStatus: 'INVALID', summary: '', signals: {} });
    const result = parseLandVerificationResponse(raw);
    expect(result.registryStatus).toBe('PENDING');
  });
});

describe('buildLandVerificationPrompt', () => {
  it('includes NOT IN REGISTRY marker when landRecord is null', () => {
    const prompt = buildLandVerificationPrompt(null, { parcelNumber: 'P123', ownerName: 'John', location: 'Lagos' }, []);
    expect(prompt).toContain('NOT IN REGISTRY — no government record found');
    expect(prompt).toContain('P123');
    expect(prompt).toContain('John');
    expect(prompt).toContain('Lagos');
  });

  it('includes land record JSON when present', () => {
    const record = { parcelNumber: 'P123', ownerName: 'John Doe', location: 'Lagos' };
    const prompt = buildLandVerificationPrompt(record, { parcelNumber: 'P123', ownerName: 'John Doe', location: 'Lagos' }, []);
    // The GOVERNMENT REGISTRY RECORD section should show JSON, not the "NOT IN REGISTRY" marker
    expect(prompt).toContain('"parcelNumber": "P123"');
    // The marker only appears when landRecord is null; when present, the registry section has JSON
    const registrySection = prompt.split('GOVERNMENT REGISTRY RECORD:')[1].split('USER SUBMITTED DATA:')[0];
    expect(registrySection).not.toContain('NOT IN REGISTRY — no government record found');
  });
});

describe('AI provider analyzeLandVerification (mocked)', () => {
  // We mock the Anthropic SDK at the module level to control the AI response
  const mockCreate = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    mockCreate.mockReset();
  });

  function mockAnthropicModule(responseText: string) {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: responseText }],
    });

    jest.doMock('@anthropic-ai/sdk', () => {
      return {
        __esModule: true,
        default: class MockAnthropic {
          messages = { create: mockCreate };
          constructor() {}
        },
      };
    });
  }

  it('returns NOT_FOUND and capped score when landRecord is null', async () => {
    const mockAIResponse = JSON.stringify({
      trustScore: 75,
      matchReport: null,
      registryStatus: 'NOT_FOUND',
      summary: 'No government record found for this parcel.',
      signals: { noRegistryRecord: true },
    });

    mockAnthropicModule(mockAIResponse);

    const { createClaudeProvider } = require('./providers/claude');
    const provider = createClaudeProvider('test-key');

    const input: AnalysisInput = {
      verificationId: 'test-v1',
      documents: [],
      landRecord: null,
      submittedData: { parcelNumber: 'P999', ownerName: 'Fake Owner', location: 'Nowhere' },
    };

    const result: AIAnalysisResult = await provider.analyzeLandVerification(input);
    expect(result.registryStatus).toBe('NOT_FOUND');
    expect(result.trustScore).toBeLessThanOrEqual(40);
  });

  it('caps score at 60 when FOUND but ownerName does not match', async () => {
    const mockAIResponse = JSON.stringify({
      trustScore: 85,
      matchReport: {
        parcelNumber: { match: true, note: 'Exact match' },
        ownerName: { match: false, note: 'Registry shows "Adebayo Okonkwo" but submitted "John Smith"' },
        location: { match: true, note: 'Exact match' },
        documentType: { match: true, note: 'C of O confirmed' },
      },
      registryStatus: 'FOUND',
      summary: 'Owner name mismatch detected.',
      signals: { ownerMismatch: true },
    });

    mockAnthropicModule(mockAIResponse);

    const { createClaudeProvider } = require('./providers/claude');
    const provider = createClaudeProvider('test-key');

    const landRecord: LandRegistryRecord = {
      parcelNumber: 'P123',
      ownerName: 'Adebayo Okonkwo',
      location: 'Lagos',
      transactionHistory: [],
      rawData: {},
      sourceUrl: 'https://registry.gov.ng/P123',
    };

    const input: AnalysisInput = {
      verificationId: 'test-v2',
      documents: [],
      landRecord,
      submittedData: { parcelNumber: 'P123', ownerName: 'John Smith', location: 'Lagos' },
    };

    const result: AIAnalysisResult = await provider.analyzeLandVerification(input);
    expect(result.registryStatus).toBe('FOUND');
    expect(result.trustScore).toBeLessThanOrEqual(60);
    expect(result.matchReport).not.toBeNull();
    expect(result.matchReport!.ownerName.match).toBe(false);
  });

  it('allows full score when all fields match', async () => {
    const mockAIResponse = JSON.stringify({
      trustScore: 92,
      matchReport: {
        parcelNumber: { match: true, note: 'Exact match' },
        ownerName: { match: true, note: 'Exact match' },
        location: { match: true, note: 'Exact match' },
        documentType: { match: true, note: 'C of O confirmed' },
      },
      registryStatus: 'FOUND',
      summary: 'All fields verified against government record. High confidence.',
      signals: {},
    });

    mockAnthropicModule(mockAIResponse);

    const { createClaudeProvider } = require('./providers/claude');
    const provider = createClaudeProvider('test-key');

    const landRecord: LandRegistryRecord = {
      parcelNumber: 'P456',
      ownerName: 'Chinedu Okafor',
      location: 'Abuja',
      transactionHistory: [],
      rawData: {},
      sourceUrl: 'https://registry.gov.ng/P456',
    };

    const input: AnalysisInput = {
      verificationId: 'test-v3',
      documents: [],
      landRecord,
      submittedData: { parcelNumber: 'P456', ownerName: 'Chinedu Okafor', location: 'Abuja' },
    };

    const result: AIAnalysisResult = await provider.analyzeLandVerification(input);
    expect(result.registryStatus).toBe('FOUND');
    expect(result.trustScore).toBe(92);
    expect(result.matchReport).not.toBeNull();
    expect(result.matchReport!.ownerName.match).toBe(true);
    expect(result.matchReport!.parcelNumber.match).toBe(true);
    expect(result.matchReport!.location.match).toBe(true);
  });
});
