import { prisma } from '../lib/prisma';

// ---- Puppeteer mock setup ----
const mockPageEvaluate = jest.fn();
const mockPage$ = jest.fn();
const mockPage$$ = jest.fn();
const mockPageGoto = jest.fn();
const mockPageClose = jest.fn();
const mockPageWaitForNavigation = jest.fn().mockResolvedValue(undefined);
const mockInputType = jest.fn();
const mockInputPress = jest.fn();
const mockBtnClick = jest.fn();

const mockPage = {
  goto: mockPageGoto,
  $: mockPage$,
  $$: mockPage$$,
  evaluate: mockPageEvaluate,
  close: mockPageClose,
  waitForNavigation: mockPageWaitForNavigation,
  newPage: undefined as any,
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  connected: true,
  close: jest.fn(),
};

jest.mock('puppeteer', () => ({
  __esModule: true,
  default: {
    launch: jest.fn().mockResolvedValue(mockBrowser),
  },
}));

// ---- node-cron mock setup ----
const mockCronSchedule = jest.fn();
const mockCronValidate = jest.fn().mockReturnValue(true);

jest.mock('node-cron', () => ({
  __esModule: true,
  default: {
    schedule: mockCronSchedule,
    validate: mockCronValidate,
  },
}));

// Import after mocks are set up
import { scrapeParcel, runScraper } from './index';
import { scrapeLagosParcel } from './lagos';
import { startScraperCron } from './cron';

// ---- Helpers ----
function setupMockPage(htmlText: string, hasSearchInput = true, hasRows = false) {
  mockPageGoto.mockResolvedValue(undefined);
  mockPageEvaluate.mockResolvedValue(htmlText);
  mockPageClose.mockResolvedValue(undefined);

  if (hasSearchInput) {
    const inputEl = { type: mockInputType, press: mockInputPress };
    const btnEl = { click: mockBtnClick };
    mockPage$.mockImplementation((selector: string) => {
      // Check for button selector first — it also contains 'input' as substring
      if (selector.startsWith('button')) return Promise.resolve(btnEl);
      if (selector.includes('input')) return Promise.resolve(inputEl);
      return Promise.resolve(null);
    });
  } else {
    mockPage$.mockResolvedValue(null);
  }

  if (hasRows) {
    const mockRow = {
      evaluate: jest.fn().mockResolvedValue(htmlText),
    };
    mockPage$$.mockResolvedValue([mockRow]);
  } else {
    mockPage$$.mockResolvedValue([]);
  }
}

