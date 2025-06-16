/**
 * Financial Logic Modules Index
 * Centralized exports for all financial calculation modules
 */

// Import types for re-export
import type { NetWorthData, NetWorthTrend } from './networth-logic';
import type { IncomeData, IncomeSource, IncomeTrend } from './income-logic';
import type { ExpensesData, ExpenseCategory, SpendingPattern, BudgetAnalysis } from './expenses-logic';
import type { SavingsRateData, SavingsBreakdown, SavingsTarget, SavingsRateTrend } from './savings-rate-logic';
import type { DebtRatioData, DebtBreakdown, DebtPayoffStrategy, DebtRatioTrend } from './debt-ratio-logic';
import type { AssetPriceManager, AssetPriceUpdate, CryptoPriceData, StockPriceData, PriceUpdateSettings } from './asset-price-logic';

// Net Worth Logic
export {
  calculateNetWorth,
  calculateNetWorthForPeriod,
  getNetWorthTrend,
  calculateAssetAllocationPercentages,
  getEmergencyFundStatus,
  type NetWorthData,
  type NetWorthTrend
} from './networth-logic';

// Income Logic
export {
  calculateIncomeData,
  getIncomeSources,
  getIncomeTrend,
  getNextExpectedIncome,
  getIncomeInsights,
  type IncomeData,
  type IncomeSource,
  type IncomeTrend
} from './income-logic';

// Expenses Logic
export {
  calculateExpensesData,
  getExpenseCategories,
  getSpendingPatterns,
  identifySpendingOutliers,
  getExpenseInsights,
  type ExpensesData,
  type ExpenseCategory,
  type SpendingPattern,
  type BudgetAnalysis
} from './expenses-logic';

// Savings Rate Logic
export {
  calculateSavingsRateData,
  calculateSavingsBreakdown,
  calculateSavingsTarget,
  getSavingsRateTrend,
  getSavingsRateInsights,
  type SavingsRateData,
  type SavingsBreakdown,
  type SavingsTarget,
  type SavingsRateTrend
} from './savings-rate-logic';

// Debt Ratio Logic
export {
  calculateDebtRatioData,
  getDebtBreakdown,
  calculateDebtPayoffStrategy,
  getDebtRatioTrend,
  getDebtRatioInsights,
  type DebtRatioData,
  type DebtBreakdown,
  type DebtPayoffStrategy,
  type DebtRatioTrend
} from './debt-ratio-logic';

// Asset Price Logic
export {
  getCryptoPrices,
  getStockPrices,
  updateAssetPrices,
  applyPriceUpdates,
  getPriceUpdateSummary,
  scheduleAutoUpdates,
  getAssetPerformance,
  type AssetPriceManager,
  type AssetPriceUpdate,
  type CryptoPriceData,
  type StockPriceData,
  type PriceUpdateSettings
} from './asset-price-logic';

/**
 * Comprehensive Financial Data Interface
 * Combines all financial modules into a single interface
 */
export interface ComprehensiveFinancialData {
  // Net Worth
  netWorth: NetWorthData;
  netWorthTrend: NetWorthTrend[];
  
  // Income
  income: IncomeData;
  incomeSources: IncomeSource[];
  
  // Expenses
  expenses: ExpensesData;
  expenseCategories: ExpenseCategory[];
  
  // Savings Rate
  savingsRate: SavingsRateData;
  savingsBreakdown: SavingsBreakdown;
  
  // Debt
  debtRatio: DebtRatioData;
  debtBreakdown: DebtBreakdown;
  
  // Asset Prices
  assetUpdates?: AssetPriceUpdate[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date;
}

// Financial Health Score is now in its own module
// Import from financial-health-logic.ts for modular calculation
export {
  calculateFinancialHealthScore,
  type FinancialHealthScore,
  type FinancialHealthData
} from './financial-health-logic'; 