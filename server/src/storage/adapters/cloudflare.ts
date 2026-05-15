import type { StorageAdapter, MulterFile } from '../types';

// TODO: Install @aws-sdk/client-s3 and set env vars:
// CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME
// Endpoint: https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com

export const cloudflareAdapter: StorageAdapter = {
  async save(_file: MulterFile): Promise<string> {
    throw new Error('Cloudflare R2 adapter not implemented. Switch active_storage_adapter to "local".');
  },
  async delete(_filePath: string): Promise<void> {
    throw new Error('Cloudflare R2 adapter not implemented.');
  },
  getUrl(_filePath: string): string {
    throw new Error('Cloudflare R2 adapter not implemented.');
  },
};
