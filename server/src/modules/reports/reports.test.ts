import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

afterAll(async () => {
  await prisma.scamReport.deleteMany({ where: { parcelNumber: 'TEST-REPORT-001' } });
  await prisma.$disconnect();
});

describe('POST /api/v1/reports', () => {
  it('creates a report anonymously', async () => {
    const res = await request(app).post('/api/v1/reports').send({ parcelNumber: 'TEST-REPORT-001', description: 'Suspicious seller' });
    expect(res.status).toBe(201);
    expect(res.body.report.parcelNumber).toBe('TEST-REPORT-001');
  });

  it('returns 400 on missing fields', async () => {
    const res = await request(app).post('/api/v1/reports').send({ parcelNumber: 'TEST-REPORT-001' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for GET /reports without admin', async () => {
    const res = await request(app).get('/api/v1/reports');
    expect(res.status).toBe(401);
  });
});
