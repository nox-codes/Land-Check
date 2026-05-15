import apiClient from './client';
import type { Wallet } from '../types';

export async function getMyWallet(): Promise<Wallet> {
  const { data } = await apiClient.get<{ success: boolean; wallet: Wallet }>('/wallet/me');
  return data.wallet;
}

export async function ensureWallet(): Promise<Wallet> {
  const { data } = await apiClient.post<{ success: boolean; wallet: Wallet }>('/wallet/ensure');
  return data.wallet;
}

export async function initiateTopup(amount: number): Promise<{ checkoutUrl: string; reference: string }> {
  const { data } = await apiClient.post<{ success: boolean; checkoutUrl: string; reference: string }>('/wallet/topup', { amount });
  return data;
}

export async function adminCreditWallet(userId: string, amount: number, note?: string) {
  const { data } = await apiClient.post('/wallet/admin/credit', { userId, amount, note });
  return data;
}

export async function adminDebitWallet(userId: string, amount: number, note?: string) {
  const { data } = await apiClient.post('/wallet/admin/debit', { userId, amount, note });
  return data;
}

export async function verifyTopup(reference: string): Promise<{ amountCredited: number; alreadyCredited?: boolean }> {
  const { data } = await apiClient.post<{ success: boolean; amountCredited: number; alreadyCredited?: boolean }>(`/wallet/topup/verify/${reference}`);
  return data;
}

export async function withdraw(params: {
  amount: number;
  accountNumber: string;
  bankCode: string;
  accountName: string;
}): Promise<{ reference: string }> {
  const { data } = await apiClient.post<{ success: boolean; reference: string }>('/wallet/withdraw', params);
  return data;
}

export async function adminGetAllWallets() {
  const { data } = await apiClient.get<{ success: boolean; wallets: (Wallet & { user: { id: string; email: string } })[] }>('/wallet/admin/all');
  return data.wallets;
}
