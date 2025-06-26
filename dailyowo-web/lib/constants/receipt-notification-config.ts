import { ReceiptScannerConfig } from '@/types/receipt';
import { NotificationConfig } from '@/types/notification';

export const RECEIPT_CONFIG: ReceiptScannerConfig = {
  maxImageSize: 5 * 1024 * 1024, // 5MB
  supportedFormats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
  ocrLanguages: ['eng', 'fra', 'spa', 'deu', 'ita', 'por', 'yor'], // Including Yoruba
  confidenceThreshold: 0.7,
  autoCleanupHours: 24
};

export const NOTIFICATION_CONFIG: NotificationConfig = {
  retentionHours: 24,
  minConfidence: 0.8,
  maxPatternStorage: 1000,
  encryptionAlgorithm: 'AES-256-GCM',
  autoProcessing: false
};

// Common receipt patterns for parsing
export const RECEIPT_PATTERNS = {
  // Money patterns
  MONEY: /(?:[$€£₦¥]|USD|EUR|GBP|NGN)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
  
  // Date patterns
  DATE_PATTERNS: [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g, // YYYY-MM-DD
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})/gi
  ],
  
  // Common receipt keywords
  KEYWORDS: {
    TOTAL: /(?:total|grand\s*total|amount\s*due|total\s*amount)[\s:]*(.+)/i,
    TAX: /(?:tax|vat|gst)[\s:]*(.+)/i,
    SUBTOTAL: /(?:sub\s*total|subtotal)[\s:]*(.+)/i,
    TIP: /(?:tip|gratuity|service\s*charge)[\s:]*(.+)/i,
    DATE: /(?:date|dated)[\s:]*(.+)/i,
    TIME: /(?:time)[\s:]*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)/i,
    PAYMENT: /(?:paid\s*by|payment\s*method|card\s*ending)[\s:]*(.+)/i
  }
};

// Common notification patterns for transaction detection
export const NOTIFICATION_PATTERNS = {
  // Debit patterns
  DEBIT: [
    /(?:debited|withdrawn|paid|spent|charged)\s*(?:with|from)?\s*(?:[$€£₦]|USD|EUR|GBP|NGN)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:purchase|payment|transaction)\s*of\s*(?:[$€£₦]|USD|EUR|GBP|NGN)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:[$€£₦]|USD|EUR|GBP|NGN)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:debited|deducted|charged)/i
  ],
  
  // Credit patterns
  CREDIT: [
    /(?:credited|deposited|received|added)\s*(?:with|to)?\s*(?:[$€£₦]|USD|EUR|GBP|NGN)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:transfer|payment)\s*of\s*(?:[$€£₦]|USD|EUR|GBP|NGN)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:received|credited)/i,
    /(?:[$€£₦]|USD|EUR|GBP|NGN)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:credited|deposited|received)/i
  ],
  
  // Merchant extraction
  MERCHANT: [
    /(?:at|from|to|@)\s+([A-Za-z0-9\s\-\.]+?)(?:\s+on|\s+for|\s+ref|$)/i,
    /(?:merchant|vendor|shop)[\s:]+([A-Za-z0-9\s\-\.]+?)(?:\s+|$)/i
  ],
  
  // Balance extraction
  BALANCE: /(?:balance|bal|available\s*bal)[\s:]*(?:[$€£₦]|USD|EUR|GBP|NGN)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  
  // Reference extraction
  REFERENCE: /(?:ref|reference|txn|transaction\s*id)[\s:#]*([A-Za-z0-9\-]+)/i
};

// Supported banks and their notification formats (expandable)
export const BANK_PATTERNS = {
  generic: {
    name: 'Generic Bank',
    patterns: NOTIFICATION_PATTERNS
  }
  // Add specific bank patterns as needed
};

// Duplicate detection thresholds
export const DUPLICATE_THRESHOLDS = {
  amountTolerance: 0.01, // 1 cent/kobo tolerance
  timeTolerance: 5 * 60 * 1000, // 5 minutes in milliseconds
  minSimilarityScore: 0.85 // 85% similarity required
}; 