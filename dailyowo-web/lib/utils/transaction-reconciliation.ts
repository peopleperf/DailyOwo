/**
 * Transaction Reconciliation System
 * Verifies that calculated balances match expected values
 */

import { Transaction } from '@/types/transaction';
import { 
  calculateTransactionChecksum, 
  verifyTransactionIntegrity 
} from './transaction-audit';

export interface ReconciliationResult {
  isReconciled: boolean;
  calculatedBalance: number;
  expectedBalance?: number;
  discrepancy?: number;
  issues: ReconciliationIssue[];
  recommendations: string[];
  timestamp: Date;
}

export interface ReconciliationIssue {
  type: 'MISSING_TRANSACTION' | 'DUPLICATE_TRANSACTION' | 'AMOUNT_MISMATCH' | 
        'CATEGORY_MISMATCH' | 'DATE_INCONSISTENCY' | 'BALANCE_DISCREPANCY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedTransactions?: string[];
  suggestedFix?: string;
}

export interface BalanceSnapshot {
  date: Date;
  income: number;
  expenses: number;
  assets: number;
  liabilities: number;
  netWorth: number;
  cashFlow: number;
  checksum: string;
}

export interface ReconciliationReport {
  periodStart: Date;
  periodEnd: Date;
  openingBalance: BalanceSnapshot;
  closingBalance: BalanceSnapshot;
  transactionSummary: {
    totalTransactions: number;
    incomeTransactions: number;
    expenseTransactions: number;
    assetTransactions: number;
    liabilityTransactions: number;
  };
  reconciliationResult: ReconciliationResult;
}

/**
 * Reconcile transactions against expected balance
 */
export function reconcileTransactions(
  transactions: Transaction[],
  expectedBalance?: number,
  options?: {
    startDate?: Date;
    endDate?: Date;
    accountType?: 'all' | 'cash' | 'assets' | 'liabilities';
  }
): ReconciliationResult {
  const issues: ReconciliationIssue[] = [];
  const recommendations: string[] = [];

  // Filter transactions by date range if specified
  let filteredTransactions = transactions;
  if (options?.startDate && options?.endDate) {
    filteredTransactions = transactions.filter(t => {
      const tDate = t.date instanceof Date ? t.date : new Date(t.date);
      return tDate >= options.startDate! && tDate <= options.endDate!;
    });
  }

  // Verify transaction integrity first
  const integrityCheck = verifyTransactionIntegrity(filteredTransactions);
  if (!integrityCheck.isValid) {
    integrityCheck.issues.forEach(issue => {
      issues.push({
        type: 'DUPLICATE_TRANSACTION',
        severity: 'HIGH',
        description: issue,
        suggestedFix: 'Remove duplicate transactions or merge them'
      });
    });
  }

  // Calculate balance based on account type
  let calculatedBalance = 0;
  
  switch (options?.accountType) {
    case 'cash':
      // Cash flow calculation: income - expenses
      calculatedBalance = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) -
        filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
      break;
      
    case 'assets':
      calculatedBalance = filteredTransactions
        .filter(t => t.type === 'asset')
        .reduce((sum, t) => sum + t.amount, 0);
      break;
      
    case 'liabilities':
      calculatedBalance = filteredTransactions
        .filter(t => t.type === 'liability')
        .reduce((sum, t) => sum + t.amount, 0);
      break;
      
    default:
      // Net worth calculation: (income + assets) - (expenses + liabilities)
      const totalInflows = filteredTransactions
        .filter(t => t.type === 'income' || t.type === 'asset')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalOutflows = filteredTransactions
        .filter(t => t.type === 'expense' || t.type === 'liability')
        .reduce((sum, t) => sum + t.amount, 0);
      
      calculatedBalance = totalInflows - totalOutflows;
  }

  // Check for balance discrepancy
  let isReconciled = true;
  let discrepancy: number | undefined;
  
  if (expectedBalance !== undefined) {
    discrepancy = Math.abs(calculatedBalance - expectedBalance);
    const tolerance = 0.01; // 1 cent tolerance for floating point errors
    
    if (discrepancy > tolerance) {
      isReconciled = false;
      issues.push({
        type: 'BALANCE_DISCREPANCY',
        severity: discrepancy > 1000 ? 'CRITICAL' : discrepancy > 100 ? 'HIGH' : 'MEDIUM',
        description: `Balance mismatch: calculated ${calculatedBalance.toFixed(2)}, expected ${expectedBalance.toFixed(2)}`,
        suggestedFix: 'Review recent transactions for missing or incorrect entries'
      });
      
      // Provide specific recommendations based on discrepancy
      if (calculatedBalance < expectedBalance) {
        recommendations.push('Check for missing income transactions');
        recommendations.push('Look for expense transactions that may have been recorded as higher amounts');
      } else {
        recommendations.push('Check for duplicate income entries');
        recommendations.push('Look for missing expense transactions');
      }
    }
  }

  // Check for date inconsistencies
  const futureDatedTransactions = filteredTransactions.filter(t => {
    const tDate = t.date instanceof Date ? t.date : new Date(t.date);
    return tDate > new Date();
  });

  if (futureDatedTransactions.length > 0) {
    issues.push({
      type: 'DATE_INCONSISTENCY',
      severity: 'LOW',
      description: `Found ${futureDatedTransactions.length} future-dated transactions`,
      affectedTransactions: futureDatedTransactions.map(t => t.id),
      suggestedFix: 'Review and correct transaction dates'
    });
  }

  // Check for suspicious patterns
  const largeTransactions = filteredTransactions.filter(t => t.amount > 10000);
  if (largeTransactions.length > 0) {
    recommendations.push(`Review ${largeTransactions.length} large transactions (>10,000) for accuracy`);
  }

  // Add general recommendations
  if (issues.length === 0) {
    recommendations.push('✓ All transactions appear to be in order');
  } else {
    recommendations.push('Address the identified issues to complete reconciliation');
  }

  return {
    isReconciled,
    calculatedBalance,
    expectedBalance,
    discrepancy,
    issues,
    recommendations,
    timestamp: new Date()
  };
}

