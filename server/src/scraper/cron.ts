import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { runScraper } from './index';

const DEFAULT_SCHEDULE = '0 2 * * *'; // 2am daily

let running = false;

export async function startScraperCron(): Promise<void> {
  // Check if scraper is enabled
  const enabledConfig = await prisma.adminConfig.findUnique({
    where: { key: 'scraper_enabled' },
  });

  if (enabledConfig?.value === 'false') {
    console.log('Scraper disabled — skipping');
    return;
  }

  // Read schedule from AdminConfig
  const scheduleConfig = await prisma.adminConfig.findUnique({
    where: { key: 'scraper_cron_schedule' },
  });

  const schedule = scheduleConfig?.value ?? DEFAULT_SCHEDULE;

  if (!cron.validate(schedule)) {
    console.error(`Invalid cron schedule "${schedule}", falling back to default`);
  }

  const validSchedule = cron.validate(schedule) ? schedule : DEFAULT_SCHEDULE;

  cron.schedule(validSchedule, async () => {
    if (running) {
      console.log('Scraper already running — skipping this tick');
      return;
    }
    running = true;
    try {
      console.log('Scraper run started');
      const result = await runScraper();
      console.log(`Scraper run complete: ${result.upserted} upserted, ${result.errors} errors`);
    } catch (error) {
      console.error('Scraper run failed:', error);
    } finally {
      running = false;
    }
  });

  console.log(`Scraper cron started, schedule: ${validSchedule}`);
}
