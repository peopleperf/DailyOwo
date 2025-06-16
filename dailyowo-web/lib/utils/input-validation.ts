import { FINANCIAL_CONSTANTS } from '@/lib/constants/financial-constants';

/**
 * Comprehensive Input Validation for Financial Data
 * Prevents bad data entry and ensures data integrity
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitizedValue?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/**
 * Validate transaction amount
 */
export function validateAmount(
  amount: number,
  type: 'income' | 'expense' | 'transfer',
  context?: {
    monthlyIncome?: number;
    monthlyExpenses?: number;
    accountBalance?: number;
  }
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Basic validation
  if (amount === null || amount === undefined || isNaN(amount)) {
    errors.push({
      field: 'amount',
      message: 'Amount must be a valid number',
      code: 'INVALID_NUMBER',
    });
  } else if (amount < 0) {
    errors.push({
      field: 'amount',
      message: 'Amount cannot be negative',
      code: 'NEGATIVE_AMOUNT',
    });
  } else if (amount === 0) {
    errors.push({
      field: 'amount',
      message: 'Amount cannot be zero',
      code: 'ZERO_AMOUNT',
    });
  } else if (amount > FINANCIAL_CONSTANTS.VALIDATION.MAX_TRANSACTION_AMOUNT) {
    errors.push({
      field: 'amount',
      message: `Amount cannot exceed ${FINANCIAL_CONSTANTS.VALIDATION.MAX_TRANSACTION_AMOUNT.toLocaleString()}`,
      code: 'EXCEEDS_MAX',
    });
  }

  // Contextual validation
  if (context && errors.length === 0) {
    // Check if expense exceeds monthly income by unreasonable amount
    if (type === 'expense' && context.monthlyIncome && context.monthlyIncome > 0) {
      const ratio = amount / context.monthlyIncome;
      if (ratio > FINANCIAL_CONSTANTS.VALIDATION.MAX_EXPENSE_TO_INCOME_RATIO) {
        warnings.push({
          field: 'amount',
          message: `This expense is ${(ratio * 100).toFixed(0)}% of your monthly income. Please verify this is correct.`,
          code: 'HIGH_EXPENSE_RATIO',
        });
      }
    }

    // Check if expense exceeds account balance
    if (type === 'expense' && context.accountBalance !== undefined) {
      if (amount > context.accountBalance) {
        warnings.push({
          field: 'amount',
          message: 'This expense exceeds your account balance',
          code: 'INSUFFICIENT_BALANCE',
        });
      }
    }

    // Check for unusually large income
    if (type === 'income' && context.monthlyIncome && context.monthlyIncome > 0) {
      const ratio = amount / context.monthlyIncome;
      if (ratio > FINANCIAL_CONSTANTS.VALIDATION.UNUSUAL_INCOME_MULTIPLIER) {
        warnings.push({
          field: 'amount',
          message: `This income is ${ratio.toFixed(1)}x your typical monthly income. Please verify this is correct.`,
          code: 'UNUSUAL_INCOME',
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? Math.round(amount * 100) / 100 : undefined,
  };
}

/**
 * Validate transaction date
 */
export function validateTransactionDate(
  date: Date,
  type: 'income' | 'expense' | 'transfer'
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    errors.push({
      field: 'date',
      message: 'Invalid date',
      code: 'INVALID_DATE',
    });
    return { isValid: false, errors, warnings };
  }

  const now = new Date();
  const daysDiff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Future date validation
  if (daysDiff > 0) {
    if (daysDiff > FINANCIAL_CONSTANTS.VALIDATION.MAX_FUTURE_DAYS) {
      errors.push({
        field: 'date',
        message: `Date cannot be more than ${FINANCIAL_CONSTANTS.VALIDATION.MAX_FUTURE_DAYS} days in the future`,
        code: 'TOO_FAR_FUTURE',
      });
    } else if (type === 'expense' && daysDiff > 0) {
      warnings.push({
        field: 'date',
        message: 'Recording an expense for a future date',
        code: 'FUTURE_EXPENSE',
      });
    }
  }

  // Past date validation
  if (daysDiff < 0) {
    const yearsDiff = Math.abs(daysDiff) / 365;
    if (yearsDiff > FINANCIAL_CONSTANTS.VALIDATION.MAX_YEARS_PAST) {
      errors.push({
        field: 'date',
        message: `Date cannot be more than ${FINANCIAL_CONSTANTS.VALIDATION.MAX_YEARS_PAST} years in the past`,
        code: 'TOO_FAR_PAST',
      });
    } else if (Math.abs(daysDiff) > 365) {
      warnings.push({
        field: 'date',
        message: 'This transaction is over a year old. Historical data will be recalculated.',
        code: 'OLD_TRANSACTION',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? date : undefined,
  };
}

/**
 * Validate account balance
 */
export function validateAccountBalance(
  balance: number,
  accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'loan'
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (balance === null || balance === undefined || isNaN(balance)) {
    errors.push({
      field: 'balance',
      message: 'Balance must be a valid number',
      code: 'INVALID_NUMBER',
    });
    return { isValid: false, errors, warnings };
  }

  // Type-specific validation
  switch (accountType) {
    case 'checking':
    case 'savings':
      if (balance < -FINANCIAL_CONSTANTS.VALIDATION.MAX_OVERDRAFT) {
        errors.push({
          field: 'balance',
          message: `Overdraft cannot exceed ${FINANCIAL_CONSTANTS.VALIDATION.MAX_OVERDRAFT.toLocaleString()}`,
          code: 'EXCESSIVE_OVERDRAFT',
        });
      } else if (balance < 0) {
        warnings.push({
          field: 'balance',
          message: 'Account is overdrawn',
          code: 'OVERDRAFT',
        });
      }
      break;

    case 'credit':
      if (balance > 0) {
        errors.push({
          field: 'balance',
          message: 'Credit card balance should be negative (amount owed)',
          code: 'INVALID_CREDIT_BALANCE',
        });
      }
      break;

    case 'loan':
      if (balance > 0) {
        errors.push({
          field: 'balance',
          message: 'Loan balance should be negative (amount owed)',
          code: 'INVALID_LOAN_BALANCE',
        });
      }
      break;
  }

  // Check for unreasonably large balances
  if (Math.abs(balance) > FINANCIAL_CONSTANTS.VALIDATION.MAX_ACCOUNT_BALANCE) {
    warnings.push({
      field: 'balance',
      message: 'This balance seems unusually high. Please verify.',
      code: 'UNUSUAL_BALANCE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? Math.round(balance * 100) / 100 : undefined,
  };
}

/**
 * Validate budget amount
 */
export function validateBudgetAmount(
  amount: number,
  category: string,
  monthlyIncome?: number
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (amount === null || amount === undefined || isNaN(amount)) {
    errors.push({
      field: 'amount',
      message: 'Budget amount must be a valid number',
      code: 'INVALID_NUMBER',
    });
  } else if (amount < 0) {
    errors.push({
      field: 'amount',
      message: 'Budget amount cannot be negative',
      code: 'NEGATIVE_BUDGET',
    });
  } else if (amount === 0) {
    warnings.push({
      field: 'amount',
      message: 'Budget is set to zero',
      code: 'ZERO_BUDGET',
    });
  }

  // Check against income if available
  if (monthlyIncome && monthlyIncome > 0 && amount > 0) {
    const percentage = (amount / monthlyIncome) * 100;
    
    // Category-specific validation
    const categoryLimits: { [key: string]: number } = {
      'Housing': 35,
      'Food': 15,
      'Transportation': 20,
      'Entertainment': 10,
      'Utilities': 10,
    };

    const limit = categoryLimits[category];
    if (limit && percentage > limit) {
      warnings.push({
        field: 'amount',
        message: `${category} budget is ${percentage.toFixed(0)}% of income (recommended: ${limit}%)`,
        code: 'HIGH_BUDGET_PERCENTAGE',
      });
    }

    if (percentage > 50) {
      warnings.push({
        field: 'amount',
        message: `This single category represents ${percentage.toFixed(0)}% of your income`,
        code: 'EXCESSIVE_BUDGET_PERCENTAGE',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? Math.round(amount * 100) / 100 : undefined,
  };
}

/**
 * Validate goal target amount
 */
export function validateGoalAmount(
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number,
  targetDate: Date
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate target amount
  if (targetAmount === null || targetAmount === undefined || isNaN(targetAmount)) {
    errors.push({
      field: 'targetAmount',
      message: 'Target amount must be a valid number',
      code: 'INVALID_NUMBER',
    });
  } else if (targetAmount <= 0) {
    errors.push({
      field: 'targetAmount',
      message: 'Target amount must be positive',
      code: 'NON_POSITIVE_TARGET',
    });
  } else if (targetAmount > FINANCIAL_CONSTANTS.VALIDATION.MAX_GOAL_AMOUNT) {
    errors.push({
      field: 'targetAmount',
      message: `Goal amount cannot exceed ${FINANCIAL_CONSTANTS.VALIDATION.MAX_GOAL_AMOUNT.toLocaleString()}`,
      code: 'EXCEEDS_MAX',
    });
  }

  // Validate current amount
  if (currentAmount < 0) {
    errors.push({
      field: 'currentAmount',
      message: 'Current amount cannot be negative',
      code: 'NEGATIVE_CURRENT',
    });
  } else if (currentAmount > targetAmount) {
    warnings.push({
      field: 'currentAmount',
      message: 'Goal is already exceeded',
      code: 'GOAL_EXCEEDED',
    });
  }

  // Validate monthly contribution
  if (monthlyContribution < 0) {
    errors.push({
      field: 'monthlyContribution',
      message: 'Monthly contribution cannot be negative',
      code: 'NEGATIVE_CONTRIBUTION',
    });
  }

  // Calculate required monthly contribution
  if (targetDate && targetAmount && currentAmount >= 0 && errors.length === 0) {
    const monthsRemaining = Math.max(0, 
      (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    if (monthsRemaining > 0) {
      const requiredMonthly = (targetAmount - currentAmount) / monthsRemaining;
      
      if (monthlyContribution < requiredMonthly * 0.9) {
        warnings.push({
          field: 'monthlyContribution',
          message: `Current contribution may not reach goal by target date (need ${requiredMonthly.toFixed(2)}/month)`,
          code: 'INSUFFICIENT_CONTRIBUTION',
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate percentage value
 */
export function validatePercentage(
  value: number,
  field: string,
  min: number = 0,
  max: number = 100
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (value === null || value === undefined || isNaN(value)) {
    errors.push({
      field,
      message: 'Must be a valid number',
      code: 'INVALID_NUMBER',
    });
  } else if (value < min || value > max) {
    errors.push({
      field,
      message: `Must be between ${min}% and ${max}%`,
      code: 'OUT_OF_RANGE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? Math.round(value * 100) / 100 : undefined,
  };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    errors.push({
      field: 'email',
      message: 'Email is required',
      code: 'REQUIRED',
    });
  } else if (!emailRegex.test(email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
      code: 'INVALID_FORMAT',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? email.toLowerCase().trim() : undefined,
  };
}

/**
 * Validate category name
 */
export function validateCategoryName(name: string, existingCategories: string[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Category name is required',
      code: 'REQUIRED',
    });
  } else if (name.length > FINANCIAL_CONSTANTS.VALIDATION.MAX_CATEGORY_NAME_LENGTH) {
    errors.push({
      field: 'name',
      message: `Category name cannot exceed ${FINANCIAL_CONSTANTS.VALIDATION.MAX_CATEGORY_NAME_LENGTH} characters`,
      code: 'TOO_LONG',
    });
  } else if (existingCategories.some(cat => cat.toLowerCase() === name.toLowerCase())) {
    errors.push({
      field: 'name',
      message: 'Category already exists',
      code: 'DUPLICATE',
    });
  }

  // Check for special characters
  const specialCharsRegex = /[<>"/\\|?*]/;
  if (specialCharsRegex.test(name)) {
    errors.push({
      field: 'name',
      message: 'Category name contains invalid characters',
      code: 'INVALID_CHARACTERS',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? name.trim() : undefined,
  };
}

/**
 * Validate transaction description
 */
export function validateDescription(description: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (description && description.length > FINANCIAL_CONSTANTS.VALIDATION.MAX_DESCRIPTION_LENGTH) {
    errors.push({
      field: 'description',
      message: `Description cannot exceed ${FINANCIAL_CONSTANTS.VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
      code: 'TOO_LONG',
    });
  }

  // Check for potentially sensitive information
  const sensitivePatterns = [
    /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(description)) {
      warnings.push({
        field: 'description',
        message: 'Description may contain sensitive information',
        code: 'SENSITIVE_DATA',
      });
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: errors.length === 0 ? description.trim() : undefined,
  };
}

/**
 * Validation levels for different contexts
 */
export enum ValidationLevel {
  STRICT = 'strict',   // All fields required, no warnings allowed
  NORMAL = 'normal',   // Required fields only
  PARTIAL = 'partial', // Validate only provided fields
  DRAFT = 'draft',     // Minimal validation for drafts
}

/**
 * Validate a complete transaction
 */
export function validateTransaction(
  transaction: Partial<{
    type: 'income' | 'expense' | 'asset' | 'liability';
    amount: number;
    categoryId: string;
    description: string;
    date: Date;
    tags?: string[];
  }>,
  level: ValidationLevel = ValidationLevel.NORMAL,
  context?: {
    monthlyIncome?: number;
    accountBalance?: number;
    existingCategories?: string[];
  }
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const sanitized: any = {};

  // Type validation
  if (!transaction.type && level !== ValidationLevel.PARTIAL) {
    errors.push({
      field: 'type',
      message: 'Transaction type is required',
      code: 'REQUIRED',
    });
  }

  // Amount validation
  if (transaction.amount !== undefined || level !== ValidationLevel.PARTIAL) {
    // Map transaction types to validation types
    const validationType = (transaction.type === 'asset' || transaction.type === 'liability') 
      ? 'transfer' 
      : transaction.type || 'expense';
      
    const amountResult = validateAmount(
      transaction.amount || 0,
      validationType as 'income' | 'expense' | 'transfer',
      context
    );
    
    if (!amountResult.isValid) {
      errors.push(...amountResult.errors);
    }
    warnings.push(...amountResult.warnings);
    
    if (amountResult.sanitizedValue !== undefined) {
      sanitized.amount = amountResult.sanitizedValue;
    }
  }

  // Category validation
  if (!transaction.categoryId && level !== ValidationLevel.PARTIAL && level !== ValidationLevel.DRAFT) {
    errors.push({
      field: 'categoryId',
      message: 'Category is required',
      code: 'REQUIRED',
    });
  }

  // Date validation
  if (transaction.date !== undefined || level !== ValidationLevel.PARTIAL) {
    // Map transaction types to validation types
    const validationType = (transaction.type === 'asset' || transaction.type === 'liability') 
      ? 'transfer' 
      : transaction.type || 'expense';
      
    const dateResult = validateTransactionDate(
      transaction.date || new Date(),
      validationType as 'income' | 'expense' | 'transfer'
    );
    
    if (!dateResult.isValid) {
      errors.push(...dateResult.errors);
    }
    warnings.push(...dateResult.warnings);
    
    if (dateResult.sanitizedValue !== undefined) {
      sanitized.date = dateResult.sanitizedValue;
    }
  }

  // Description validation
  if (transaction.description !== undefined) {
    const descResult = validateDescription(transaction.description);
    
    if (!descResult.isValid) {
      errors.push(...descResult.errors);
    }
    warnings.push(...descResult.warnings);
    
    if (descResult.sanitizedValue !== undefined) {
      sanitized.description = descResult.sanitizedValue;
    }
  }

  // In strict mode, don't allow any warnings
  if (level === ValidationLevel.STRICT && warnings.length > 0) {
    errors.push({
      field: 'general',
      message: 'Transaction has validation warnings that must be resolved',
      code: 'WARNINGS_IN_STRICT_MODE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: Object.keys(sanitized).length > 0 ? sanitized : undefined,
  };
} 