import fs from 'fs/promises';
import path from 'path';
import { getStorageAdapter } from './index';
import { localAdapter } from './adapters/local';
import { prisma } from '../lib/prisma';

const uploadsDir = path.join(process.cwd(), 'uploads');

beforeAll(async () => {
  await prisma.adminConfig.upsert({ where: { key: 'active_storage_adapter' }, update: { value: 'local' }, create: { key: 'active_storage_adapter', value: 'local' } });
});
afterAll(() => prisma.$disconnect());

describe('getStorageAdapter', () => {
  it('returns adapter with save, delete, getUrl', async () => {
    const adapter = await getStorageAdapter();
    expect(typeof adapter.save).toBe('function');
    expect(typeof adapter.delete).toBe('function');
    expect(typeof adapter.getUrl).toBe('function');
  });

  it('local adapter getUrl returns /uploads/<filename>', async () => {
    const adapter = await getStorageAdapter();
    expect(adapter.getUrl('test.pdf')).toBe('/uploads/test.pdf');
  });

  it('returns cloudflare adapter for cloudflare key', async () => {
    await prisma.adminConfig.update({ where: { key: 'active_storage_adapter' }, data: { value: 'cloudflare' } });
    const adapter = await getStorageAdapter();
    expect(typeof adapter.save).toBe('function');
    await prisma.adminConfig.update({ where: { key: 'active_storage_adapter' }, data: { value: 'local' } });
  });

  it('returns supabase adapter for supabase key', async () => {
    await prisma.adminConfig.update({ where: { key: 'active_storage_adapter' }, data: { value: 'supabase' } });
    const adapter = await getStorageAdapter();
    expect(typeof adapter.save).toBe('function');
    await prisma.adminConfig.update({ where: { key: 'active_storage_adapter' }, data: { value: 'local' } });
  });
});

describe('localAdapter.delete', () => {
  it('deletes an existing file', async () => {
    const filename = `test-${Date.now()}.txt`;
    await fs.writeFile(path.join(uploadsDir, filename), 'test');
    await localAdapter.delete(filename);
    await expect(fs.access(path.join(uploadsDir, filename))).rejects.toThrow();
  });

  it('does not throw when file does not exist', async () => {
    await expect(localAdapter.delete('nonexistent-file.txt')).resolves.toBeUndefined();
  });

  it('strips path traversal from filename', async () => {
    // Should attempt to delete uploads/passwd, not /etc/passwd
    await expect(localAdapter.delete('../../../etc/passwd')).resolves.toBeUndefined();
  });
});

describe('localAdapter.save', () => {
  it('returns file.filename', async () => {
    const mockFile = { filename: 'stored-name.pdf' } as Parameters<typeof localAdapter.save>[0];
    const result = await localAdapter.save(mockFile);
    expect(result).toBe('stored-name.pdf');
  });
});
