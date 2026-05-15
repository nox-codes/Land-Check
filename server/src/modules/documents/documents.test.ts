import { prisma } from '../../lib/prisma';
import type { AIAnalysisResult, DocumentAnalysisResult, TrustScoreResult } from '../../ai/types';

// --- Mock the AI cross-reference helper ---
const mockRunCrossReference = jest.fn<Promise<AIAnalysisResult>, [unknown, unknown, unknown]>();
jest.mock('../../ai/cross-reference', () => ({
  __esModule: true,
  runCrossReference: (...args: unknown[]) => mockRunCrossReference(args[0], args[1], args[2]),
}));

// --- Mock the AI provider (used by uploadDocument for document analysis + recomputeTrustScore) ---
const mockAnalyzeDocument = jest.fn<Promise<DocumentAnalysisResult>, [string, string]>();
const mockComputeTrustScore = jest.fn<Promise<TrustScoreResult>, [string, unknown]>();
const mockAnalyzeLandVerification = jest.fn<Promise<AIAnalysisResult>, [unknown]>();

jest.mock('../../ai', () => ({
  __esModule: true,
  getAIProvider: jest.fn().mockResolvedValue({
    analyzeDocument: (...args: unknown[]) => mockAnalyzeDocument(args[0] as string, args[1] as string),
    computeTrustScore: (...args: unknown[]) => mockComputeTrustScore(args[0] as string, args[1]),
    analyzeLandVerification: (...args: unknown[]) => mockAnalyzeLandVerification(args[0]),
  }),
}));

// --- Mock the storage adapter ---
jest.mock('../../storage', () => ({
  __esModule: true,
  getStorageAdapter: jest.fn().mockResolvedValue({
    save: jest.fn().mockResolvedValue('/uploads/test-file.pdf'),
    delete: jest.fn().mockResolvedValue(undefined),
    getUrl: jest.fn().mockReturnValue('/uploads/test-file.pdf'),
  }),
}));

import { uploadDocument } from './documents.service';
import type { MulterFile } from '../../storage/types';
import request from 'supertest';
import app from '../../app';

let token: string;
let userId: string;
let verificationId: string;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: 'doctest@landverify.com' } });
  const res = await request(app).post('/api/v1/auth/register').send({ email: 'doctest@landverify.com', password: 'Pass123!' });
  token = res.body.token;
  userId = res.body.user.id;

  // Create a verification directly in the DB (bypass the service which would also need mocking)
  const v = await prisma.landVerification.create({
    data: { userId, parcelNumber: 'DOC-TEST-001', location: 'Lagos', ownerName: 'Doc Tester' },
  });
  verificationId = v.id;
});

beforeEach(() => {
  mockRunCrossReference.mockReset();
  mockAnalyzeDocument.mockReset();
  mockComputeTrustScore.mockReset();
  mockAnalyzeLandVerification.mockReset();

  mockAnalyzeDocument.mockResolvedValue({
    authenticityScore: 78,
    findings: ['Document appears genuine'],
    isSuspicious: false,
    rawResponse: '{}',
  });

  mockComputeTrustScore.mockResolvedValue({
    verificationId,
    score: 78,
    status: 'VERIFIED',
    reason: 'Document appears genuine',
    triggeredBy: 'AI',
  });

  mockRunCrossReference.mockResolvedValue({
    trustScore: 75,
    status: 'VERIFIED',
    matchReport: null,
    registryStatus: 'NOT_FOUND',
    summary: 'Cross-reference complete.',
    signals: {},
  });
});

afterAll(async () => {
  await prisma.document.deleteMany({ where: { verificationId } });
  await prisma.trustScoreEvent.deleteMany({ where: { verificationId } });
  await prisma.landVerification.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: 'doctest@landverify.com' } });
  await prisma.$disconnect();
});

describe('Document upload triggers cross-reference', () => {
  it('calls runCrossReference after document upload and analysis', async () => {
    const fakeFile: MulterFile = {
      fieldname: 'file',
      originalname: 'test.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      destination: '/tmp',
      filename: 'test.pdf',
      path: '/tmp/test.pdf',
    };

    const doc = await uploadDocument(verificationId, userId, fakeFile, 'C_OF_O');

    expect(doc).toBeDefined();
    expect(doc.verificationId).toBe(verificationId);
    expect(mockAnalyzeDocument).toHaveBeenCalledTimes(1);
    expect(mockRunCrossReference).toHaveBeenCalledTimes(1);

    // Check that the verification was updated with cross-reference result
    const updated = await prisma.landVerification.findUnique({ where: { id: verificationId } });
    expect(updated).not.toBeNull();
    expect(updated!.trustScore).toBe(75);
  });

  it('updates verification registryStatus to FOUND when land record exists', async () => {
    // Create a land record and link it to the verification (simulates what createVerification does)
    const land = await prisma.land.upsert({
      where: { parcelNumber: 'DOC-TEST-001' },
      update: {},
      create: {
        parcelNumber: 'DOC-TEST-001',
        ownerName: 'Doc Tester',
        location: 'Lagos',
        rawData: {},
        sourceUrl: 'https://registry.gov.ng/DOC-TEST-001',
      },
    });
    await prisma.landVerification.update({ where: { id: verificationId }, data: { landId: land.id } });

    mockRunCrossReference.mockResolvedValue({
      trustScore: 90,
      status: 'VERIFIED',
      matchReport: {
        parcelNumber: { match: true, note: 'Exact match' },
        ownerName: { match: true, note: 'Exact match' },
        location: { match: true, note: 'Exact match' },
        documentType: { match: true, note: 'N/A' },
      },
      registryStatus: 'FOUND',
      summary: 'All fields match.',
      signals: {},
    });

    const fakeFile: MulterFile = {
      fieldname: 'file',
      originalname: 'deed.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 2048,
      destination: '/tmp',
      filename: 'deed.pdf',
      path: '/tmp/deed.pdf',
    };

    await uploadDocument(verificationId, userId, fakeFile, 'DEED');

    const updated = await prisma.landVerification.findUnique({ where: { id: verificationId } });
    expect(updated).not.toBeNull();
    expect(updated!.registryStatus).toBe('FOUND');
    expect(updated!.landId).toBe(land.id);
    expect(updated!.trustScore).toBe(90);

    // Clean up
    await prisma.landVerification.update({ where: { id: verificationId }, data: { landId: null } });
    await prisma.land.delete({ where: { parcelNumber: 'DOC-TEST-001' } });
  });
});