/**
 * Create a balance snapshot for a specific date
 */
export function createBalanceSnapshot(
  transactions: Transaction[],
  snapshotDate: Date
): BalanceSnapshot {
  // Filter transactions up to snapshot date
  const relevantTransactions = transactions.filter(t => {
    const tDate = t.date instanceof Date ? t.date : new Date(t.date);
    return tDate <= snapshotDate;
  });

  const income = relevantTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = relevantTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const assets = relevantTransactions
    .filter(t => t.type === 'asset')
    .reduce((sum, t) => sum + t.amount, 0);

  const liabilities = relevantTransactions
    .filter(t => t.type === 'liability')
    .reduce((sum, t) => sum + t.amount, 0);

  const netWorth = assets - liabilities;
  const cashFlow = income - expenses;

  // Calculate checksum for integrity
  const checksumData = `${snapshotDate.toISOString()}|${income}|${expenses}|${assets}|${liabilities}`;
  const checksum = btoa(checksumData).substring(0, 16);

  return {
    date: snapshotDate,
    income,
    expenses,
    assets,
    liabilities,
    netWorth,
    cashFlow,
    checksum
  };
}

/**
 * Generate a full reconciliation report
 */
export function generateReconciliationReport(
  transactions: Transaction[],
  periodStart: Date,
  periodEnd: Date,
  expectedClosingBalance?: number
): ReconciliationReport {
  // Create opening balance (day before period start)
  const dayBeforePeriod = new Date(periodStart);
  dayBeforePeriod.setDate(dayBeforePeriod.getDate() - 1);
  const openingBalance = createBalanceSnapshot(transactions, dayBeforePeriod);

  // Create closing balance
  const closingBalance = createBalanceSnapshot(transactions, periodEnd);

  // Filter transactions for the period
  const periodTransactions = transactions.filter(t => {
    const tDate = t.date instanceof Date ? t.date : new Date(t.date);
    return tDate >= periodStart && tDate <= periodEnd;
  });

  // Create transaction summary
  const transactionSummary = {
    totalTransactions: periodTransactions.length,
    incomeTransactions: periodTransactions.filter(t => t.type === 'income').length,
    expenseTransactions: periodTransactions.filter(t => t.type === 'expense').length,
    assetTransactions: periodTransactions.filter(t => t.type === 'asset').length,
    liabilityTransactions: periodTransactions.filter(t => t.type === 'liability').length,
  };

  // Perform reconciliation
  const reconciliationResult = reconcileTransactions(
    transactions,
    expectedClosingBalance,
    {
      startDate: periodStart,
      endDate: periodEnd
    }
  );

  return {
    periodStart,
    periodEnd,
    openingBalance,
    closingBalance,
    transactionSummary,
    reconciliationResult
  };
}

