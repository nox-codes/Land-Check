import { getBrowser } from './browser';
import { prisma } from '../lib/prisma';

export interface ScrapedLandRecord {
  parcelNumber: string;
  ownerName: string;
  location: string;
  documentType?: string;
  registrationDate?: Date;
  size?: string;
  encumbrances?: string;
  transactionHistory: unknown[];
  rawData: unknown;
  sourceUrl: string;
}

const DEFAULT_BASE_URL = 'https://landonline.lagosstate.gov.ng/index.html';

/** Read the search URL template from AdminConfig, falling back to the default. */
async function getSearchUrl(parcelNumber?: string): Promise<string> {
  const cfg = await prisma.adminConfig.findMany({
    where: { key: { in: ['scraper_target_url', 'scraper_search_url_template'] } },
  });
  const byKey = Object.fromEntries(cfg.map((c) => [c.key, c.value]));

  // scraper_search_url_template supports {{parcel}} placeholder
  // e.g. https://landonline.lagosstate.gov.ng/search?fileNumber={{parcel}}
  const template = byKey['scraper_search_url_template'];
  if (template && parcelNumber) {
    return template.replace('{{parcel}}', encodeURIComponent(parcelNumber));
  }

  return byKey['scraper_target_url'] ?? DEFAULT_BASE_URL;
}

function parseOwnerName(text: string): string {
  const patterns = [/(?:Owner|Proprietor|Name)\s*:\s*(.+)/i];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return 'Unknown';
}

function parseLocation(text: string): string {
  const patterns = [/(?:Address|Location|Property Address)\s*:\s*(.+)/i];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return 'Unknown';
}

function parseDocumentType(text: string): string | undefined {
  const patterns = [
    /\b(C\s*of\s*O|Certificate\s+of\s+Occupancy)\b/i,
    /\b(Deed)\b/i,
    /\b(Survey\s*Plan)\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return undefined;
}

function parseRegistrationDate(text: string): Date | undefined {
  const patterns = [
    /(?:Registration\s*Date|Date\s*Registered|Date)\s*:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const d = new Date(m[1]);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return undefined;
}

function parseSize(text: string): string | undefined {
  const m = text.match(/([\d,.]+)\s*(sqm|sq\.?\s*m|hectares?|ha)\b/i);
  return m ? `${m[1]} ${m[2]}` : undefined;
}

function parseEncumbrances(text: string): string | undefined {
  const patterns = [/(?:Encumbrance|Charge|Lien)\s*:\s*(.+)/i];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return undefined;
}

const SEARCH_SELECTORS = [
  'input[name*="parcel"]',
  'input[name*="fileNumber"]',
  'input[name*="file_number"]',
  'input[placeholder*="parcel" i]',
  'input[placeholder*="file" i]',
  'input[placeholder*="search" i]',
  'input[type="text"]',
];

/**
 * Scrape the registry for a single parcel number.
 *
 * If `scraper_search_url_template` is set in AdminConfig with a {{parcel}}
 * placeholder, it navigates directly to the search result URL.
 * Otherwise it loads the base URL and attempts to fill in a search form.
 *
 * Returns null if no usable data was found on the page.
 */
export async function scrapeLagosParcel(parcelNumber: string): Promise<ScrapedLandRecord | null> {
  const url = await getSearchUrl(parcelNumber);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // If URL didn't embed the parcel number, try filling a search form
    const urlHasParcel = url.includes(encodeURIComponent(parcelNumber)) || url.includes(parcelNumber);
    if (!urlHasParcel) {
      let searchInput = null;
      for (const selector of SEARCH_SELECTORS) {
        searchInput = await page.$(selector);
        if (searchInput) break;
      }

      if (searchInput) {
        await searchInput.type(parcelNumber);
        const submitBtn = await page.$('button[type="submit"], input[type="submit"], button');
        if (submitBtn) {
          await submitBtn.click();
        } else {
          await searchInput.press('Enter');
        }
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
          new Promise((r) => setTimeout(r, 5000)),
        ]);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText: string = await page.evaluate(() => (globalThis as any).document?.body?.innerText ?? '');

    if (!pageText || pageText.trim().length < 50) {
      console.warn(`scrapeLagosParcel: page returned <50 chars for ${parcelNumber} — likely a login wall or empty result`);
      return null;
    }

    // Heuristic: if the page looks like a login/home page rather than a result,
    // return null rather than saving noise data.
    const looksLikeResult =
      pageText.toLowerCase().includes(parcelNumber.toLowerCase()) ||
      /owner|proprietor|occupancy|deed|survey/i.test(pageText);

    if (!looksLikeResult) {
      console.warn(`scrapeLagosParcel: page for ${parcelNumber} doesn't contain expected registry fields — skipping`);
      return null;
    }

    return {
      parcelNumber,
      ownerName: parseOwnerName(pageText),
      location: parseLocation(pageText),
      documentType: parseDocumentType(pageText),
      registrationDate: parseRegistrationDate(pageText),
      size: parseSize(pageText),
      encumbrances: parseEncumbrances(pageText),
      transactionHistory: [],
      rawData: { pageText: pageText.slice(0, 5000), scrapedAt: new Date().toISOString(), url },
      sourceUrl: url,
    };
  } catch (error) {
    console.error(`scrapeLagosParcel error for ${parcelNumber}:`, error);
    return null;
  } finally {
    await page.close();
  }
}

/**
 * Bulk scrape — loads the target URL and attempts to extract all records
 * from table rows or list items. Only used as a fallback when there are
 * no pending verifications to drive per-parcel scraping.
 */
export async function scrapeAllLagosRecords(url?: string): Promise<ScrapedLandRecord[]> {
  const targetUrl = url ?? (await getSearchUrl());
  const browser = await getBrowser();
  const page = await browser.newPage();
  const records: ScrapedLandRecord[] = [];

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText: string = await page.evaluate(() => (globalThis as any).document?.body?.innerText ?? '');

    const rows = await page.$$('table tbody tr, .listing-item, .result-row, .record');

    if (rows.length > 0) {
      for (const row of rows) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rowText = await row.evaluate((el) => (el as any).innerText ?? '');
        if (!rowText.trim()) continue;

        const parcelMatch = rowText.match(/(?:Parcel|Plot|File|ID)\s*(?:No\.?|Number)?\s*:?\s*([A-Z0-9\-\/]+)/i);
        if (!parcelMatch) continue; // skip rows without a recognisable parcel number

        records.push({
          parcelNumber: parcelMatch[1].trim(),
          ownerName: parseOwnerName(rowText),
          location: parseLocation(rowText),
          documentType: parseDocumentType(rowText),
          registrationDate: parseRegistrationDate(rowText),
          size: parseSize(rowText),
          encumbrances: parseEncumbrances(rowText),
          transactionHistory: [],
          rawData: { rowText, scrapedAt: new Date().toISOString() },
          sourceUrl: targetUrl,
        });
      }
    } else {
      console.warn(`scrapeAllLagosRecords: no structured rows found at ${targetUrl} — page may require login or a search query`);
      // Log a snippet of the page so you can diagnose
      console.warn('Page preview:', pageText.slice(0, 300));
    }

    return records;
  } catch (error) {
    console.error('scrapeAllLagosRecords error:', error);
    return records;
  } finally {
    await page.close();
  }
}
