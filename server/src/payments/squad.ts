import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

async function getSecretKey(): Promise<string> {
  // Primary: AdminConfig squad_secret_key → squad_api_key (legacy)
  // Fallback: SQUAD_SECRET_KEY env → SQUAD_API_KEY env
  const cfg = await prisma.adminConfig.findMany({
    where: { key: { in: ['squad_secret_key', 'squad_api_key'] } },
  });
  const byKey = Object.fromEntries(cfg.map((c) => [c.key, c.value]));
  return (
    byKey['squad_secret_key'] ||
    byKey['squad_api_key'] ||
    process.env.SQUAD_SECRET_KEY ||
    process.env.SQUAD_API_KEY ||
    'PLACEHOLDER'
  );
}

/** @deprecated use getSecretKey */
async function getApiKey(): Promise<string> {
  return getSecretKey();
}

async function getBaseUrl(): Promise<string> {
  const config = await prisma.adminConfig.findUnique({ where: { key: 'squad_base_url' } });
  return config?.value ?? process.env.SQUAD_BASE_URL ?? 'https://sandbox-api-d.squadco.com';
}

async function squadRequest<T>(method: 'get' | 'post', endpoint: string, data?: object): Promise<T> {
  const [apiKey, baseUrl] = await Promise.all([getApiKey(), getBaseUrl()]);
  const response = await axios({
    method,
    url: `${baseUrl}${endpoint}`,
    data,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  });
  return response.data;
}

export async function createVirtualAccount(params: {
  verificationId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
}): Promise<{ virtualAccountNumber: string; bankName: string; reference: string }> {
  const res = await squadRequest<{ data: { virtual_account_number: string; bank_name: string; transaction_reference: string } }>(
    'post',
    '/virtual-account',
    {
      customer_identifier: params.verificationId,
      display_name: `Escrow-${params.verificationId.slice(0, 8)}`,
      first_name: params.customerName.split(' ')[0] ?? params.customerName,
      last_name: params.customerName.split(' ')[1] ?? '',
      email: params.customerEmail,
    }
  );
  return { virtualAccountNumber: res.data.virtual_account_number, bankName: res.data.bank_name, reference: res.data.transaction_reference };
}

export async function initiateCharge(params: {
  verificationId: string;
  amount: number;
  customerEmail: string;
  callbackUrl: string;
}): Promise<{ checkoutUrl: string; reference: string }> {
  const ref = `LV-${params.verificationId.slice(0, 8)}-${Date.now()}`;
  const res = await squadRequest<{ data: { checkout_url: string; transaction_ref: string } }>(
    'post',
    '/transaction/initiate',
    {
      amount: Math.round(params.amount * 100),
      email: params.customerEmail,
      currency: 'NGN',
      initiate_type: 'inline',
      transaction_ref: ref,
      callback_url: params.callbackUrl,
      metadata: { verificationId: params.verificationId },
    }
  );
  // Use the ref we sent — don't trust the response echo which may differ
  return { checkoutUrl: res.data.checkout_url, reference: ref };
}

export async function initiateWalletTopup(params: {
  userId: string;
  email: string;
  amount: number;
  callbackUrl: string;
}): Promise<{ checkoutUrl: string; reference: string }> {
  const ref = `WALLET-${params.userId.slice(0, 8)}-${Date.now()}`;
  const res = await squadRequest<{ data: { checkout_url: string } }>(
    'post',
    '/transaction/initiate',
    {
      amount: Math.round(params.amount * 100), // Squad expects kobo
      email: params.email,
      currency: 'NGN',
      initiate_type: 'inline',
      transaction_ref: ref,
      callback_url: params.callbackUrl,
      metadata: { type: 'wallet_topup', userId: params.userId },
    }
  );
  return { checkoutUrl: res.data.checkout_url, reference: ref };
}

export async function verifyTransaction(reference: string): Promise<{
  status: string;
  amount: number;
}> {
  const res = await squadRequest<{
    data: { transaction_status: string; transaction_amount: number };
  }>('get', `/transaction/verify/${reference}`);
  return {
    // Squad returns "Success" (capital S) — keep raw so callers can normalise
    status: res.data.transaction_status,
    amount: res.data.transaction_amount / 100, // kobo → NGN
  };
}

export async function initiateWithdrawal(params: {
  userId: string;
  amount: number;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  ref?: string;
}): Promise<{ reference: string }> {
  const ref = params.ref ?? `WD-${params.userId.slice(0, 8)}-${Date.now()}`;
  await squadRequest(
    'post',
    '/payout/initiate',
    {
      transaction_reference: ref,
      amount: Math.round(params.amount * 100), // kobo
      bank_code: params.bankCode,
      account_number: params.accountNumber,
      account_name: params.accountName,
      currency_id: 'NGN',
    }
  );
  return { reference: ref };
}

export async function releaseEscrow(virtualAccountNumber: string): Promise<void> {
  await squadRequest('post', '/virtual-account/merchant-virtual-accounts/simulate/debit', {
    virtual_account_number: virtualAccountNumber,
  });
}

export async function verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
  const secret = await getApiKey();
  const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex').toUpperCase();
  return hash === signature;
}
