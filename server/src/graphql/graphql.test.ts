import request from 'supertest';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import app from '../app';
import http from 'http';
import { WebSocketServer } from 'ws';
import { setupGraphQL } from './index';

const TEST_EMAIL_USER = 'graphql-test-user@landverify.com';
const TEST_EMAIL_ADMIN = 'graphql-test-admin@landverify.com';

let userToken: string;
let adminToken: string;
let userId: string;
let adminId: string;
let testApp: typeof app;
let httpServer: http.Server;
let wss: WebSocketServer;

beforeAll(async () => {
  // Clean up any leftover test data
  await prisma.scamReport.deleteMany({
    where: { user: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } },
  });
  await prisma.scamReport.deleteMany({
    where: { parcelNumber: { startsWith: 'GQL-TEST-' } },
  });
  await prisma.payment.deleteMany({
    where: { verification: { user: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } } },
  });
  await prisma.document.deleteMany({
    where: { verification: { user: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } } },
  });
  await prisma.trustScoreEvent.deleteMany({
    where: { verification: { user: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } } },
  });
  await prisma.landVerification.deleteMany({
    where: { user: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } });

  // Create test users directly in DB
  const user = await prisma.user.create({
    data: { email: TEST_EMAIL_USER, passwordHash: 'not-a-real-hash', role: 'USER' },
  });
  userId = user.id;
  userToken = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!);

  const admin = await prisma.user.create({
    data: { email: TEST_EMAIL_ADMIN, passwordHash: 'not-a-real-hash', role: 'ADMIN' },
  });
  adminId = admin.id;
  adminToken = jwt.sign({ sub: admin.id, role: admin.role }, process.env.JWT_SECRET!);

  // Set up GraphQL on the app
  httpServer = http.createServer(app);
  wss = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const graphqlMiddleware = await setupGraphQL(httpServer, wss);
  app.use('/graphql', graphqlMiddleware);
  testApp = app;
});

afterAll(async () => {
  // Clean up test data
  await prisma.scamReport.deleteMany({
    where: { user: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } },
  });
  await prisma.scamReport.deleteMany({
    where: { parcelNumber: { startsWith: 'GQL-TEST-' } },
  });
  await prisma.payment.deleteMany({
    where: { verification: { user: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } } },
  });
  await prisma.document.deleteMany({
    where: { verification: { user: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } } },
  });
  await prisma.trustScoreEvent.deleteMany({
    where: { verification: { user: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } } },
  });
  await prisma.landVerification.deleteMany({
    where: { user: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL_USER, TEST_EMAIL_ADMIN] } } });
  await prisma.$disconnect();
});

describe('GraphQL — Queries', () => {
  it('verifications — authenticated user gets their own', async () => {
    // Create a verification for the test user
    await prisma.landVerification.create({
      data: { userId, parcelNumber: 'GQL-TEST-001', location: 'Lagos', ownerName: 'Test Owner' },
    });

    const res = await request(testApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ query: '{ verifications { id parcelNumber } }' });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.verifications).toBeInstanceOf(Array);
    expect(res.body.data.verifications.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.verifications.every((v: { parcelNumber: string }) => v.parcelNumber.startsWith('GQL-TEST-'))).toBe(true);
  });

  it('verifications — admin gets all verifications', async () => {
    const res = await request(testApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ query: '{ verifications { id parcelNumber } }' });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.verifications).toBeInstanceOf(Array);
  });

  it('verification(id) — returns Not found for wrong user', async () => {
    // Create a verification for admin
    const v = await prisma.landVerification.create({
      data: { userId: adminId, parcelNumber: 'GQL-TEST-002', location: 'Abuja', ownerName: 'Admin Owner' },
    });

    // Regular user tries to access admin's verification
    const res = await request(testApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ query: `{ verification(id: "${v.id}") { id parcelNumber } }` });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toBe('Not authorized');
  });

  it('unauthenticated query — returns Not authorized error', async () => {
    const res = await request(testApp)
      .post('/graphql')
      .send({ query: '{ verifications { id } }' });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toBe('Not authorized');
  });
});

describe('GraphQL — Mutations', () => {
  it('createReport — creates a report', async () => {
    const res = await request(testApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        query: `mutation {
          createReport(parcelNumber: "GQL-TEST-RPT-001", description: "Suspected fraud", evidenceUrls: ["https://example.com/evidence1"]) {
            id
            parcelNumber
            description
            evidenceUrls
          }
        }`,
      });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.createReport.parcelNumber).toBe('GQL-TEST-RPT-001');
    expect(res.body.data.createReport.description).toBe('Suspected fraud');
    expect(res.body.data.createReport.evidenceUrls).toEqual(['https://example.com/evidence1']);
  });

  it('createReport — works without authentication (anonymous)', async () => {
    const res = await request(testApp)
      .post('/graphql')
      .send({
        query: `mutation {
          createReport(parcelNumber: "GQL-TEST-RPT-002", description: "Anonymous report") {
            id
            parcelNumber
          }
        }`,
      });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.createReport.parcelNumber).toBe('GQL-TEST-RPT-002');
  });
});

describe('GraphQL — Reports query (admin only)', () => {
  it('admin can query reports', async () => {
    const res = await request(testApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ query: '{ reports { id parcelNumber description } }' });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.reports).toBeInstanceOf(Array);
  });

  it('regular user cannot query reports', async () => {
    const res = await request(testApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ query: '{ reports { id } }' });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toBe('Not authorized');
  });
});
