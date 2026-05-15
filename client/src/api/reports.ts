import apiClient from './client';
import type { ScamReport, PaginatedResponse } from '../types';

export const createReport = (data: { verificationId?: string; description: string; evidence?: string[] }) =>
  apiClient.post<ScamReport>('/reports', data).then((r) => r.data);

export const listReports = (page = 1, limit = 10) =>
  apiClient.get<PaginatedResponse<ScamReport>>('/reports', { params: { page, limit } }).then((r) => r.data);
