import apiClient from './client';
import type { Document, DocumentType } from '../types';

// POST /api/v1/documents/upload (multipart: file, verificationId, documentType)
export const uploadDocument = (
  verificationId: string,
  file: File,
  documentType: DocumentType,
  onProgress?: (pct: number) => void
) => {
  const form = new FormData();
  form.append('file', file);
  form.append('verificationId', verificationId);
  form.append('documentType', documentType);
  return apiClient
    .post<{ success: boolean; document: Document }>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    })
    .then((r) => r.data.document);
};

// GET /api/v1/documents/:id → { success, document }
export const getDocument = (id: string) =>
  apiClient.get<{ success: boolean; document: Document }>(`/documents/${id}`)
    .then((r) => r.data.document);

// DELETE /api/v1/documents/:id
export const deleteDocument = (id: string) =>
  apiClient.delete(`/documents/${id}`).then((r) => r.data);
