export interface ReceiptLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  confidence: number;
  category?: string; // AI-enhanced: item category
  brand?: string; // AI-enhanced: brand detection
  healthScore?: number; // AI-enhanced: health score for food items
}

export interface ExtractedReceiptData {
  merchantName: string;
  merchantCategory?: string; // AI-enhanced: merchant category
  merchantAddress?: string;
  date: Date;
  time?: string;
  items: ReceiptLineItem[];
  subtotal: number;
  tax: number;
  tip?: number;
  total: number;
  paymentMethod?: string;
  currency: string;
  rawText: string;
  receiptNumber?: string; // AI-enhanced: receipt number
  cashierName?: string; // AI-enhanced: cashier name
  confidence: {
    overall: number;
    merchantName: number;
    date: number;
    total: number;
    items: number;
  };
}

export interface ReceiptScanResult {
  success: boolean;
  data?: ExtractedReceiptData;
  error?: string;
  warnings?: string[];
  processingTime: number;
}

export interface ReceiptImage {
  id: string;
  url: string;
  thumbnail?: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

export interface ProcessedReceipt {
  id: string;
  userId: string;
  image: ReceiptImage;
  extractedData: ExtractedReceiptData;
  transactions?: string[]; // Transaction IDs created from this receipt
  createdAt: Date;
  updatedAt: Date;
  status: 'processing' | 'completed' | 'failed' | 'partial';
}

export interface ReceiptScannerConfig {
  maxImageSize: number;
  supportedFormats: string[];
  ocrLanguages: string[];
  confidenceThreshold: number;
  autoCleanupHours: number;
}

// Receipt parser patterns for different merchants/formats
export interface ReceiptPattern {
  id: string;
  merchantName: string;
  patterns: {
    date?: RegExp;
    total?: RegExp;
    tax?: RegExp;
    items?: RegExp;
  };
  priority: number;
} 