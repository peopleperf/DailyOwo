/**
 * Core AI Types and Interfaces
 * This file defines the base types for the modular AI system
 */

// Base AI Provider Interface
export interface AIProvider {
  name: string;
  initialize(): Promise<void>;
  isAvailable(): boolean;
  generateText(prompt: string, options?: AIGenerateOptions): Promise<string>;
  chat?(message: string, context: AIChatContext): Promise<string>;
  generateEmbedding?(text: string): Promise<number[]>;
  analyzeImage?(imageBase64: string, prompt: string): Promise<AIImageAnalysisResult>;
  cleanup?(): Promise<void>;
}

// AI Generation Options
export interface AIGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  format?: 'text' | 'json';
}

// Image Analysis Result
export interface AIImageAnalysisResult {
  text?: string;
  objects?: AIDetectedObject[];
  labels?: string[];
  confidence: number;
  rawResponse?: any;
}

export interface AIDetectedObject {
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Base AI Module Interface
export interface AIModule {
  id: string;
  name: string;
  description: string;
  version: string;
  provider: AIProvider;
  initialize(): Promise<void>;
}

// Receipt AI Types
export interface AIReceiptAnalysis {
  enhancedData: AIEnhancedReceiptData;
  suggestions: AIReceiptSuggestion[];
  confidence: number;
  processingTime: number;
}

export interface AIEnhancedReceiptData {
  merchantName: string;
  merchantCategory?: string;
  merchantAddress?: string;
  date: Date;
  items: AIReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  receiptNumber?: string;
  cashierName?: string;
}

export interface AIReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  brand?: string;
  healthScore?: number; // For food items
}

export interface AIReceiptSuggestion {
  type: 'category' | 'savings' | 'alternative' | 'insight';
  message: string;
  confidence: number;
  actionable?: boolean;
  action?: () => void;
}

// Financial Insights AI Types
export interface AIFinancialInsight {
  id: string;
  type: 'spending' | 'saving' | 'investment' | 'budget' | 'anomaly';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'positive';
  recommendations: string[];
  confidence: number;
  createdAt: Date;
  relatedTransactions?: string[];
}

// Budget AI Types
export interface AIBudgetRecommendation {
  categoryId: string;
  currentAmount: number;
  recommendedAmount: number;
  reason: string;
  potentialSavings: number;
  confidence: number;
}

// Chat Assistant Types
export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  error?: boolean;
  errorCode?: string;
  errorDetails?: string;
  metadata?: {
    intent?: string;
    entities?: Record<string, any>;
    confidence?: number;
  };
}

export interface AIChatContext {
  messages: AIChatMessage[];
  userId: string;
  sessionId: string;
  userFinancialContext?: {
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsGoals: any[];
    recentTransactions: any[];
  };
}

// AI Service Configuration
export interface AIServiceConfig {
  defaultProvider: 'gemini' | 'openai' | 'anthropic' | 'local';
  providers: {
    gemini?: {
      apiKey: string;
      model?: string;
    };
    openai?: {
      apiKey: string;
      model?: string;
    };
    anthropic?: {
      apiKey: string;
      model?: string;
    };
  };
  modules: {
    receipt: boolean;
    insights: boolean;
    budget: boolean;
    chat: boolean;
  };
  rateLimits?: {
    requestsPerMinute?: number;
    requestsPerDay?: number;
  };
}

// Error Types
export class AIError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public provider?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export enum AIErrorCode {
  PROVIDER_NOT_INITIALIZED = 'PROVIDER_NOT_INITIALIZED',
  PROVIDER_NOT_AVAILABLE = 'PROVIDER_NOT_AVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
} 