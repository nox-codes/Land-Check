import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import argon2 from 'argon2';

jest.mock('../../scraper/index', () => ({
  runScraper: jest.fn().mockResolvedValue({ upserted: 3, errors: 0 }),
}));

let adminToken: string;
let userToken: string;

beforeAll(async () => {
  // Create an admin user directly (role must be set via Prisma since register creates USER)
  await prisma.user.deleteMany({ where: { email: 'admin@landverify.com' } });
  const passwordHash = await argon2.hash('AdminPass123!');
  await prisma.user.create({ data: { email: 'admin@landverify.com', passwordHash, role: 'ADMIN' } });
  const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@landverify.com', password: 'AdminPass123!' });
  adminToken = res.body.token;

  // Create a regular (non-admin) user
  await prisma.user.deleteMany({ where: { email: 'user@landverify.com' } });
  const reg = await request(app).post('/api/v1/auth/register').send({ email: 'user@landverify.com', password: 'Pass123!' });
  userToken = reg.body.token;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: ['admin@landverify.com', 'user@landverify.com'] } } });
  await prisma.$disconnect();
});

describe('GET /api/v1/admin/config', () => {
  it('returns config for admin user', async () => {
    const res = await request(app).get('/api/v1/admin/config').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.config)).toBe(true);
  });

  it('returns 403 without admin role', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({ email: 'nonadmin@landverify.com', password: 'Pass123!' });
    const res = await request(app).get('/api/v1/admin/config').set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(403);
    await prisma.user.deleteMany({ where: { email: 'nonadmin@landverify.com' } });
  });
});

describe('PATCH /api/v1/admin/config', () => {
  it('updates config as admin', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ updates: [{ key: 'active_ai_provider', value: 'gemini' }] });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(1);
    // Restore
    await request(app)
      .patch('/api/v1/admin/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ updates: [{ key: 'active_ai_provider', value: 'claude' }] });
  });
});

describe('POST /api/v1/admin/scraper/run', () => {
  it('returns success with upserted count when called with admin token', async () => {
    const res = await request(app)
      .post('/api/v1/admin/scraper/run')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.upserted).toBe('number');
    expect(res.body.errors).toBe(0);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/v1/admin/scraper/run');
    expect(res.status).toBe(401);
  });

  it('returns 403 with non-admin user token', async () => {
    const res = await request(app)
      .post('/api/v1/admin/scraper/run')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});
