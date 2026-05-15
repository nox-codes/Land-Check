export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer; // only populated by memoryStorage, not diskStorage
}

export interface StorageAdapter {
  save(file: MulterFile): Promise<string>;
  delete(filePath: string): Promise<void>;
  getUrl(filePath: string): string;
}
