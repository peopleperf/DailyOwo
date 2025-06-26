export interface TransactionNotification {
  id: string;
  source: 'sms' | 'push' | 'email';
  appName?: string;
  phoneNumber?: string;
  timestamp: Date;
  rawContent: string;
  parsed?: ParsedTransactionData;
  status: 'pending' | 'confirmed' | 'rejected' | 'expired';
  userId: string;
  encrypted: boolean;
  expiresAt: Date;
}

export interface ParsedTransactionData {
  merchantName: string;
  amount: number;
  currency: string;
  date: Date;
  time?: string;
  type: 'debit' | 'credit';
  category?: string;
  paymentMethod?: string;
  reference?: string;
  balance?: number;
  confidence: {
    overall: number;
    amount: number;
    merchant: number;
    date: number;
  };
}

export interface NotificationPattern {
  id: string;
  name: string;
  source: 'sms' | 'push' | 'email';
  bankName?: string;
  patterns: {
    amount: RegExp;
    merchant?: RegExp;
    date?: RegExp;
    reference?: RegExp;
    balance?: RegExp;
  };
  examples: string[];
  confidence: number;
  userConfirmed: boolean;
  usageCount: number;
}

export interface NotificationRule {
  id: string;
  userId: string;
  type: 'whitelist' | 'blacklist' | 'auto-category';
  pattern?: string;
  appName?: string;
  phoneNumber?: string;
  category?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationConfig {
  retentionHours: number;
  minConfidence: number;
  maxPatternStorage: number;
  encryptionAlgorithm: string;
  autoProcessing: boolean;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  similarity: number;
  matchedTransactionId?: string;
  matchedReceiptId?: string;
  reasons: string[];
}

// Learning patterns for user behavior
export interface UserNotificationPattern {
  id: string;
  userId: string;
  pattern: NotificationPattern;
  confirmations: number;
  rejections: number;
  lastUsed: Date;
  accuracy: number;
} 