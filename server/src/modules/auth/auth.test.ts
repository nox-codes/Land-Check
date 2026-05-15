import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: 'test@landverify.com' } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: 'test@landverify.com' } });
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/register', () => {
  it('creates a user and returns a JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@landverify.com', password: 'SecurePass123!' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it('returns 409 if email already exists', async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'test@landverify.com', password: 'Pass123!' });
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'test@landverify.com', password: 'Pass123!' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'test@landverify.com', password: 'SecurePass123!' });
  });

  it('returns JWT on valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@landverify.com', password: 'SecurePass123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@landverify.com', password: 'WrongPass!' });
    expect(res.status).toBe(401);
  });

  it('returns 400 on missing password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@landverify.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/register validation', () => {
  it('returns 400 on missing password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'test@landverify.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'notanemail', password: 'Pass123!' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('returns 200 with valid token', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({ email: 'test@landverify.com', password: 'SecurePass123!' });
    const res = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 without token (requireAuth)', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });
});
