import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import type { AIAnalysisResult } from '../../ai/types';

// Mock the cross-reference helper so tests don't hit the real AI provider
const mockRunCrossReference = jest.fn<Promise<AIAnalysisResult>, [unknown, unknown, unknown]>();
jest.mock('../../ai/cross-reference', () => ({
  __esModule: true,
  runCrossReference: (...args: unknown[]) => mockRunCrossReference(args[0], args[1], args[2]),
}));

const defaultAIResult: AIAnalysisResult = {
  trustScore: 0,
  status: 'HIGH_RISK',
  matchReport: null,
  registryStatus: 'NOT_FOUND',
  summary: 'No government record found.',
  signals: {},
};

let token: string;
let userId: string;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: 'verify@landverify.com' } });
  const res = await request(app).post('/api/v1/auth/register').send({ email: 'verify@landverify.com', password: 'Pass123!' });
  token = res.body.token;
  userId = res.body.user.id;
});

beforeEach(() => {
  mockRunCrossReference.mockReset();
  mockRunCrossReference.mockResolvedValue(defaultAIResult);
});

afterAll(async () => {
  await prisma.landVerification.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: 'verify@landverify.com' } });
  await prisma.land.deleteMany({ where: { parcelNumber: { in: ['LG-FOUND-001'] } } });
  await prisma.$disconnect();
});

describe('POST /api/v1/verifications', () => {
  it('creates a verification', async () => {
    const res = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ parcelNumber: 'LG-001', location: 'Lagos Island', ownerName: 'John Doe' });
    expect(res.status).toBe(201);
    expect(res.body.verification.parcelNumber).toBe('LG-001');
  });

  it('returns registryStatus in the response', async () => {
    const res = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ parcelNumber: 'LG-REG-001', location: 'Lagos', ownerName: 'Test Owner' });
    expect(res.status).toBe(201);
    expect(res.body.verification.registryStatus).toBeDefined();
  });

  it('returns registryStatus FOUND when a matching Land record exists', async () => {
    // Create a land record first
    await prisma.land.upsert({
      where: { parcelNumber: 'LG-FOUND-001' },
      update: {},
      create: {
        parcelNumber: 'LG-FOUND-001',
        ownerName: 'Registry Owner',
        location: 'Lekki Phase 1',
        rawData: {},
        sourceUrl: 'https://registry.gov.ng/LG-FOUND-001',
      },
    });

    mockRunCrossReference.mockResolvedValue({
      trustScore: 85,
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

    const res = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ parcelNumber: 'LG-FOUND-001', location: 'Lekki Phase 1', ownerName: 'Registry Owner' });
    expect(res.status).toBe(201);
    expect(res.body.verification.registryStatus).toBe('FOUND');
    expect(res.body.registryMessage).toBeNull();
  });

  it('returns registryMessage warning when no Land record exists', async () => {
    mockRunCrossReference.mockResolvedValue({
      trustScore: 30,
      status: 'HIGH_RISK',
      matchReport: null,
      registryStatus: 'NOT_FOUND',
      summary: 'No record found.',
      signals: {},
    });

    const res = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ parcelNumber: 'LG-MISSING-999', location: 'Unknown', ownerName: 'Ghost Owner' });
    expect(res.status).toBe(201);
    expect(res.body.verification.registryStatus).toBe('NOT_FOUND');
    expect(res.body.registryMessage).toMatch(/not found.*Lagos Land Registry/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/v1/verifications').send({ parcelNumber: 'LG-002', location: 'Abuja', ownerName: 'Jane' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/verifications', () => {
  it('returns user verifications list', async () => {
    const res = await request(app).get('/api/v1/verifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.verifications)).toBe(true);
  });
});

describe('GET /api/v1/verifications/:id', () => {
  it('returns a single verification', async () => {
    const create = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ parcelNumber: 'LG-ID-001', location: 'Lekki', ownerName: 'Solo Test' });
    const id = create.body.verification.id;
    const res = await request(app).get(`/api/v1/verifications/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.verification.id).toBe(id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/v1/verifications/nonexistent-id').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/verifications/:id', () => {
  it('updates allowed fields', async () => {
    const create = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ parcelNumber: 'LG-PATCH-001', location: 'Mainland', ownerName: 'Original Name' });
    const id = create.body.verification.id;
    const res = await request(app)
      .patch(`/api/v1/verifications/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ownerName: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.verification.ownerName).toBe('Updated Name');
  });

  it('rejects mass-assignment of status field', async () => {
    const create = await request(app)
      .post('/api/v1/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ parcelNumber: 'LG-MASS-001', location: 'VI', ownerName: 'Test' });
    const id = create.body.verification.id;
    const res = await request(app)
      .patch(`/api/v1/verifications/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'VERIFIED' });
    // empty data (status is stripped) -> 400
    expect(res.status).toBe(400);
  });
});
