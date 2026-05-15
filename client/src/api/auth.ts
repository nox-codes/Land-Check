import apiClient from './client';
import type { AuthResponse, User } from '../types';

export const login = (email: string, password: string) =>
  apiClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data);

export const register = (data: { email: string; password: string }) =>
  apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data);

export const logout = () => apiClient.post('/auth/logout').catch(() => null);

export const getMe = () =>
  apiClient.get<{ success: boolean; user: User }>('/auth/me').then((r) => r.data);
