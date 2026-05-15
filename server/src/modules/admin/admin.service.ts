import { prisma } from '../../lib/prisma';
import { runScraper } from '../../scraper/index';

export async function getConfig() {
  const configs = await prisma.adminConfig.findMany();
  return configs.map(c => ({ key: c.key, value: c.value }));
}

export async function updateConfig(updates: { key: string; value: string }[]) {
  return Promise.all(updates.map(u => prisma.adminConfig.upsert({ where: { key: u.key }, update: { value: u.value }, create: { key: u.key, value: u.value } })));
}

export async function triggerScraper(): Promise<{ upserted: number; errors: number }> {
  return runScraper();
}
