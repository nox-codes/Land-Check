import apiClient from './client';

export interface AdminConfigItem {
  key: string;
  value: string;
}

export interface ScraperResult {
  upserted: number;
  errors: number;
}

export const getAdminConfig = () =>
  apiClient.get<{ success: boolean; config: AdminConfigItem[] }>('/admin/config')
    .then((r) => r.data.config);

export const updateAdminConfig = (updates: AdminConfigItem[]) =>
  apiClient.patch<{ success: boolean; updated: number }>('/admin/config', { updates })
    .then((r) => r.data);

export const runScraper = () =>
  apiClient.post<{ success: boolean } & ScraperResult>('/admin/scraper/run')
    .then((r) => r.data);
