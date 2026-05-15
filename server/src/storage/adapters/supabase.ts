import type { StorageAdapter, MulterFile } from '../types';

// TODO: Install @supabase/supabase-js and set env vars:
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET

export const supabaseAdapter: StorageAdapter = {
  async save(_file: MulterFile): Promise<string> {
    throw new Error('Supabase Storage adapter not implemented. Switch active_storage_adapter to "local".');
  },
  async delete(_filePath: string): Promise<void> {
    throw new Error('Supabase Storage adapter not implemented.');
  },
  getUrl(_filePath: string): string {
    throw new Error('Supabase Storage adapter not implemented.');
  },
};
