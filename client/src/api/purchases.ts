import apiClient from './client';
import type { LandPurchase, UserSearchResult } from '../types';

export async function searchUsers(q: string): Promise<UserSearchResult[]> {
  const { data } = await apiClient.get<{ success: boolean; users: UserSearchResult[] }>(`/users/search?q=${encodeURIComponent(q)}`);
  return data.users;
}

export async function initiatePurchase(payload: {
  parcelNumber: string;
  location: string;
  ownerName: string;
  sellerId: string;
  agreedAmount: number;
}): Promise<LandPurchase> {
  const { data } = await apiClient.post<{ success: boolean; purchase: LandPurchase }>('/purchases', payload);
  return data.purchase;
}

export async function getMyPurchases(): Promise<LandPurchase[]> {
  const { data } = await apiClient.get<{ success: boolean; purchases: LandPurchase[] }>('/purchases');
  return data.purchases;
}

export async function getPurchase(id: string): Promise<LandPurchase> {
  const { data } = await apiClient.get<{ success: boolean; purchase: LandPurchase }>(`/purchases/${id}`);
  return data.purchase;
}

export async function moveToEscrow(id: string): Promise<LandPurchase> {
  const { data } = await apiClient.post<{ success: boolean; purchase: LandPurchase }>(`/purchases/${id}/escrow`);
  return data.purchase;
}

export async function completePurchase(id: string): Promise<LandPurchase> {
  const { data } = await apiClient.post<{ success: boolean; purchase: LandPurchase }>(`/purchases/${id}/complete`);
  return data.purchase;
}

export async function acceptPurchase(id: string): Promise<LandPurchase> {
  const { data } = await apiClient.post<{ success: boolean; purchase: LandPurchase }>(`/purchases/${id}/accept`);
  return data.purchase;
}

export async function declinePurchase(id: string): Promise<LandPurchase> {
  const { data } = await apiClient.post<{ success: boolean; purchase: LandPurchase }>(`/purchases/${id}/decline`);
  return data.purchase;
}

export async function cancelPurchase(id: string): Promise<LandPurchase> {
  const { data } = await apiClient.post<{ success: boolean; purchase: LandPurchase }>(`/purchases/${id}/cancel`);
  return data.purchase;
}

export async function sendMessage(purchaseId: string, content: string): Promise<import('../types').Message> {
  const { data } = await apiClient.post<{ success: boolean; message: import('../types').Message }>(`/purchases/${purchaseId}/messages`, { content });
  return data.message;
}

export async function getMessages(purchaseId: string): Promise<import('../types').Message[]> {
  const { data } = await apiClient.get<{ success: boolean; messages: import('../types').Message[] }>(`/purchases/${purchaseId}/messages`);
  return data.messages;
}
