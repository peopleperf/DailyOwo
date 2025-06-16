/**
 * Transaction validation utilities
 * Ensures data integrity and consistency for all financial transactions
 */

import { Transaction } from '@/types/transaction';
import { CalculationError } from './error-handling';

export interface ValidationResult {
  isValid: boolean;
  errors: CalculationError[];
  warnings: string[];
}

/**
 * Validate a single transaction
 */
export function validateTransaction(
  transaction: Partial<Transaction>,
  context: 'create' | 'update' = 'create'
): ValidationResult {
  const errors: CalculationError[] = [];
  const warnings: string[] = [];

  // Required fields for new transactions
  if (context === 'create') {
    if (!transaction.type) {
      errors.push({
        code: 'TYPE_REQUIRED',
        message: 'Transaction type is required',
        field: 'type'
      });
    }

    if (!transaction.amount || transaction.amount <= 0) {
      errors.push({
        code: 'AMOUNT_INVALID',
        message: 'Amount must be greater than zero',
        field: 'amount',
        value: transaction.amount
      });
    }

    if (!transaction.categoryId) {
      errors.push({
        code: 'CATEGORY_REQUIRED',
        message: 'Category is required',
        field: 'categoryId'
      });
    }

    if (!transaction.date) {
      errors.push({
        code: 'DATE_REQUIRED',
        message: 'Transaction date is required',
        field: 'date'
      });
    }
  }

  // Validate transaction type
  if (transaction.type && !['income', 'expense', 'asset', 'liability'].includes(transaction.type)) {
    errors.push({
      code: 'TYPE_INVALID',
      message: 'Invalid transaction type',
      field: 'type',
      value: transaction.type,
      suggestion: 'Use income, expense, asset, or liability'
    });
  }

  // Validate amount
  if (transaction.amount !== undefined) {
    if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
      errors.push({
        code: 'AMOUNT_NOT_NUMBER',
        message: 'Amount must be a valid number',
        field: 'amount',
        value: transaction.amount
      });
    } else if (transaction.amount < 0) {
      errors.push({
        code: 'AMOUNT_NEGATIVE',
        message: 'Amount cannot be negative',
        field: 'amount',
        value: transaction.amount,
        suggestion: 'Use transaction type to indicate direction of money flow'
      });
    } else if (!isFinite(transaction.amount)) {
      errors.push({
        code: 'AMOUNT_INFINITE',
        message: 'Amount must be a finite number',
        field: 'amount',
        value: transaction.amount
      });
    } else if (transaction.amount > 1000000000) {
      warnings.push('Amount seems unusually large. Please verify.');
    }
  }

  // Validate date
  if (transaction.date) {
    const date = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
    
    if (isNaN(date.getTime())) {
      errors.push({
        code: 'DATE_INVALID',
        message: 'Invalid transaction date',
        field: 'date',
        value: transaction.date
      });
    } else {
      const now = new Date();
      const yearFromNow = new Date();
      yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);
      
      if (date > yearFromNow) {
        errors.push({
          code: 'DATE_FUTURE',
          message: 'Transaction date cannot be more than 1 year in the future',
          field: 'date',
          value: transaction.date
        });
      }
      
      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
      
      if (date < hundredYearsAgo) {
        errors.push({
          code: 'DATE_TOO_OLD',
          message: 'Transaction date seems unrealistic',
          field: 'date',
          value: transaction.date
        });
      }
    }
  }

  // Validate recurring configuration
  if (transaction.isRecurring && transaction.recurringConfig) {
    const config = transaction.recurringConfig;
    
    if (!config.frequency) {
      errors.push({
        code: 'RECURRING_FREQUENCY_MISSING',
        message: 'Recurring frequency is required',
        field: 'recurringConfig.frequency'
      });
    } else if (!['daily', 'weekly', 'monthly', 'yearly'].includes(config.frequency)) {
      errors.push({
        code: 'RECURRING_FREQUENCY_INVALID',
        message: 'Invalid recurring frequency',
        field: 'recurringConfig.frequency',
        value: config.frequency
      });
    }
    
    if (config.endDate && config.nextDate) {
      const endDate = new Date(config.endDate);
      const nextDate = new Date(config.nextDate);
      
      if (nextDate > endDate) {
        errors.push({
          code: 'RECURRING_DATES_INVALID',
          message: 'Next occurrence date cannot be after end date',
          field: 'recurringConfig'
        });
      }
    }
  }

  // Validate asset details
  if (transaction.type === 'asset' && transaction.assetDetails) {
    const details = transaction.assetDetails;
    
    if (details.quantity !== undefined && details.quantity <= 0) {
      errors.push({
        code: 'ASSET_QUANTITY_INVALID',
        message: 'Asset quantity must be positive',
        field: 'assetDetails.quantity',
        value: details.quantity
      });
    }
    
    if (details.currentPrice !== undefined && details.currentPrice < 0) {
      errors.push({
        code: 'ASSET_PRICE_NEGATIVE',
        message: 'Asset price cannot be negative',
        field: 'assetDetails.currentPrice',
        value: details.currentPrice
      });
    }
  }

  // Validate liability details
  if (transaction.type === 'liability' && transaction.liabilityDetails) {
    const details = transaction.liabilityDetails;
    
    if (details.interestRate !== undefined) {
      if (details.interestRate < 0) {
        errors.push({
          code: 'LIABILITY_RATE_NEGATIVE',
          message: 'Interest rate cannot be negative',
          field: 'liabilityDetails.interestRate',
          value: details.interestRate
        });
      } else if (details.interestRate > 100) {
        warnings.push('Interest rate seems unusually high. Please verify.');
      }
    }
    
    if (details.minimumPayment !== undefined && details.minimumPayment < 0) {
      errors.push({
        code: 'LIABILITY_PAYMENT_NEGATIVE',
        message: 'Minimum payment cannot be negative',
        field: 'liabilityDetails.minimumPayment',
        value: details.minimumPayment
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate a batch of transactions
 */
export function validateTransactionBatch(
  transactions: Partial<Transaction>[]
): {
  valid: Partial<Transaction>[];
  invalid: Array<{ transaction: Partial<Transaction>; errors: CalculationError[] }>;
  warnings: string[];
} {
  const valid: Partial<Transaction>[] = [];
  const invalid: Array<{ transaction: Partial<Transaction>; errors: CalculationError[] }> = [];
  const allWarnings: string[] = [];

  transactions.forEach(transaction => {
    const result = validateTransaction(transaction);
    
    if (result.isValid) {
      valid.push(transaction);
    } else {
      invalid.push({ transaction, errors: result.errors });
    }
    
    allWarnings.push(...result.warnings);
  });

  return {
    valid,
    invalid,
    warnings: allWarnings
  };
}

/**
 * Check for duplicate transactions
 */
export function checkDuplicateTransactions(
  newTransaction: Partial<Transaction>,
  existingTransactions: Transaction[],
  threshold: number = 60000 // 1 minute in milliseconds
): Transaction[] {
  if (!newTransaction.amount || !newTransaction.date || !newTransaction.type) {
    return [];
  }

  const newDate = newTransaction.date instanceof Date 
    ? newTransaction.date 
    : new Date(newTransaction.date);

  return existingTransactions.filter(existing => {
    // Check same type and amount
    if (existing.type !== newTransaction.type || 
        existing.amount !== newTransaction.amount) {
      return false;
    }

    // Check if dates are close
    const existingDate = existing.date instanceof Date 
      ? existing.date 
      : new Date(existing.date);
    
    const timeDiff = Math.abs(newDate.getTime() - existingDate.getTime());
    
    // Consider as potential duplicate if within threshold
    return timeDiff < threshold;
  });
}

/**
 * Validate transaction consistency
 */
export function validateTransactionConsistency(
  transactions: Transaction[]
): {
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for orphaned debt payments
  const debtPayments = transactions.filter(t => 
    t.type === 'expense' && t.categoryId === 'debt-payment'
  );
  const liabilities = transactions.filter(t => t.type === 'liability');

  if (debtPayments.length > 0 && liabilities.length === 0) {
    issues.push('Found debt payments but no corresponding liabilities');
    suggestions.push('Add your loans or credit cards as liabilities');
  }

  // Check for asset transactions without initial purchase
  const assetGroups = new Map<string, Transaction[]>();
  transactions
    .filter(t => t.type === 'asset')
    .forEach(t => {
      const key = t.assetDetails?.symbol || t.categoryId;
      if (!assetGroups.has(key)) {
        assetGroups.set(key, []);
      }
      assetGroups.get(key)!.push(t);
    });

  assetGroups.forEach((group, key) => {
    const sorted = group.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Check if first transaction is a sale (negative quantity)
    if (sorted[0].assetDetails?.quantity && sorted[0].assetDetails.quantity < 0) {
      issues.push(`Asset ${key} appears to have sales before purchases`);
      suggestions.push('Add the initial purchase transaction for this asset');
    }
  });

  // Check for future-dated recurring transactions
  const futureRecurring = transactions.filter(t => {
    if (!t.isRecurring || !t.date) return false;
    const date = t.date instanceof Date ? t.date : new Date(t.date);
    return date > new Date();
  });

  if (futureRecurring.length > 0) {
    issues.push(`Found ${futureRecurring.length} future-dated recurring transactions`);
    suggestions.push('Recurring transactions should start from today or past dates');
  }

  return { issues, suggestions };
}

/**
 * Sanitize transaction data
 */
export function sanitizeTransaction(
  transaction: Partial<Transaction>
): Partial<Transaction> {
  const sanitized: Partial<Transaction> = { ...transaction };

  // Trim string fields
  if (sanitized.description) {
    sanitized.description = sanitized.description.trim();
  }
  
  if (sanitized.merchant) {
    sanitized.merchant = sanitized.merchant.trim();
  }
  
  // Location is an object, not a string
  if (sanitized.location && typeof sanitized.location === 'object' && sanitized.location.name) {
    sanitized.location.name = sanitized.location.name.trim();
  }

  // Ensure positive amounts
  if (sanitized.amount && sanitized.amount < 0) {
    console.warn('Negative amount detected, converting to positive', sanitized.amount);
    sanitized.amount = Math.abs(sanitized.amount);
  }

  // Normalize dates
  if (sanitized.date && !(sanitized.date instanceof Date)) {
    sanitized.date = new Date(sanitized.date);
  }

  // Clean up tags
  if (sanitized.tags) {
    sanitized.tags = sanitized.tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
  }

  return sanitized;
} 