// ---- Tests ----
describe('Scraper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBrowser.newPage.mockResolvedValue(mockPage);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('scrapeLagosParcel', () => {
    it('extracts structured fields from page text', async () => {
      const pageText = [
        'Lagos State Land Registry',
        'Owner: John Adeyemi',
        'Address: 15 Marina Street, Lagos Island',
        'Certificate of Occupancy',
        'Registration Date: 2023-05-15',
        'Area: 450 sqm',
        'Encumbrance: None',
      ].join('\n');

      setupMockPage(pageText, true);

      const result = await scrapeLagosParcel('LG-001');

      expect(result).not.toBeNull();
      expect(result!.parcelNumber).toBe('LG-001');
      expect(result!.ownerName).toBe('John Adeyemi');
      expect(result!.location).toBe('15 Marina Street, Lagos Island');
      expect(result!.documentType).toMatch(/Certificate of Occupancy/i);
      expect(result!.registrationDate).toEqual(new Date('2023-05-15'));
      expect(result!.size).toBe('450 sqm');
      expect(result!.encumbrances).toBe('None');
      expect(result!.sourceUrl).toContain('lagosstate');
    });

    it('returns defaults when no structured fields found', async () => {
      setupMockPage('Some generic page content with no useful fields', true);

      const result = await scrapeLagosParcel('LG-002');

      expect(result).not.toBeNull();
      expect(result!.ownerName).toBe('Unknown');
      expect(result!.location).toBe('Unknown');
      expect(result!.documentType).toBeUndefined();
      expect(result!.registrationDate).toBeUndefined();
      expect(result!.size).toBeUndefined();
      expect(result!.encumbrances).toBeUndefined();
    });

    it('returns null when page text is empty', async () => {
      setupMockPage('', false);

      const result = await scrapeLagosParcel('LG-003');

      expect(result).toBeNull();
    });

    it('handles navigation errors gracefully', async () => {
      mockPageGoto.mockRejectedValue(new Error('Navigation timeout'));
      mockPageClose.mockResolvedValue(undefined);

      const result = await scrapeLagosParcel('LG-ERR');

      expect(result).toBeNull();
    });
  });

  describe('scrapeParcel (index)', () => {
    it('scrapes and upserts a record into the Land table', async () => {
      const pageText = [
        'Owner: Jane Okafor',
        'Location: 22 Broad Street, Lagos',
        'C of O',
        'Area: 200 sqm',
      ].join('\n');

      setupMockPage(pageText, true);

      const parcelNumber = `TEST-${Date.now()}`;
      const result = await scrapeParcel(parcelNumber);

      expect(result).not.toBeNull();
      expect(result!.ownerName).toBe('Jane Okafor');

      // Verify it was persisted
      const landRecord = await prisma.land.findUnique({
        where: { parcelNumber },
      });

      expect(landRecord).not.toBeNull();
      expect(landRecord!.ownerName).toBe('Jane Okafor');
      expect(landRecord!.location).toBe('22 Broad Street, Lagos');

      // Clean up
      await prisma.land.delete({ where: { parcelNumber } });
    });
  });

  describe('runScraper', () => {
    it('runs full scrape and upserts records', async () => {
      const rowText = [
        'Parcel No: RUN-SCRAPER-TEST',
        'Owner: Test Owner',
        'Address: Test Address',
      ].join('\n');

      setupMockPage(rowText, false, true);

      const result = await runScraper();

      expect(result).toHaveProperty('upserted');
      expect(result).toHaveProperty('errors');
      expect(typeof result.upserted).toBe('number');
      expect(typeof result.errors).toBe('number');

      // Clean up any records that were created
      try {
        await prisma.land.deleteMany({
          where: { parcelNumber: { startsWith: 'RUN-SCRAPER-TEST' } },
        });
      } catch {
        // ignore cleanup errors
      }
    });
  });

  describe('startScraperCron', () => {
    it('does not register cron when scraper_enabled is false', async () => {
      // Set scraper_enabled to false
      await prisma.adminConfig.upsert({
        where: { key: 'scraper_enabled' },
        update: { value: 'false' },
        create: { key: 'scraper_enabled', value: 'false' },
      });

      await startScraperCron();

      expect(mockCronSchedule).not.toHaveBeenCalled();

      // Restore
      await prisma.adminConfig.upsert({
        where: { key: 'scraper_enabled' },
        update: { value: 'true' },
        create: { key: 'scraper_enabled', value: 'true' },
      });
    });

    it('registers cron with correct schedule when enabled', async () => {
      await prisma.adminConfig.upsert({
        where: { key: 'scraper_enabled' },
        update: { value: 'true' },
        create: { key: 'scraper_enabled', value: 'true' },
      });

      await prisma.adminConfig.upsert({
        where: { key: 'scraper_cron_schedule' },
        update: { value: '0 3 * * *' },
        create: { key: 'scraper_cron_schedule', value: '0 3 * * *' },
      });

      await startScraperCron();

      expect(mockCronSchedule).toHaveBeenCalledWith('0 3 * * *', expect.any(Function));

      // Restore default
      await prisma.adminConfig.upsert({
        where: { key: 'scraper_cron_schedule' },
        update: { value: '0 2 * * *' },
        create: { key: 'scraper_cron_schedule', value: '0 2 * * *' },
      });
    });

    it('uses default schedule when no config is set', async () => {
      // Delete the schedule config if it exists
      await prisma.adminConfig.deleteMany({
        where: { key: 'scraper_cron_schedule' },
      });

      await prisma.adminConfig.upsert({
        where: { key: 'scraper_enabled' },
        update: { value: 'true' },
        create: { key: 'scraper_enabled', value: 'true' },
      });

      await startScraperCron();

      expect(mockCronSchedule).toHaveBeenCalledWith('0 2 * * *', expect.any(Function));
    });
  });
});
