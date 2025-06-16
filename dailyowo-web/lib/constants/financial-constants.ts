/**
 * Financial Constants
 * Centralized constants for all financial calculations
 * This eliminates magic numbers and ensures consistency across the app
 */

// ============= FINANCIAL HEALTH SCORE WEIGHTS =============
export const FINANCIAL_HEALTH_WEIGHTS = {
  NET_WORTH: 0.30,      // 30% - Asset accumulation and debt reduction
  INCOME: 0.25,         // 25% - Income stability and growth
  SPENDING: 0.20,       // 20% - Expense control and efficiency
  SAVINGS: 0.15,        // 15% - Savings rate and habits
  DEBT: 0.10,           // 10% - Debt management
} as const;

// Validate weights sum to 1
const weightSum = Object.values(FINANCIAL_HEALTH_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
if (Math.abs(weightSum - 1) > 0.001) {
  throw new Error(`Financial health weights must sum to 1, but got ${weightSum}`);
}

// ============= SCORE THRESHOLDS =============
export const SCORE_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  FAIR: 55,
  NEEDS_IMPROVEMENT: 35,
  CRITICAL: 0,
} as const;

// ============= FINANCIAL RATIOS =============
export const FINANCIAL_RATIOS = {
  // Debt-to-Income Ratios
  DEBT_TO_INCOME_EXCELLENT: 0.20,     // 20% or less
  DEBT_TO_INCOME_GOOD: 0.36,          // 36% or less (mortgage standard)
  DEBT_TO_INCOME_FAIR: 0.50,          // 50% or less
  DEBT_TO_INCOME_CONCERNING: 0.75,    // 75% or less
  
  // Savings Rate Targets
  SAVINGS_RATE_EXCELLENT: 0.20,        // 20% or more
  SAVINGS_RATE_GOOD: 0.15,             // 15% or more
  SAVINGS_RATE_FAIR: 0.10,             // 10% or more
  SAVINGS_RATE_MINIMUM: 0.05,          // 5% or more
  
  // Net Worth Ratios
  NET_WORTH_EXCELLENT: 0.75,           // 75% of assets are net worth
  NET_WORTH_GOOD: 0.50,                // 50% of assets are net worth
  NET_WORTH_FAIR: 0.25,                // 25% of assets are net worth
  
  // Income Stability
  INCOME_STABILITY_THRESHOLD: 0.70,    // 70% of income is recurring
  
  // Emergency Fund
  EMERGENCY_FUND_MINIMUM_MONTHS: 3,
  EMERGENCY_FUND_RECOMMENDED_MONTHS: 6,
  EMERGENCY_FUND_EXCELLENT_MONTHS: 12,
} as const;

// ============= BUDGET METHODS =============
export const BUDGET_METHOD_ALLOCATIONS = {
  '50-30-20': {
    needs: 0.50,      // 50% for needs
    wants: 0.30,      // 30% for wants
    savings: 0.20,    // 20% for savings
  },
  'zero-based': {
    // All income must be allocated
    totalAllocation: 1.00,
  },
  'pay-yourself-first': {
    minimumSavings: 0.20,  // Save 20% first
  },
  '60-percent': {
    committedExpenses: 0.60,  // 60% for committed expenses
    funMoney: 0.10,          // 10% for fun
    irregularExpenses: 0.10,  // 10% for irregular expenses
    longTermSavings: 0.10,    // 10% for long-term savings
    shortTermSavings: 0.10,   // 10% for short-term savings
  },
} as const;

// ============= TIME PERIODS =============
export const TIME_PERIODS = {
  DAYS_IN_WEEK: 7,
  DAYS_IN_MONTH: 30,          // Standardized for calculations
  DAYS_IN_YEAR: 365,
  MONTHS_IN_YEAR: 12,
  WEEKS_IN_YEAR: 52,
  
  // Milliseconds
  MS_IN_MINUTE: 60 * 1000,
  MS_IN_HOUR: 60 * 60 * 1000,
  MS_IN_DAY: 24 * 60 * 60 * 1000,
} as const;

// ============= FINANCIAL LIMITS =============
export const FINANCIAL_LIMITS = {
  // Transaction limits
  MAX_TRANSACTION_AMOUNT: 1_000_000_000,  // 1 billion
  MIN_TRANSACTION_AMOUNT: 0.01,
  
  // Age limits
  MIN_USER_AGE: 13,
  MAX_USER_AGE: 120,
  
  // Interest rate limits
  MAX_INTEREST_RATE: 100,      // 100% APR max
  MAX_REASONABLE_RATE: 50,     // 50% APR warning threshold
  
  // Goal limits
  MAX_GOAL_YEARS: 50,          // 50 years max for goals
  
  // Income thresholds (for scoring)
  HIGH_INCOME_THRESHOLD: 10000,    // Monthly income
  MEDIUM_INCOME_THRESHOLD: 5000,
  LOW_INCOME_THRESHOLD: 2500,
  MINIMUM_INCOME_THRESHOLD: 1000,
} as const;

// ============= CALCULATION DEFAULTS =============
export const CALCULATION_DEFAULTS = {
  // Investment returns
  DEFAULT_ANNUAL_RETURN: 0.07,     // 7% annual return
  CONSERVATIVE_RETURN: 0.05,       // 5% for conservative estimates
  AGGRESSIVE_RETURN: 0.10,         // 10% for aggressive estimates
  
  // Inflation
  DEFAULT_INFLATION_RATE: 0.03,    // 3% annual inflation
  
  // Compound frequency
  MONTHLY_COMPOUNDING: 12,
  QUARTERLY_COMPOUNDING: 4,
  ANNUAL_COMPOUNDING: 1,
  
  // Default timeframes
  DEFAULT_GOAL_MONTHS: 12,
  DEFAULT_PROJECTION_YEARS: 30,
} as const;

