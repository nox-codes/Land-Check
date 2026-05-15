import { prisma } from '../lib/prisma';
import { localAdapter } from './adapters/local';
import { cloudflareAdapter } from './adapters/cloudflare';
import { supabaseAdapter } from './adapters/supabase';
import type { StorageAdapter } from './types';

export async function getStorageAdapter(): Promise<StorageAdapter> {
  const config = await prisma.adminConfig.findUnique({ where: { key: 'active_storage_adapter' } });
  switch (config?.value ?? 'local') {
    case 'cloudflare': return cloudflareAdapter;
    case 'supabase': return supabaseAdapter;
    default: return localAdapter;
  }
}

export type { StorageAdapter } from './types';
