export interface DocumentAnalysisResult {
  authenticityScore: number;
  findings: string[];
  isSuspicious: boolean;
  rawResponse: string;
}

export interface TrustSignals {
  documents: DocumentAnalysisResult[];
  parcelNumber: string;
  ownerName: string;
  location: string;
}

export interface LandRegistryRecord {
  parcelNumber: string;
  ownerName: string;
  location: string;
  documentType?: string | null;
  registrationDate?: Date | null;
  size?: string | null;
  encumbrances?: string | null;
  transactionHistory: unknown[];
  rawData: unknown;
  sourceUrl: string;
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

export interface AIAnalysisResult {
  trustScore: number;
  status: 'VERIFIED' | 'CAUTION' | 'HIGH_RISK';
  matchReport: MatchReport | null;
  registryStatus: 'FOUND' | 'NOT_FOUND' | 'PENDING';
  summary: string;
  signals: Record<string, unknown>;
}

export interface AnalysisInput {
  verificationId: string;
  documents: DocumentAnalysisResult[];
  landRecord: LandRegistryRecord | null;
  submittedData: {
    parcelNumber: string;
    ownerName: string;
    location: string;
  };
}

export interface TrustScoreResult {
  verificationId: string;
  score: number;
  status: 'VERIFIED' | 'CAUTION' | 'HIGH_RISK';
  reason: string;
  triggeredBy: string;
}

export interface AIProvider {
  analyzeDocument(filePath: string, documentType: string): Promise<DocumentAnalysisResult>;
  computeTrustScore(verificationId: string, signals: TrustSignals): Promise<TrustScoreResult>;
  analyzeLandVerification(input: AnalysisInput): Promise<AIAnalysisResult>;
}