/**
 * Find missing transactions by comparing with bank statement
 */
export function findMissingTransactions(
  recordedTransactions: Transaction[],
  bankTransactions: Array<{
    date: Date;
    amount: number;
    description: string;
  }>
): ReconciliationIssue[] {
  const issues: ReconciliationIssue[] = [];
  const tolerance = 0.01; // 1 cent tolerance

  // For each bank transaction, try to find a match
  bankTransactions.forEach(bankTx => {
    const possibleMatches = recordedTransactions.filter(recordedTx => {
      const recordedDate = recordedTx.date instanceof Date 
        ? recordedTx.date 
        : new Date(recordedTx.date);
      
      // Check if dates are within 3 days
      const dateDiff = Math.abs(bankTx.date.getTime() - recordedDate.getTime());
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      
      // Check if amounts match (considering both income and expense)
      const amountMatches = Math.abs(recordedTx.amount - Math.abs(bankTx.amount)) < tolerance;
      
      return dateDiff <= threeDaysMs && amountMatches;
    });

    if (possibleMatches.length === 0) {
      issues.push({
        type: 'MISSING_TRANSACTION',
        severity: Math.abs(bankTx.amount) > 1000 ? 'HIGH' : 'MEDIUM',
        description: `Unmatched bank transaction: ${bankTx.amount.toFixed(2)} on ${bankTx.date.toDateString()} - ${bankTx.description}`,
        suggestedFix: 'Add this transaction to your records'
      });
    }
  });

  return issues;
}

/**
 * Auto-categorize transactions based on patterns
 */
export function suggestTransactionCategories(
  transaction: Partial<Transaction>,
  historicalTransactions: Transaction[]
): {
  suggestedCategory: string;
  confidence: number;
  reason: string;
} {
  // Find similar transactions by description
  const similarTransactions = historicalTransactions.filter(t => {
    if (!transaction.description || !t.description) return false;
    
    const desc1 = transaction.description.toLowerCase();
    const desc2 = t.description.toLowerCase();
    
    // Check for common words
    const words1 = desc1.split(/\s+/);
    const words2 = desc2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w) && w.length > 3);
    
    return commonWords.length >= 2 || desc1.includes(desc2) || desc2.includes(desc1);
  });

  if (similarTransactions.length === 0) {
    return {
      suggestedCategory: 'other',
      confidence: 0,
      reason: 'No similar transactions found'
    };
  }

  // Count category occurrences
  const categoryCounts = new Map<string, number>();
  similarTransactions.forEach(t => {
    categoryCounts.set(t.categoryId, (categoryCounts.get(t.categoryId) || 0) + 1);
  });

  // Find most common category
  let suggestedCategory = 'other';
  let maxCount = 0;
  
  categoryCounts.forEach((count, category) => {
    if (count > maxCount) {
      maxCount = count;
      suggestedCategory = category;
    }
  });

  const confidence = (maxCount / similarTransactions.length) * 100;

  return {
    suggestedCategory,
    confidence,
    reason: `Based on ${similarTransactions.length} similar transactions`
  };
} 