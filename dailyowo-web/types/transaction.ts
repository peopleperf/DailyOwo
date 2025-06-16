export type TransactionType = 'income' | 'expense' | 'asset' | 'liability';

export type TransactionCategory = 
  // Income categories
  | 'salary'
  | 'freelance'
  | 'business'
  | 'investments'
  | 'rental'
  | 'gifts'
  | 'refunds'
  | 'other-income'
  // Expense categories
  | 'housing'
  | 'transportation'
  | 'food'
  | 'utilities'
  | 'healthcare'
  | 'insurance'
  | 'shopping'
  | 'entertainment'
  | 'education'
  | 'travel'
  | 'personal'
  | 'savings'
  | 'debt-payment'
  | 'other-expense'
  // Asset categories
  | 'cash'
  | 'checking-account'
  | 'savings-account'
  | 'stocks'
  | 'bonds'
  | 'etf'
  | 'mutual-funds'
  | 'cryptocurrency'
  | 'real-estate'
  | 'retirement-401k'
  | 'retirement-ira'
  | 'business-ownership'
  | 'collectibles'
  | 'commodities'
  | 'other-asset'
  // Liability categories  
  | 'credit-card'
  | 'personal-loan'
  | 'auto-loan'
  | 'mortgage'
  | 'student-loan'
  | 'business-loan'
  | 'line-of-credit'
  | 'other-liability';

export interface UserTransactionCategory {
  id: string; // Firestore document ID
  userId: string;
  name: string;
  icon?: string; // Optional, user can pick from a predefined set or have a default
  color?: string; // Optional, user can pick from a predefined set or have a default
  isArchived?: boolean; // To allow soft deletes
  createdAt: Date;
  updatedAt: Date;
}

// Placeholder for Timestamp if not already defined/imported globally
// type Timestamp = { seconds: number, nanoseconds: number };

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  /**
   * ID of the transaction category.
   * Can be an ID from global `transaction-categories.ts` (e.g., 'food_dining_groceries')
   * OR an ID from the user's specific categories (e.g., a Firestore ID from `userTransactionCategories` collection).
   */
  categoryId: string;

  /**
   * Specifies whether the categoryId refers to a global category or a user-specific one.
   * This helps in fetching the correct category details.
   */
  categoryType: 'global' | 'user';
  customCategory?: string; // This might become redundant or serve a different purpose now
  description: string;
  date: Date;
  isRecurring: boolean;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
    nextDate?: Date;
  };
  tags?: string[];
  attachments?: {
    receipts?: string[]; // URLs to uploaded receipts
    notes?: string;
  };
  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };
  merchant?: string;
  paymentMethod?: 'cash' | 'credit' | 'debit' | 'bank-transfer' | 'mobile-payment' | 'other';
  isPrivate?: boolean; // For family accounts
  debtId?: string; // Links debt payment transactions to specific debt transactions
  
  // Asset/Liability specific fields
  assetDetails?: {
    symbol?: string; // For stocks, crypto, etc.
    quantity?: number; // Number of shares/coins
    currentPrice?: number; // Auto-updated price
    lastPriceUpdate?: Date;
    exchange?: string;
    accountNumber?: string;
    institution?: string;
  };
  
  liabilityDetails?: {
    interestRate?: number;
    minimumPayment?: number;
    dueDate?: Date;
    accountNumber?: string;
    lender?: string;
    originalAmount?: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
  netCashflow: number;
  netWorth: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  assetsByCategory: Record<string, number>;
  liabilitiesByCategory: Record<string, number>;
  dailyAverage: number;
  monthlyProjection: number;
  savingsRate: number;
  debtToIncomeRatio: number;
}

export interface CategoryConfig {
  id: TransactionCategory;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isCustom?: boolean;
  supportsAutoPrice?: boolean; // For stocks, crypto, etc.
}

// Asset price update interfaces
export interface AssetPrice {
  symbol: string;
  price: number;
  currency: string;
  lastUpdated: Date;
  source: 'coingecko' | 'manual' | 'yahoo-finance';
  changePercent24h?: number;
}

export interface PriceUpdateRequest {
  transactionId: string;
  symbol: string;
  category: TransactionCategory;
}

// Type for creating new transactions
export interface CreateTransactionData {
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId: string;
  categoryType: 'global' | 'user';
  description: string;
  date: Date;
  isRecurring: boolean;
  recurringConfig?: Transaction['recurringConfig'];
  tags?: string[];
  attachments?: Transaction['attachments'];
  location?: Transaction['location'];
  merchant?: string;
  paymentMethod?: Transaction['paymentMethod'];
  isPrivate?: boolean;
  debtId?: string;
  assetDetails?: Transaction['assetDetails'];
  liabilityDetails?: Transaction['liabilityDetails'];
  userId: string;
  createdBy: string;
  budgetId?: string;
}

// Type for updating transactions
export interface UpdateTransactionData extends Partial<Omit<CreateTransactionData, 'userId' | 'createdBy'>> {
  lastModifiedBy?: string;
}