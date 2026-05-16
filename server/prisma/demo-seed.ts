/**
 * Demo seed — populates realistic verification records for hackathon demo.
 * Run: npx tsx prisma/demo-seed.ts
 */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';
import argon2 from 'argon2';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...\n');

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await argon2.hash('Demo1234!');

  const john = await prisma.user.upsert({
    where:  { email: 'john.doe@landcheck.demo' },
    update: {},
    create: {
      email:        'john.doe@landcheck.demo',
      passwordHash,
      role:         'USER',
      wallet:       { create: { balance: 500000 } },
    },
  });

  const seller = await prisma.user.upsert({
    where:  { email: 'amara.okafor@landcheck.demo' },
    update: {},
    create: {
      email:        'amara.okafor@landcheck.demo',
      passwordHash,
      role:         'USER',
      wallet:       { create: { balance: 0 } },
    },
  });

  console.log('✓ Users created:', john.email, seller.email);

  // ── Land Registry Records ──────────────────────────────────────────────────
  const landVerified = await prisma.land.upsert({
    where:  { parcelNumber: 'LS/CO/24/0034/00912' },
    update: {},
    create: {
      parcelNumber:     'LS/CO/24/0034/00912',
      ownerName:        'John Doe',
      location:         '14 Balogun Street, Ikeja, Lagos',
      documentType:     'Certificate of Occupancy',
      registrationDate: new Date('2021-03-15'),
      size:             '648 sqm',
      encumbrances:     'None',
      transactionHistory: [],
      rawData:          { source: 'Lagos Land Registry', verified: true },
      sourceUrl:        'https://landonline.lagosstate.gov.ng',
    },
  });

  const landCaution = await prisma.land.upsert({
    where:  { parcelNumber: 'LS/LIC/22/0071/04451' },
    update: {},
    create: {
      parcelNumber:     'LS/LIC/22/0071/04451',
      ownerName:        'John B. Doe',          // slight name mismatch → caution
      location:         'Plot 7, Lekki Phase 1, Lagos',
      documentType:     'Land Information Certificate',
      registrationDate: new Date('2019-07-20'),
      size:             '300 sqm',
      encumbrances:     'Mortgage — First Bank Nigeria (discharged 2023)',
      transactionHistory: [],
      rawData:          { source: 'Lagos Land Registry', verified: true },
      sourceUrl:        'https://landonline.lagosstate.gov.ng',
    },
  });

  console.log('✓ Land registry records created');

  // ── Verifications ──────────────────────────────────────────────────────────

  // 1. VERIFIED — all fields match, high trust
  const vVerified = await prisma.landVerification.upsert({
    where:  { id: 'demo-verif-verified-001' },
    update: {},
    create: {
      id:             'demo-verif-verified-001',
      userId:         john.id,
      parcelNumber:   'LS/CO/24/0034/00912',
      ownerName:      'John Doe',
      location:       '14 Balogun Street, Ikeja, Lagos',
      status:         'VERIFIED',
      trustScore:     91,
      landId:         landVerified.id,
      registryStatus: 'FOUND',
      matchReport: {
        parcelNumber: { match: true,  note: 'Exact match with registry' },
        ownerName:    { match: true,  note: 'Exact match with registry' },
        location:     { match: true,  note: 'Exact match with registry' },
        documentType: { match: true,  note: 'Certificate of Occupancy confirmed' },
      },
    },
  });

  await prisma.document.upsert({
    where:  { id: 'demo-doc-verified-001' },
    update: {},
    create: {
      id:               'demo-doc-verified-001',
      verificationId:   vVerified.id,
      type:             'C_OF_O',
      filePath:         'uploads/demo/coo_john_doe_ikeja.pdf',
      authenticityScore: 89,
      analysisResult: {
        authenticityScore: 89,
        findings: [
          'Official Lagos State stamp detected',
          'Authorised signature present',
          'Reference number LS/CO/24/0034/00912 validated',
          'Document template matches official C of O format',
        ],
        isSuspicious: false,
      },
    },
  });

  await prisma.trustScoreEvent.create({
    data: {
      verificationId: vVerified.id,
      previousScore:  null,
      newScore:       91,
      reason:         'All fields match government registry. Document forensics passed. C of O reference validated.',
      triggeredBy:    'AI',
    },
  });

  // 2. CAUTION — name mismatch in registry, discharged mortgage
  const vCaution = await prisma.landVerification.upsert({
    where:  { id: 'demo-verif-caution-001' },
    update: {},
    create: {
      id:             'demo-verif-caution-001',
      userId:         john.id,
      parcelNumber:   'LS/LIC/22/0071/04451',
      ownerName:      'John Doe',
      location:       'Plot 7, Lekki Phase 1, Lagos',
      status:         'CAUTION',
      trustScore:     58,
      landId:         landCaution.id,
      registryStatus: 'FOUND',
      matchReport: {
        parcelNumber: { match: true,  note: 'Exact match with registry' },
        ownerName:    { match: false, note: 'Registry shows "John B. Doe" — middle initial discrepancy' },
        location:     { match: true,  note: 'Exact match with registry' },
        documentType: { match: true,  note: 'Land Information Certificate confirmed' },
      },
    },
  });

  await prisma.document.upsert({
    where:  { id: 'demo-doc-caution-001' },
    update: {},
    create: {
      id:               'demo-doc-caution-001',
      verificationId:   vCaution.id,
      type:             'DEED',
      filePath:         'uploads/demo/deed_john_doe_lekki.pdf',
      authenticityScore: 61,
      analysisResult: {
        authenticityScore: 61,
        findings: [
          'Stamp detected but partially obscured',
          'Signature present',
          'Previous mortgage encumbrance noted — discharged 2023',
          'Owner name on document differs slightly from registry record',
        ],
        isSuspicious: false,
      },
    },
  });

  await prisma.trustScoreEvent.create({
    data: {
      verificationId: vCaution.id,
      previousScore:  null,
      newScore:       58,
      reason:         'Registry record found but owner name does not exactly match submitted data ("John B. Doe" vs "John Doe"). Prior mortgage encumbrance noted. Manual review recommended.',
      triggeredBy:    'AI',
    },
  });

  // 3. HIGH_RISK — not in registry, suspicious document
  const vHighRisk = await prisma.landVerification.upsert({
    where:  { id: 'demo-verif-highrisk-001' },
    update: {},
    create: {
      id:             'demo-verif-highrisk-001',
      userId:         john.id,
      parcelNumber:   'LS/CO/99/0000/99999',
      ownerName:      'John Doe',
      location:       '3 Admiralty Way, Victoria Island, Lagos',
      status:         'HIGH_RISK',
      trustScore:     18,
      landId:         null,
      registryStatus: 'NOT_FOUND',
      matchReport:    null,
    },
  });

  await prisma.document.upsert({
    where:  { id: 'demo-doc-highrisk-001' },
    update: {},
    create: {
      id:               'demo-doc-highrisk-001',
      verificationId:   vHighRisk.id,
      type:             'C_OF_O',
      filePath:         'uploads/demo/suspicious_coo.pdf',
      authenticityScore: 22,
      analysisResult: {
        authenticityScore: 22,
        findings: [
          'No official stamp detected',
          'Reference number LS/CO/99/0000/99999 not found in Lagos State registry',
          'Font inconsistency detected in owner name field',
          'Document template does not match official C of O format',
          'Image provenance analysis flagged digital manipulation',
        ],
        isSuspicious: true,
      },
    },
  });

  await prisma.trustScoreEvent.create({
    data: {
      verificationId: vHighRisk.id,
      previousScore:  null,
      newScore:       18,
      reason:         'Parcel number not found in government registry. Document forensics flagged font inconsistency and missing official stamp. Trust score capped at 40 (NOT_FOUND) — final score 18 due to suspicious document signals.',
      triggeredBy:    'AI',
    },
  });

  // ── Purchase pipeline (VERIFIED one, showing escrow flow) ──────────────────
  const existingPurchase = await prisma.landPurchase.findUnique({
    where: { verificationId: vVerified.id },
  });

  if (!existingPurchase) {
    const purchase = await prisma.landPurchase.create({
      data: {
        buyerId:        john.id,
        sellerId:       seller.id,
        verificationId: vVerified.id,
        agreedAmount:   45000000,
        status:         'IN_ESCROW',
      },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId:     john.id,
          purchaseId: purchase.id,
          type:       'ESCROW_HELD',
          title:      'Funds Held in Escrow',
          body:       '₦45,000,000 has been secured in escrow for 14 Balogun Street, Ikeja. Release when you are satisfied with the transaction.',
          read:       false,
        },
        {
          userId:     seller.id,
          purchaseId: purchase.id,
          type:       'OFFER_ACCEPTED',
          title:      'Offer Accepted — Escrow Active',
          body:       'John Doe has accepted your offer. ₦45,000,000 is held in escrow pending completion.',
          read:       false,
        },
      ],
    });

    console.log('✓ Purchase + notifications created');
  }

  console.log('\n Demo data ready. Login credentials:');
  console.log('  Email:    john.doe@landcheck.demo');
  console.log('  Password: Demo1234!');
  console.log('\n  Seller:   amara.okafor@landcheck.demo');
  console.log('  Password: Demo1234!');
  console.log('\nVerifications:');
  console.log('  ✅ VERIFIED   (trust 91) — Ikeja C of O, all fields match');
  console.log('  ⚠️  CAUTION   (trust 58) — Lekki LIC, name mismatch');
  console.log('  🚨 HIGH_RISK  (trust 18) — Victoria Island, not in registry');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
