import apiClient from './client';
import type { Payment } from '../types';

export const initiatePayment = (verificationId: string) =>
  apiClient
    .post<Payment>('/payments/initiate', { verificationId })
    .then((r) => r.data);

export const getPaymentStatus = (reference: string) =>
  apiClient.get<Payment>(`/payments/${reference}`).then((r) => r.data);
