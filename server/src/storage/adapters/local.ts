import fs from 'fs/promises';
import path from 'path';
import type { StorageAdapter, MulterFile } from '../types';

const uploadsDir = path.join(process.cwd(), 'uploads');

export const localAdapter: StorageAdapter = {
  // Multer diskStorage has already written the file to uploads/ before save() is called.
  // This method just returns the filename so callers can record the stored path.
  async save(file: MulterFile): Promise<string> {
    return file.filename;
  },

  async delete(filename: string): Promise<void> {
    // Strip any path traversal components so only a bare filename is used.
    const safe = path.basename(filename);
    const filePath = path.join(uploadsDir, safe);
    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  },

  getUrl(filename: string): string {
    return `/uploads/${filename}`;
  },
};