// ============= UI CONSTANTS =============
export const UI_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Chart display
  DEFAULT_CHART_MONTHS: 12,
  MAX_CHART_POINTS: 365,
  
  // Decimal places
  CURRENCY_DECIMALS: 2,
  PERCENTAGE_DECIMALS: 1,
  RATIO_DECIMALS: 2,
  
  // Update intervals
  PRICE_UPDATE_INTERVAL_MS: 5 * 60 * 1000,  // 5 minutes
  DASHBOARD_REFRESH_INTERVAL_MS: 30 * 1000,  // 30 seconds
} as const;

// ============= VALIDATION THRESHOLDS =============
export const VALIDATION_THRESHOLDS = {
  // Duplicate detection
  DUPLICATE_TIME_WINDOW_MS: 60 * 1000,  // 1 minute
  
  // Date validation
  MAX_FUTURE_DATE_DAYS: 365,            // 1 year in future
  MAX_PAST_DATE_YEARS: 100,             // 100 years in past
  
  // Variance thresholds
  ACCEPTABLE_VARIANCE_PERCENT: 10,       // 10% variance is normal
  HIGH_VARIANCE_PERCENT: 25,            // 25% variance is concerning
  
  // Calculation precision
  EPSILON: 0.001,                       // For floating point comparisons
} as const;

// ============= CATEGORY MAPPINGS =============
export const EXPENSE_CATEGORY_TYPES = {
  FIXED: ['housing', 'insurance', 'utilities', 'debt-payment'],
  VARIABLE: ['food', 'transportation', 'personal'],
  DISCRETIONARY: ['entertainment', 'shopping', 'travel', 'education'],
  ESSENTIAL: ['housing', 'food', 'healthcare', 'utilities', 'transportation'],
} as const;

export const INCOME_CATEGORY_TYPES = {
  PRIMARY: ['salary', 'business'],
  SECONDARY: ['freelance'],
  PASSIVE: ['investments', 'rental'],
  ONE_TIME: ['gifts', 'refunds', 'other-income'],
} as const;

// ============= SCORING WEIGHTS =============
export const COMPONENT_SCORE_WEIGHTS = {
  // Income scoring
  INCOME_STABILITY: 0.5,
  INCOME_AMOUNT: 0.5,
  
  // Expense scoring  
  EXPENSE_RATIO: 0.7,
  EXPENSE_CONTROL: 0.3,
  
  // Debt scoring
  DEBT_FREE_BONUS: 1.0,
  DEBT_RATIO_WEIGHT: 0.8,
  DEBT_SERVICE_WEIGHT: 0.2,
} as const;

// Type exports for type safety
export type FinancialHealthWeight = typeof FINANCIAL_HEALTH_WEIGHTS[keyof typeof FINANCIAL_HEALTH_WEIGHTS];
export type ScoreThreshold = typeof SCORE_THRESHOLDS[keyof typeof SCORE_THRESHOLDS];
export type BudgetMethodType = keyof typeof BUDGET_METHOD_ALLOCATIONS;

// ============= INPUT VALIDATION CONSTANTS =============
export const INPUT_VALIDATION = {
  // Amount limits
  MAX_TRANSACTION_AMOUNT: 1000000, // $1M
  MAX_ACCOUNT_BALANCE: 10000000, // $10M
  MAX_GOAL_AMOUNT: 10000000, // $10M
  MAX_OVERDRAFT: 10000, // $10K
  
  // Date limits
  MAX_FUTURE_DAYS: 30, // Can't schedule more than 30 days ahead
  MAX_YEARS_PAST: 10, // Can't add transactions older than 10 years
  
  // Ratio limits
  MAX_EXPENSE_TO_INCOME_RATIO: 10, // Expense can't be more than 10x monthly income
  UNUSUAL_INCOME_MULTIPLIER: 5, // Income 5x higher than usual triggers warning
  
  // String limits
  MAX_CATEGORY_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
  
  // Other limits
  MIN_PASSWORD_LENGTH: 8,
  MAX_CATEGORIES_PER_USER: 100,
  MAX_ACCOUNTS_PER_USER: 50,
  MAX_GOALS_PER_USER: 50,
} as const;

// Consolidated FINANCIAL_CONSTANTS for backward compatibility
export const FINANCIAL_CONSTANTS = {
  FINANCIAL_HEALTH_WEIGHTS,
  SCORE_THRESHOLDS,
  FINANCIAL_RATIOS,
  BUDGET_METHOD_ALLOCATIONS,
  TIME_PERIODS,
  FINANCIAL_LIMITS,
  CALCULATION_DEFAULTS,
  UI_CONSTANTS,
  VALIDATION_THRESHOLDS,
  EXPENSE_CATEGORY_TYPES,
  INCOME_CATEGORY_TYPES,
  COMPONENT_SCORE_WEIGHTS,
  VALIDATION: INPUT_VALIDATION,
} as const;

// Validate that financial health score weights sum to 1.0
const scoreWeightSum = Object.values(FINANCIAL_CONSTANTS.FINANCIAL_HEALTH_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
if (Math.abs(scoreWeightSum - 1.0) > 0.001) {
  throw new Error(`Financial health score weights must sum to 1.0, but got ${scoreWeightSum}`);
} 