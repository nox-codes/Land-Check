// Matches actual backend Prisma schema + API responses

export type UserRole = 'USER' | 'ADMIN';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'CAUTION' | 'HIGH_RISK';

export type DocumentType = 'C_OF_O' | 'DEED' | 'SURVEY_PLAN' | 'POWER_OF_ATTORNEY';

export type PaymentStatus = 'PENDING' | 'HELD' | 'RELEASED' | 'BLOCKED';

export type RegistryStatus = 'PENDING' | 'FOUND' | 'NOT_FOUND';

// Backend returns only id, email, role — no firstName/lastName
export interface User {
  id: string;
  email: string;
  role: UserRole;
}

// Backend auth response: { success, token, user }
export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface DocumentAnalysisResult {
  authenticityScore?: number;
  findings?: string[];
  isSuspicious?: boolean;
  rawResponse?: string;
}

export interface Document {
  id: string;
  verificationId: string;
  type: DocumentType;
  filePath: string;
  analysisResult: DocumentAnalysisResult | null;
  authenticityScore: number | null;
  uploadedAt: string;
}

export interface Payment {
  id: string;
  verificationId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  squadReference: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface FieldMatch {
  match: boolean;
  note: string;
}

export interface MatchReport {
  parcelNumber: FieldMatch;
  ownerName: FieldMatch;
  location: FieldMatch;
  documentType: FieldMatch;
}

export interface Verification {
  id: string;
  userId: string;
  parcelNumber: string;
  location: string;
  ownerName: string;
  status: VerificationStatus;
  trustScore: number | null;
  registryStatus: RegistryStatus;
  matchReport: MatchReport | null;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
  payment: Payment | null;
}

export interface ScamReport {
  id: string;
  userId: string | null;
  parcelNumber: string;
  description: string;
  evidenceUrls: string[];
  createdAt: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface CreateVerificationDto {
  parcelNumber: string;
  location: string;
  ownerName: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type WalletTxType = 'FUND' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'ADMIN_CREDIT' | 'ADMIN_DEBIT';

export type PurchaseStatus = 'PENDING_SELLER' | 'INITIATED' | 'DOCS_UPLOADED' | 'AI_REVIEWED' | 'IN_ESCROW' | 'COMPLETED' | 'CANCELLED' | 'DECLINED';

export type NotifType = 'OFFER_RECEIVED' | 'OFFER_ACCEPTED' | 'OFFER_DECLINED' | 'ESCROW_HELD' | 'ESCROW_RELEASED' | 'MESSAGE_RECEIVED';

export interface Message {
  id: string;
  purchaseId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; email: string };
}

export interface Notification {
  id: string;
  userId: string;
  purchaseId: string | null;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  fromWalletId: string | null;
  toWalletId: string | null;
  amount: number;
  type: WalletTxType;
  reference: string;
  note: string | null;
  purchaseId: string | null;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  sentTxns?: WalletTransaction[];
  receivedTxns?: WalletTransaction[];
}

export interface UserSearchResult {
  id: string;
  email: string;
}

export interface LandPurchase {
  id: string;
  buyerId: string;
  sellerId: string;
  verificationId: string;
  agreedAmount: number;
  status: PurchaseStatus;
  createdAt: string;
  updatedAt: string;
  buyer: UserSearchResult;
  seller: UserSearchResult;
  verification: Verification | Pick<Verification, 'id' | 'parcelNumber' | 'location' | 'trustScore' | 'status'>;
  transactions?: WalletTransaction[];
}
