import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  // Keys sourced from env — real values, not placeholders.
  // update: { value } means re-running seed always keeps these fresh.
  const configs: { key: string; value: string; alwaysOverwrite?: boolean }[] = [
    // AI
    { key: 'active_ai_provider', value: 'claude' },
    { key: 'claude_api_key',     value: process.env.CLAUDE_API_KEY ?? 'PLACEHOLDER' },
    { key: 'gemini_api_key',     value: process.env.GEMINI_API_KEY ?? 'PLACEHOLDER' },
    // Squad payments — secret key required for server-side API calls (sandbox_sk_...)
    // Public key (sandbox_pk_...) is only for frontend checkout embeds
    { key: 'squad_secret_key',   value: process.env.SQUAD_SECRET_KEY ?? 'PLACEHOLDER', alwaysOverwrite: true },
    { key: 'squad_public_key',   value: process.env.SQUAD_PUBLIC_KEY ?? 'PLACEHOLDER', alwaysOverwrite: true },
    { key: 'squad_base_url',     value: process.env.SQUAD_BASE_URL ?? 'https://sandbox-api-d.squadco.com', alwaysOverwrite: true },
    // Storage
    { key: 'active_storage_adapter', value: 'local' },
    // Scraper
    { key: 'scraper_target_url',      value: 'https://landonline.lagosstate.gov.ng/index.html' },
    { key: 'scraper_cron_schedule',   value: '0 2 * * *' },
    { key: 'scraper_enabled',         value: 'true' },
    { key: 'scraper_search_url_template', value: '' },
  ];

  for (const config of configs) {
    await prisma.adminConfig.upsert({
      where:  { key: config.key },
      // alwaysOverwrite=true → sync env → DB on every seed run
      update: config.alwaysOverwrite ? { value: config.value } : {},
      create: { key: config.key, value: config.value },
    });
  }

  console.log('AdminConfig seeded:');
  const all = await prisma.adminConfig.findMany({ orderBy: { key: 'asc' } });
  for (const row of all) {
    const display = row.key.includes('api_key') && row.value.length > 12
      ? row.value.slice(0, 8) + '…' + row.value.slice(-4)
      : row.value;
    console.log(`  ${row.key} = ${display}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
