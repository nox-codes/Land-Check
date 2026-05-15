import apiClient from './client';
import type { Verification, CreateVerificationDto } from '../types';

// GET /api/v1/verifications → { success, verifications: [] }
export const listVerifications = () =>
  apiClient.get<{ success: boolean; verifications: Verification[] }>('/verifications')
    .then((r) => r.data.verifications);

// GET /api/v1/verifications/:id → { success, verification }
export const getVerification = (id: string) =>
  apiClient.get<{ success: boolean; verification: Verification }>(`/verifications/${id}`)
    .then((r) => r.data.verification);

// POST /api/v1/verifications → { success, verification, registryMessage }
export const createVerification = (data: CreateVerificationDto) =>
  apiClient.post<{ success: boolean; verification: Verification; registryMessage: string | null }>
    ('/verifications', data).then((r) => r.data);

// PATCH /api/v1/verifications/:id → { success, verification }
export const updateVerification = (id: string, data: Partial<CreateVerificationDto>) =>
  apiClient.patch<{ success: boolean; verification: Verification }>(`/verifications/${id}`, data)
    .then((r) => r.data.verification);
