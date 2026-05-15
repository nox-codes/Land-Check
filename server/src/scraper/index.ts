import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { scrapeAllLagosRecords, scrapeLagosParcel, ScrapedLandRecord } from './lagos';

export type { ScrapedLandRecord } from './lagos';

/**
 * Bulk scraper — called by the cron job or admin "Run Now" button.
 *
 * Strategy: pull every unique parcelNumber from LandVerification records
 * whose registryStatus is still PENDING or NOT_FOUND, then scrape each
 * one individually. This is far more useful than scraping the homepage.
 *
 * Falls back to scraping the target URL for new/unknown parcels if the
 * DB has no pending verifications.
 */
export async function runScraper(): Promise<{ upserted: number; errors: number }> {
  let upserted = 0;
  let errors = 0;

  // 1. Get all parcel numbers that still need registry lookup
  const pending = await prisma.landVerification.findMany({
    where: { registryStatus: { in: ['PENDING', 'NOT_FOUND'] } },
    select: { parcelNumber: true },
    distinct: ['parcelNumber'],
  });

  if (pending.length > 0) {
    console.log(`Scraper: ${pending.length} parcel(s) to look up from DB`);

    for (const { parcelNumber } of pending) {
      try {
        const record = await scrapeLagosParcel(parcelNumber);
        if (record) {
          await upsertLandRecord(record);
          // Update all verifications for this parcel to FOUND
          await prisma.landVerification.updateMany({
            where: { parcelNumber, registryStatus: { in: ['PENDING', 'NOT_FOUND'] } },
            data: { registryStatus: 'FOUND', landId: (await prisma.land.findUnique({ where: { parcelNumber }, select: { id: true } }))?.id ?? undefined },
          });
          upserted++;
        } else {
          console.log(`Scraper: no data found for parcel ${parcelNumber}`);
        }
      } catch (err) {
        console.error(`Scraper: error on parcel ${parcelNumber}:`, err);
        errors++;
      }
    }
  } else {
    // No pending verifications — fall back to bulk homepage scrape
    const targetUrl =
      (await prisma.adminConfig
        .findUnique({ where: { key: 'scraper_target_url' } })
        .then((c) => c?.value)) ??
      'https://landonline.lagosstate.gov.ng/index.html';

    console.log(`Scraper: no pending verifications — bulk targeting ${targetUrl}`);

    try {
      const records = await scrapeAllLagosRecords(targetUrl);
      for (const record of records) {
        if (record.parcelNumber.startsWith('BULK-') || record.parcelNumber.startsWith('UNKNOWN-')) {
          console.warn(`Scraper: skipping junk record ${record.parcelNumber} — registry page returned no structured data`);
          continue;
        }
        try {
          await upsertLandRecord(record);
          upserted++;
        } catch (err) {
          console.error(`Scraper: error upserting ${record.parcelNumber}:`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error('Scraper bulk run failed:', err);
      errors++;
    }
  }

  return { upserted, errors };
}

/**
 * On-demand scrape for a single parcel number.
 * Called during verification creation so the AI has registry data to work with.
 */
export async function scrapeParcel(parcelNumber: string): Promise<ScrapedLandRecord | null> {
  try {
    const record = await scrapeLagosParcel(parcelNumber);
    if (record) {
      await upsertLandRecord(record);
    }
    return record;
  } catch (err) {
    console.error(`scrapeParcel error for ${parcelNumber}:`, err);
    return null;
  }
}

async function upsertLandRecord(record: ScrapedLandRecord): Promise<void> {
  const fields = {
    ownerName: record.ownerName,
    location: record.location,
    documentType: record.documentType ?? null,
    registrationDate: record.registrationDate ?? null,
    size: record.size ?? null,
    encumbrances: record.encumbrances ?? null,
    transactionHistory: record.transactionHistory as Prisma.InputJsonValue,
    rawData: record.rawData as Prisma.InputJsonValue,
    sourceUrl: record.sourceUrl,
    scrapedAt: new Date(),
  };

  await prisma.land.upsert({
    where: { parcelNumber: record.parcelNumber },
    update: { ...fields, updatedAt: new Date() },
    create: { parcelNumber: record.parcelNumber, ...fields },
  });
}
